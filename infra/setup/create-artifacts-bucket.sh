#!/usr/bin/env bash
# Creates the private S3 bucket that GitHub Actions uploads build artifacts
# (backend tarballs, frontend release snapshots) into, and that the EC2
# instance downloads from during deploy. Run once, with admin AWS credentials.
set -euo pipefail

REGION="ap-south-1"
BUCKET="algoforge-deploy-artifacts-472888338171"

echo "Creating bucket $BUCKET in $REGION..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

echo "Blocking all public access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Enabling versioning (extra safety net for artifact history)..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

echo "Adding a 90-day expiry lifecycle rule (artifacts are transient; git is the real history)..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "expire-old-artifacts",
        "Status": "Enabled",
        "Filter": {},
        "Expiration": { "Days": 90 },
        "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
      }
    ]
  }'

echo "Done. Bucket: s3://$BUCKET"
