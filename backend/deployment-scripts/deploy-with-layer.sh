#!/bin/bash

###############################################################################
# Script de despliegue de Lambda con Prisma Layer
# Uso: ./deploy-with-layer.sh <function-name> <handler-path>
# Ejemplo: ./deploy-with-layer.sh assignments lambda-functions/assignments
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="eu-west-1"
S3_BUCKET="gestion-demanda-frontend"
LAYER_NAME="gestion-demanda-prisma-layer"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate prerequisites
print_info "Validating prerequisites..."
if ! command_exists aws; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
fi

if ! command_exists jq; then
    print_error "jq not found. Please install it first."
    exit 1
fi

# Parse arguments
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <function-name> <handler-path>"
    print_info "Example: $0 assignments lambda-functions/assignments"
    exit 1
fi

FUNCTION_NAME="gestiondemanda_${1}Handler"
HANDLER_PATH="$2"
HANDLER_FILE="${HANDLER_PATH}/${1}Handler.js"

print_info "Deploying function: ${FUNCTION_NAME}"
print_info "Handler path: ${HANDLER_PATH}"

# Step 1: Check if Prisma Layer exists, create if not
print_info "Checking Prisma Layer..."
LAYER_ARN=$(aws lambda list-layer-versions \
    --layer-name ${LAYER_NAME} \
    --region ${REGION} \
    --query 'LayerVersions[0].LayerVersionArn' \
    --output text 2>/dev/null || echo "")

if [ -z "$LAYER_ARN" ] || [ "$LAYER_ARN" == "None" ]; then
    print_warning "Prisma Layer not found. Creating..."
    
    # Create layer directory structure
    cd "$(dirname "$0")/.."
    mkdir -p lambda-layer/nodejs
    
    # Install Prisma in layer
    cd lambda-layer/nodejs
    if [ ! -f "package.json" ]; then
        npm init -y
    fi
    
    npm install @prisma/client@5.22.0
    npm install prisma@5.22.0 --save-dev
    
    # Copy schema and generate client
    mkdir -p prisma
    cp ../../database/schema/schema.prisma prisma/
    npx prisma generate
    
    # Remove dev dependencies from layer
    npm uninstall prisma
    rm -rf prisma
    
    # Create layer ZIP
    cd ..
    print_info "Creating layer ZIP..."
    zip -q -r prisma-layer.zip nodejs
    
    # Upload to S3
    print_info "Uploading layer to S3..."
    aws s3 cp prisma-layer.zip s3://${S3_BUCKET}/layers/prisma-layer.zip
    
    # Publish layer
    print_info "Publishing Lambda Layer..."
    LAYER_ARN=$(aws lambda publish-layer-version \
        --layer-name ${LAYER_NAME} \
        --description "Prisma Client for Lambda functions" \
        --content S3Bucket=${S3_BUCKET},S3Key=layers/prisma-layer.zip \
        --compatible-runtimes nodejs18.x nodejs20.x \
        --region ${REGION} \
        --query 'LayerVersionArn' \
        --output text)
    
    print_success "Layer created: ${LAYER_ARN}"
    
    # Cleanup
    rm prisma-layer.zip
    cd ../..
else
    print_success "Using existing layer: ${LAYER_ARN}"
fi

# Step 2: Package Lambda function (without Prisma)
print_info "Packaging Lambda function..."
cd "$(dirname "$0")/.."

# Create temporary deployment directory
DEPLOY_DIR="lambda-deploy-${1}"
rm -rf ${DEPLOY_DIR}
mkdir -p ${DEPLOY_DIR}

# Copy handler
cp ${HANDLER_FILE} ${DEPLOY_DIR}/

# Copy shared libraries
mkdir -p ${DEPLOY_DIR}/lib
cp shared-libraries/*.js ${DEPLOY_DIR}/lib/

# Create minimal package.json (no Prisma dependencies)
cat > ${DEPLOY_DIR}/package.json <<EOF
{
  "name": "${1}-handler",
  "version": "1.0.0",
  "type": "commonjs",
  "dependencies": {}
}
EOF

# Create ZIP (small, without Prisma)
cd ${DEPLOY_DIR}
print_info "Creating function ZIP..."
zip -q -r function.zip .

# Upload to S3
print_info "Uploading function to S3..."
aws s3 cp function.zip s3://${S3_BUCKET}/lambda/${1}-handler.zip

# Step 3: Update or create Lambda function
print_info "Checking if function exists..."
FUNCTION_EXISTS=$(aws lambda get-function \
    --function-name ${FUNCTION_NAME} \
    --region ${REGION} 2>/dev/null || echo "")

if [ -z "$FUNCTION_EXISTS" ]; then
    print_warning "Function does not exist. Creating..."
    
    # Get DATABASE_URL from environment or .env
    if [ -f "../.env" ]; then
        export $(cat ../.env | grep DATABASE_URL | xargs)
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not found. Please set it in .env file."
        exit 1
    fi
    
    aws lambda create-function \
        --function-name ${FUNCTION_NAME} \
        --runtime nodejs18.x \
        --role arn:aws:iam::${ACCOUNT_ID}:role/gestion-demanda-lambda-role \
        --handler ${1}Handler.handler \
        --code S3Bucket=${S3_BUCKET},S3Key=lambda/${1}-handler.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables="{DATABASE_URL=${DATABASE_URL}}" \
        --layers ${LAYER_ARN} \
        --region ${REGION} \
        --output json > /dev/null
    
    print_success "Function created"
else
    print_info "Updating existing function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name ${FUNCTION_NAME} \
        --s3-bucket ${S3_BUCKET} \
        --s3-key lambda/${1}-handler.zip \
        --region ${REGION} \
        --output json > /dev/null
    
    # Wait for update to complete
    print_info "Waiting for function update..."
    aws lambda wait function-updated \
        --function-name ${FUNCTION_NAME} \
        --region ${REGION}
    
    # Update function configuration (ensure layer is attached)
    aws lambda update-function-configuration \
        --function-name ${FUNCTION_NAME} \
        --layers ${LAYER_ARN} \
        --region ${REGION} \
        --output json > /dev/null
    
    print_success "Function updated"
fi

# Step 4: Test function
print_info "Testing function..."
sleep 3

TEST_RESULT=$(curl -s -X GET \
    "https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod/${1}" \
    -H "x-user-team: TEAM_SPAIN" | jq -r '.success' 2>/dev/null || echo "error")

if [ "$TEST_RESULT" == "true" ]; then
    print_success "Function test passed!"
else
    print_warning "Function test returned: ${TEST_RESULT}"
    print_info "Check CloudWatch logs for details"
fi

# Cleanup
cd ..
rm -rf ${DEPLOY_DIR}

# Summary
print_success "Deployment completed!"
print_info "Function: ${FUNCTION_NAME}"
print_info "Layer: ${LAYER_ARN}"
print_info "Package size: $(aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} --query 'Configuration.CodeSize' --output text) bytes"

echo ""
print_info "To view logs:"
echo "  aws logs tail /aws/lambda/${FUNCTION_NAME} --region ${REGION} --follow"
