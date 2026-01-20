#!/bin/bash

echo "========================================"
echo "  CONFIGURE CORS - ASSIGNMENTS"
echo "========================================"
echo ""

REGION="eu-west-1"
API_NAME="gestion-demanda-api"

# Get API ID
echo "Finding API Gateway..."
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
    echo "Error: API '$API_NAME' not found"
    exit 1
fi
echo "API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/'].id" --output text)
echo "Root ID: $ROOT_ID"

# Get assignments resource ID
ASSIGNMENTS_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/assignments'].id" --output text)
echo "Assignments resource ID: $ASSIGNMENTS_ID"

# Configure OPTIONS method for CORS
echo "Configuring OPTIONS method..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $ASSIGNMENTS_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --no-api-key-required

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $ASSIGNMENTS_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}'

aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $ASSIGNMENTS_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters \
        "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false"

aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $ASSIGNMENTS_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters \
        "method.response.header.Access-Control-Allow-Headers='Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS',method.response.header.Access-Control-Allow-Origin='*'"

# Deploy API
echo "Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --region $REGION \
    --stage-name prod \
    --description "Configure CORS for assignments endpoint"

echo ""
echo "========================================"
echo "  CONFIGURATION COMPLETE"
echo "========================================"
echo ""
echo "Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod/assignments"
echo "CORS enabled for all origins"
