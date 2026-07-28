#!/usr/bin/env bash
# Provisions a full staging environment mirroring production: a new S3
# bucket, CloudFront distribution, EC2 instance, and security group.
#
# *** THIS CREATES REAL, BILLABLE AWS RESOURCES. *** Review it before running.
# Rough monthly cost: ~$7-8 for a t3.micro EC2 instance, a few cents for S3,
# CloudFront is pay-per-request (negligible at staging traffic levels).
#
# Run with admin AWS credentials: bash infra/setup/create-staging-environment.sh --yes
set -euo pipefail

if [ "${1:-}" != "--yes" ]; then
  echo "This creates billable AWS resources (EC2 t3.micro, CloudFront, S3)."
  echo "Re-run with --yes to proceed: bash $0 --yes"
  exit 1
fi

REGION="ap-south-1"
ACCOUNT_ID="472888338171"
STAGING_BUCKET="algoforge-frontend-staging-${ACCOUNT_ID}"
VPC_ID="vpc-0592acf84db13dacc"       # same VPC as production
SUBNET_ID="subnet-04cbe1baf3fe6d91d" # same subnet as production
AMI_ID="ami-01971107641e9b67d"       # same AMI as production
KEY_NAME="algoforge-key"             # reuse the existing key pair
SSH_CIDR="49.36.180.66/32"           # same restriction as production

echo "== 1. Staging frontend S3 bucket =="
aws s3api create-bucket --bucket "$STAGING_BUCKET" --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"
aws s3api put-public-access-block --bucket "$STAGING_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "== 2. Staging security group (mirrors algoforge-sg: 80 from CloudFront only, 22 from your IP) =="
SG_ID=$(aws ec2 create-security-group \
  --group-name algoforge-staging-sg \
  --description "AlgoForge staging backend" \
  --vpc-id "$VPC_ID" --region "$REGION" \
  --query 'GroupId' --output text)

CLOUDFRONT_PREFIX_LIST=$(aws ec2 describe-managed-prefix-lists --region "$REGION" \
  --filters "Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing" \
  --query 'PrefixLists[0].PrefixListId' --output text)

aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --region "$REGION" \
  --ip-permissions "IpProtocol=tcp,FromPort=80,ToPort=80,PrefixListIds=[{PrefixListId=$CLOUDFRONT_PREFIX_LIST}]"
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --region "$REGION" \
  --ip-permissions "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=$SSH_CIDR}]"

echo "== 3. Staging EC2 instance (t3.micro, same AMI as production) =="
echo "NOTE: attach AlgoForgeBackendSSMProfile to this instance after infra/setup/apply-iam-updates.sh has run."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t3.micro \
  --key-name "$KEY_NAME" \
  --subnet-id "$SUBNET_ID" \
  --security-group-ids "$SG_ID" \
  --iam-instance-profile Name=AlgoForgeBackendSSMProfile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=algoforge-backend-staging}]' \
  --region "$REGION" \
  --query 'Instances[0].InstanceId' --output text)

echo "== 4. Staging CloudFront distribution =="
DIST_OUTPUT=$(aws cloudfront create-distribution --region "$REGION" --distribution-config '{
  "CallerReference": "algoforge-staging-frontend-'"$(date +%s)"'",
  "Comment": "AlgoForge staging frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "staging-s3-origin",
      "DomainName": "'"$STAGING_BUCKET"'.s3.'"$REGION"'.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "staging-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponseCode": "200", "ResponsePagePath": "/index.html", "ErrorCachingMinTTL": 10 },
      { "ErrorCode": 404, "ResponseCode": "200", "ResponsePagePath": "/index.html", "ErrorCachingMinTTL": 10 }
    ]
  }
}')
DIST_ID=$(echo "$DIST_OUTPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).Distribution.Id))")
DIST_DOMAIN=$(echo "$DIST_OUTPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).Distribution.DomainName))")

echo ""
echo "=================================================================="
echo "Staging environment created:"
echo "  S3 bucket:              $STAGING_BUCKET"
echo "  EC2 instance:            $INSTANCE_ID"
echo "  Security group:          $SG_ID"
echo "  CloudFront distribution: $DIST_ID ($DIST_DOMAIN)"
echo ""
echo "Next steps:"
echo "  1. Fix the CloudFront origin's Origin Access Control (this quick"
echo "     script leaves S3OriginConfig without OAC — set it up in the"
echo "     console, same as production, so the bucket stays private)."
echo "  2. Set up the box the same way as production: shared/.env,"
echo "     shared/ecosystem.config.js, a DATABASE_URL for a staging Postgres DB."
echo "  3. Fill in the <STAGING_...> placeholders in"
echo "     infra/iam/github-actions-permissions-policy.json with:"
echo "       STAGING_S3_BUCKET_NAME = $STAGING_BUCKET"
echo "       STAGING_CLOUDFRONT_DISTRIBUTION_ID = $DIST_ID"
echo "       STAGING_EC2_INSTANCE_ID = $INSTANCE_ID"
echo "     then re-run: bash infra/setup/apply-iam-updates.sh"
echo "  4. Add these as GitHub Environment variables under the 'staging'"
echo "     environment (Settings -> Environments -> staging):"
echo "       S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, EC2_INSTANCE_ID"
echo "=================================================================="
