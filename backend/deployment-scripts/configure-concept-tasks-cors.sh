#!/bin/bash

# Configure CORS for Concept Tasks endpoints
# This script adds OPTIONS methods and CORS headers to all concept-tasks endpoints

set -e

echo "======================================"
echo "Configuring CORS for Concept Tasks"
echo "======================================"

# Configuration
API_ID="xrqo2gedpl"
REGION="eu-west-1"

echo ""
echo "API ID: $API_ID"
echo ""

# Get resource IDs
echo "Step 1: Getting resource IDs..."
CONCEPT_TASKS_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/concept-tasks`].id' --output text)
ID_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/concept-tasks/{id}`].id' --output text)

echo "Concept Tasks Resource ID: $CONCEPT_TASKS_ID"
echo "ID Resource ID: $ID_RESOURCE_ID"

# Function to add OPTIONS method and CORS to a resource
add_cors_to_resource() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo ""
    echo "Configuring CORS for $RESOURCE_PATH..."
    
    # Create OPTIONS method
    echo "  Creating OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION 2>/dev/null || echo "  OPTIONS method already exists"
    
    # Create MOCK integration for OPTIONS
    echo "  Creating MOCK integration..."
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region $REGION 2>/dev/null || echo "  MOCK integration already exists"
    
    # Create method response for OPTIONS
    echo "  Creating method response..."
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
        --region $REGION 2>/dev/null || echo "  Method response already exists"
    
    # Create integration response for OPTIONS
    echo "  Creating integration response..."
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
        --region $REGION 2>/dev/null || echo "  Integration response already exists"
    
    # Add CORS headers to existing methods
    for METHOD in GET POST PUT DELETE; do
        # Check if method exists
        METHOD_EXISTS=$(aws apigateway get-method \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --region $REGION 2>/dev/null || echo "")
        
        if [ -n "$METHOD_EXISTS" ]; then
            echo "  Adding CORS headers to $METHOD method..."
            
            # Add method response with CORS headers
            aws apigateway put-method-response \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method $METHOD \
                --status-code 200 \
                --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false}' \
                --region $REGION 2>/dev/null || echo "    Method response already configured"
            
            # Add integration response with CORS headers
            aws apigateway put-integration-response \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method $METHOD \
                --status-code 200 \
                --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
                --region $REGION 2>/dev/null || echo "    Integration response already configured"
        fi
    done
}

# Configure CORS for /concept-tasks
add_cors_to_resource "$CONCEPT_TASKS_ID" "/concept-tasks"

# Configure CORS for /concept-tasks/{id}
add_cors_to_resource "$ID_RESOURCE_ID" "/concept-tasks/{id}"

# Deploy API
echo ""
echo "Step 2: Deploying API to prod stage..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Add CORS to concept-tasks endpoints" \
    --region $REGION

echo ""
echo "======================================"
echo "✅ CORS configured successfully!"
echo "======================================"
echo ""
echo "CORS headers added to:"
echo "  - GET, POST /concept-tasks"
echo "  - GET, PUT, DELETE /concept-tasks/{id}"
echo "  - OPTIONS methods created for preflight requests"
echo ""
echo "Allowed origins: *"
echo "Allowed headers: Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, x-user-team"
echo "Allowed methods: GET, POST, PUT, DELETE, OPTIONS"
