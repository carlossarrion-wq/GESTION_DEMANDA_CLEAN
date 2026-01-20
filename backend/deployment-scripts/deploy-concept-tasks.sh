#!/bin/bash

# Deploy Concept Tasks Lambda Handler
# This script deploys the concept tasks handler to AWS Lambda

set -e

echo "======================================"
echo "Deploying Concept Tasks Lambda Handler"
echo "======================================"

# Configuration
FUNCTION_NAME="gestiondemanda_conceptTasksHandler"
HANDLER="functions/conceptTasksHandler.handler"
RUNTIME="nodejs18.x"
ROLE_ARN="arn:aws:iam::701055077130:role/gestion-demanda-lambda-role"
REGION="eu-west-1"

# Create deployment package
echo ""
echo "Step 1: Creating deployment package..."
cd lambda-all-handlers

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create zip file
echo "Creating zip file..."
zip -r ../concept-tasks-lambda.zip . -x "*.git*" "node_modules/@prisma/engines/*" "*.md"

cd ..

# Deploy to Lambda
echo ""
echo "Step 2: Deploying to AWS Lambda..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "Function exists, updating code..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://concept-tasks-lambda.zip \
        --region $REGION
    
    echo "Waiting for update to complete..."
    aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION
    
    echo "Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --handler $HANDLER \
        --runtime $RUNTIME \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={DATABASE_URL=$DATABASE_URL,NODE_ENV=production}" \
        --region $REGION
else
    echo "Function does not exist, creating..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://concept-tasks-lambda.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={DATABASE_URL=$DATABASE_URL,NODE_ENV=production}" \
        --region $REGION
fi

# Clean up
echo ""
echo "Step 3: Cleaning up..."
rm concept-tasks-lambda.zip

echo ""
echo "======================================"
echo "✅ Deployment completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway to route /concept-tasks to this Lambda"
echo "2. Test the endpoints with Postman or curl"
echo "3. Update frontend to use the new endpoints"
echo ""
echo "Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text
