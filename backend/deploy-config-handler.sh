#!/bin/bash

# Deploy Config Handler Lambda
# This script creates/updates the Lambda function for configuration management

set -e

echo "🚀 Deploying Config Handler Lambda..."

# Variables
FUNCTION_NAME="gestiondemanda_configHandler"
HANDLER="functions/configHandler.handler"
RUNTIME="nodejs18.x"
ROLE_ARN="arn:aws:iam::701055077130:role/lambda-execution-role"
REGION="eu-west-1"

# Navigate to lambda directory
cd "$(dirname "$0")/lambda-all-handlers"

echo "📦 Installing dependencies..."
npm install --production

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "📦 Creating deployment package..."
zip -r config-handler.zip . \
  -x "*.git*" \
  -x "node_modules/@prisma/engines/*" \
  -x "prisma/migrations/*" \
  -x "*.md" \
  -x "*.log"

echo "☁️  Checking if Lambda function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "📝 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://config-handler.zip \
        --region $REGION
    
    echo "⚙️  Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --handler $HANDLER \
        --runtime $RUNTIME \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={DATABASE_URL=$DATABASE_URL}" \
        --region $REGION
else
    echo "🆕 Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://config-handler.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={DATABASE_URL=$DATABASE_URL}" \
        --region $REGION
fi

echo "🧹 Cleaning up..."
rm config-handler.zip

echo "✅ Config Handler Lambda deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
