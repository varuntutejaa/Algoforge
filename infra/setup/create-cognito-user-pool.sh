#!/usr/bin/env bash
# Creates the AWS Cognito User Pool + App Client backing AlgoForge auth.
# Run once, with admin AWS credentials (the scoped algoforge-deploy user
# deliberately has no Cognito permissions).
#
#   bash infra/setup/create-cognito-user-pool.sh
#
# Decisions baked in (matching the app's earlier Firebase behavior as
# closely as possible, see docs/DEPLOYMENT.md / conversation history):
#   - Email as the sign-in username (case-insensitive)
#   - Email verification REQUIRED before first login (Cognito auto-sends a
#     code on signup; the app has a "confirm your email" step for this)
#   - Password: min 8 chars, upper+lower+number, no symbol requirement
#   - No Google/social login wired yet (dropped for this iteration)
#   - No client secret (this is a public SPA client, called from the browser)
set -euo pipefail

REGION="ap-south-1"
POOL_NAME="AlgoForgeUserPool"
CLIENT_NAME="AlgoForgeWebClient"

echo "Creating Cognito User Pool..."
POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "$POOL_NAME" \
  --region "$REGION" \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --schema '[
    {"Name":"email","AttributeDataType":"String","Required":true,"Mutable":true},
    {"Name":"name","AttributeDataType":"String","Required":false,"Mutable":true}
  ]' \
  --admin-create-user-config '{"AllowAdminCreateUserOnly": false}' \
  --account-recovery-setting '{
    "RecoveryMechanisms": [{"Priority": 1, "Name": "verified_email"}]
  }' \
  --query 'UserPool.Id' --output text)

echo "User Pool ID: $POOL_ID"

echo "Creating App Client (public, no secret)..."
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --region "$REGION" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --prevent-user-existence-errors ENABLED \
  --access-token-validity 60 \
  --id-token-validity 60 \
  --refresh-token-validity 30 \
  --token-validity-units '{"AccessToken":"minutes","IdToken":"minutes","RefreshToken":"days"}' \
  --query 'UserPoolClient.ClientId' --output text)

echo "Client ID: $CLIENT_ID"
echo ""
echo "=================================================================="
echo "Done. Add these values:"
echo ""
echo "backend/.env (and shared/.env on EC2):"
echo "  COGNITO_USER_POOL_ID=$POOL_ID"
echo "  COGNITO_CLIENT_ID=$CLIENT_ID"
echo ""
echo "frontend/.env:"
echo "  VITE_COGNITO_USER_POOL_ID=$POOL_ID"
echo "  VITE_COGNITO_CLIENT_ID=$CLIENT_ID"
echo ""
echo "GitHub Environment variables (production/staging, for the deploy"
echo "pipeline to inject at deploy time, if you wire that up later):"
echo "  COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID"
echo "=================================================================="
