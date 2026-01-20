#!/bin/bash

# Script para desplegar el handler de Jira a AWS Lambda
echo "=== Desplegando Jira Handler a AWS Lambda ==="

# Variables
FUNCTION_NAME="gestion-demanda-jira-handler"
REGION="eu-west-1"
ACCOUNT_ID="701055077130"
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/gestion-demanda-lambda-role"
TEMP_DIR="lambda-jira-temp"
ZIP_FILE="lambda-jira.zip"

# Limpiar directorio temporal si existe
if [ -d "$TEMP_DIR" ]; then
    echo "Limpiando directorio temporal..."
    rm -rf "$TEMP_DIR"
fi

# Crear directorio temporal con estructura correcta
echo "Creando directorio temporal..."
mkdir -p "$TEMP_DIR/functions"
mkdir -p "$TEMP_DIR/lib"

# Copiar archivos desde lambda-functions/jira manteniendo la estructura
echo "Copiando archivos desde lambda-functions/jira..."
cp ../lambda-functions/jira/jiraHandler.js "$TEMP_DIR/functions/"
cp ../lambda-functions/jira/jiraConfig.js "$TEMP_DIR/functions/"

# Copiar librerías compartidas
echo "Copiando librerías compartidas..."
cp ../shared-libraries/*.js "$TEMP_DIR/lib/"

# Crear package.json
echo "Creando package.json..."
cat > "$TEMP_DIR/package.json" << 'EOF'
{
  "name": "lambda-jira-handler",
  "version": "1.0.0",
  "main": "jiraHandler.js",
  "dependencies": {
    "@prisma/client": "^5.22.0"
  }
}
EOF

# Copiar Prisma Client
echo "Copiando Prisma Client..."
mkdir -p "$TEMP_DIR/node_modules"

# Buscar Prisma Client en varias ubicaciones
if [ -d "../node_modules/@prisma" ] && [ -d "../node_modules/.prisma" ]; then
    echo "Copiando Prisma Client desde backend/node_modules..."
    cp -r ../node_modules/@prisma "$TEMP_DIR/node_modules/"
    cp -r ../node_modules/.prisma "$TEMP_DIR/node_modules/"
elif [ -d "../lambda-all-handlers/node_modules/@prisma" ] && [ -d "../lambda-all-handlers/node_modules/.prisma" ]; then
    echo "Copiando Prisma Client desde lambda-all-handlers..."
    cp -r ../lambda-all-handlers/node_modules/@prisma "$TEMP_DIR/node_modules/"
    cp -r ../lambda-all-handlers/node_modules/.prisma "$TEMP_DIR/node_modules/"
else
    echo "⚠ Prisma Client no encontrado, instalando y generando..."
    cd "$TEMP_DIR"
    npm install @prisma/client@5.22.0 --silent
    npx prisma generate
    cd ..
fi

# Copiar schema de Prisma
echo "Copiando schema de Prisma..."
mkdir -p "$TEMP_DIR/prisma"
if [ -f "../lambda-all-handlers/prisma/schema.prisma" ]; then
    cp ../lambda-all-handlers/prisma/schema.prisma "$TEMP_DIR/prisma/"
elif [ -f "../prisma/schema.prisma" ]; then
    cp ../prisma/schema.prisma "$TEMP_DIR/prisma/"
else
    echo "⚠ Schema de Prisma no encontrado"
fi

# Crear ZIP
echo "Creando archivo ZIP..."
rm -f "$ZIP_FILE"
cd "$TEMP_DIR"
zip -r "../$ZIP_FILE" . -q
cd ..

# Verificar si la función Lambda existe
echo "Verificando función Lambda..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "Actualizando función Lambda existente..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        echo "✓ Función Lambda actualizada exitosamente!"
    else
        echo "✗ Error actualizando función Lambda"
        exit 1
    fi
else
    echo "Creando nueva función Lambda..."
    
    # Obtener DATABASE_URL del .env
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime nodejs18.x \
        --role "$ROLE_ARN" \
        --handler jiraHandler.handler \
        --zip-file "fileb://$ZIP_FILE" \
        --timeout 30 \
        --memory-size 512 \
        --region "$REGION" \
        --environment "Variables={DATABASE_URL=$DATABASE_URL}"
    
    if [ $? -eq 0 ]; then
        echo "✓ Función Lambda creada exitosamente!"
    else
        echo "✗ Error creando función Lambda"
        exit 1
    fi
fi

# Configurar variables de entorno (DATABASE_URL + Jira)
echo "Configurando variables de entorno..."
if [ -f "../.env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" ../.env | cut -d '=' -f2- | tr -d '"')
    JIRA_EMAIL=$(grep "^JIRA_EMAIL=" ../.env | cut -d '=' -f2- | tr -d '"')
    JIRA_API_TOKEN=$(grep "^JIRA_API_TOKEN=" ../.env | cut -d '=' -f2- | tr -d '"')
    JIRA_URL_GADEA=$(grep "^JIRA_URL_GADEA=" ../.env | cut -d '=' -f2- | tr -d '"')
    JIRA_JQL_GADEA=$(grep "^JIRA_JQL_GADEA=" ../.env | cut -d '=' -f2- | tr -d '"')
    
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment "Variables={DATABASE_URL=$DATABASE_URL,JIRA_EMAIL=$JIRA_EMAIL,JIRA_API_TOKEN=$JIRA_API_TOKEN,JIRA_URL_GADEA=$JIRA_URL_GADEA,JIRA_JQL_GADEA=$JIRA_JQL_GADEA}" \
        --region "$REGION" &> /dev/null
    
    echo "✓ Variables de entorno configuradas (DATABASE_URL + Jira)"
else
    echo "⚠ Archivo .env no encontrado"
fi

echo ""
echo "=== Configurando CORS en API Gateway ==="

# Variables para API Gateway
API_ID="xrqo2gedpl"
API_REGION="eu-west-1"

# Obtener el ID del recurso /jira
echo "Buscando recurso /jira..."
JIRA_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$API_REGION" \
    --query "items[?path=='/jira'].id" \
    --output text)

if [ -z "$JIRA_RESOURCE_ID" ]; then
    echo "⚠ No se encontró el recurso /jira"
else
    echo "✓ Recurso /jira encontrado: $JIRA_RESOURCE_ID"
    
    # Obtener el ID del recurso /jira/issues
    echo "Buscando recurso /jira/issues..."
    ISSUES_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --region "$API_REGION" \
        --query "items[?path=='/jira/issues'].id" \
        --output text)
    
    if [ -z "$ISSUES_RESOURCE_ID" ]; then
        echo "⚠ No se encontró el recurso /jira/issues"
    else
        echo "✓ Recurso /jira/issues encontrado: $ISSUES_RESOURCE_ID"
        
        # Verificar si ya existe el método OPTIONS
        echo "Verificando método OPTIONS..."
        OPTIONS_EXISTS=$(aws apigateway get-method \
            --rest-api-id "$API_ID" \
            --resource-id "$ISSUES_RESOURCE_ID" \
            --http-method OPTIONS \
            --region "$API_REGION" 2>&1)
        
        if echo "$OPTIONS_EXISTS" | grep -q "NotFoundException"; then
            echo "Creando método OPTIONS para CORS..."
            
            # Crear método OPTIONS
            aws apigateway put-method \
                --rest-api-id "$API_ID" \
                --resource-id "$ISSUES_RESOURCE_ID" \
                --http-method OPTIONS \
                --authorization-type NONE \
                --region "$API_REGION" &> /dev/null
            
            # Crear integración MOCK para OPTIONS
            aws apigateway put-integration \
                --rest-api-id "$API_ID" \
                --resource-id "$ISSUES_RESOURCE_ID" \
                --http-method OPTIONS \
                --type MOCK \
                --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
                --region "$API_REGION" &> /dev/null
            
            # Crear respuesta del método OPTIONS
            aws apigateway put-method-response \
                --rest-api-id "$API_ID" \
                --resource-id "$ISSUES_RESOURCE_ID" \
                --http-method OPTIONS \
                --status-code 200 \
                --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
                --region "$API_REGION" &> /dev/null
            
            # Crear respuesta de integración OPTIONS
            aws apigateway put-integration-response \
                --rest-api-id "$API_ID" \
                --resource-id "$ISSUES_RESOURCE_ID" \
                --http-method OPTIONS \
                --status-code 200 \
                --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' \
                --region "$API_REGION" &> /dev/null
            
            echo "✓ Método OPTIONS creado"
        else
            echo "✓ Método OPTIONS ya existe"
        fi
        
        # Desplegar cambios
        echo "Desplegando cambios en API Gateway..."
        aws apigateway create-deployment \
            --rest-api-id "$API_ID" \
            --stage-name prod \
            --description "Configuración CORS para Jira" \
            --region "$API_REGION" &> /dev/null
        
        echo "✓ CORS configurado y desplegado"
    fi
fi

echo ""
echo "=== Despliegue completado ==="
echo "Función Lambda: $FUNCTION_NAME"
echo "API Gateway: $API_ID"
echo ""

# Limpiar
echo "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"

echo "✓ Listo!"
