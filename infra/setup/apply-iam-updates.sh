#!/usr/bin/env bash
# Idempotent: creates AlgoForgeGitHubActionsRole / AlgoForgeBackendSSMRole if
# they don't exist yet, and (re-)applies the current policy documents from
# infra/iam/ either way. Safe to re-run any time the JSON files change.
#
# IMPORTANT: fill in the <STAGING_...> placeholders in
# infra/iam/github-actions-permissions-policy.json (via
# create-staging-environment.sh) before this grants staging access.
#
# Run with admin AWS credentials, from the repo root:
#   bash infra/setup/apply-iam-updates.sh
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
IAM_DIR="$(pwd)/iam"

echo "== GitHub Actions OIDC provider =="
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  2>/dev/null || echo "(already exists, skipping)"

echo "== AlgoForgeGitHubActionsRole =="
if aws iam get-role --role-name AlgoForgeGitHubActionsRole >/dev/null 2>&1; then
  echo "role exists, updating trust policy"
  aws iam update-assume-role-policy \
    --role-name AlgoForgeGitHubActionsRole \
    --policy-document "file://$IAM_DIR/github-actions-trust-policy.json"
else
  echo "creating role"
  aws iam create-role \
    --role-name AlgoForgeGitHubActionsRole \
    --assume-role-policy-document "file://$IAM_DIR/github-actions-trust-policy.json"
fi

echo "applying permissions policy"
aws iam put-role-policy \
  --role-name AlgoForgeGitHubActionsRole \
  --policy-name AlgoForgeDeployPermissions \
  --policy-document "file://$IAM_DIR/github-actions-permissions-policy.json"

echo "== AlgoForgeBackendSSMRole =="
if aws iam get-role --role-name AlgoForgeBackendSSMRole >/dev/null 2>&1; then
  echo "role exists"
else
  echo "creating role"
  aws iam create-role \
    --role-name AlgoForgeBackendSSMRole \
    --assume-role-policy-document "file://$IAM_DIR/ec2-ssm-trust-policy.json"
  aws iam attach-role-policy \
    --role-name AlgoForgeBackendSSMRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
  aws iam create-instance-profile --instance-profile-name AlgoForgeBackendSSMProfile
  aws iam add-role-to-instance-profile \
    --instance-profile-name AlgoForgeBackendSSMProfile \
    --role-name AlgoForgeBackendSSMRole
  echo "NOTE: attach the instance profile to your EC2 instance(s):"
  echo "  aws ec2 associate-iam-instance-profile --instance-id <id> --iam-instance-profile Name=AlgoForgeBackendSSMProfile --region ap-south-1"
fi

echo "applying artifacts-read policy (lets the box pull deploy tarballs via its own role, no static keys)"
aws iam put-role-policy \
  --role-name AlgoForgeBackendSSMRole \
  --policy-name AlgoForgeArtifactsRead \
  --policy-document "file://$IAM_DIR/ec2-artifacts-read-policy.json"

echo "Done."
