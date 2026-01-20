#!/bin/bash

# Script para configurar CORS en los endpoints de skills
# Uso: ./configure-skills-cors.sh

set -e

echo "🔧 Configurando CORS para endpoints de skills..."

# Variables
API_ID="xrqo2gedpl"
REGION="eu-west-1"
STAGE="prod"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Obteniendo recursos de la API...${NC}"

# Obtener el ID del recurso /resources
RESOURCES_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "items[?path=='/resources'].id" \
    --output text)

if [ -z "$RESOURCES_RESOURCE_ID" ]; then
    echo -e "${RED}❌ No se encontró el recurso /resources${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Recurso /resources encontrado: $RESOURCES_RESOURCE_ID${NC}"

# Obtener el ID del recurso /resources/{id}
RESOURCE_ID_RESOURCE=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "items[?path=='/resources/{id}'].id" \
    --output text)

if [ -z "$RESOURCE_ID_RESOURCE" ]; then
    echo -e "${RED}❌ No se encontró el recurso /resources/{id}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Recurso /resources/{id} encontrado: $RESOURCE_ID_RESOURCE${NC}"

# Verificar si existe el recurso /resources/{id}/skills
SKILLS_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "items[?path=='/resources/{id}/skills'].id" \
    --output text)

if [ -z "$SKILLS_RESOURCE_ID" ]; then
    echo -e "${YELLOW}⚠️  Recurso /resources/{id}/skills no existe, creándolo...${NC}"
    
    # Crear el recurso /skills bajo /resources/{id}
    SKILLS_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --region $REGION \
        --parent-id $RESOURCE_ID_RESOURCE \
        --path-part "skills" \
        --query 'id' \
        --output text)
    
    echo -e "${GREEN}✓ Recurso /resources/{id}/skills creado: $SKILLS_RESOURCE_ID${NC}"
else
    echo -e "${GREEN}✓ Recurso /resources/{id}/skills encontrado: $SKILLS_RESOURCE_ID${NC}"
fi

# Función para configurar método OPTIONS
configure_options_method() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo -e "${YELLOW}📝 Configurando método OPTIONS para $RESOURCE_PATH...${NC}"
    
    # Verificar si el método OPTIONS ya existe
    OPTIONS_EXISTS=$(aws apigateway get-method \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        2>/dev/null || echo "not_found")
    
    if [ "$OPTIONS_EXISTS" = "not_found" ]; then
        # Crear método OPTIONS
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --region $REGION \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --authorization-type NONE \
            --no-api-key-required
        
        echo -e "${GREEN}✓ Método OPTIONS creado${NC}"
    else
        echo -e "${GREEN}✓ Método OPTIONS ya existe${NC}"
    fi
    
    # Configurar integración MOCK
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        2>/dev/null || true
    
    # Configurar respuesta del método
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": false,
            "method.response.header.Access-Control-Allow-Methods": false,
            "method.response.header.Access-Control-Allow-Origin": false
        }' \
        2>/dev/null || true
    
    # Configurar respuesta de integración
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'"'"'",
            "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'",
            "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"
        }' \
        2>/dev/null || true
    
    echo -e "${GREEN}✓ CORS configurado para $RESOURCE_PATH${NC}"
}

# Configurar CORS para /resources/{id}/skills
configure_options_method "$SKILLS_RESOURCE_ID" "/resources/{id}/skills"

# Verificar si existen los métodos POST y DELETE para skills
echo -e "${YELLOW}📝 Verificando métodos POST y DELETE para skills...${NC}"

# Verificar método POST
POST_EXISTS=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $SKILLS_RESOURCE_ID \
    --http-method POST \
    2>/dev/null || echo "not_found")

if [ "$POST_EXISTS" = "not_found" ]; then
    echo -e "${YELLOW}⚠️  Método POST no existe para /resources/{id}/skills${NC}"
    echo -e "${YELLOW}   Necesitas configurar la integración con Lambda para este método${NC}"
else
    echo -e "${GREEN}✓ Método POST existe${NC}"
fi

# Verificar método DELETE
DELETE_EXISTS=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $SKILLS_RESOURCE_ID \
    --http-method DELETE \
    2>/dev/null || echo "not_found")

if [ "$DELETE_EXISTS" = "not_found" ]; then
    echo -e "${YELLOW}⚠️  Método DELETE no existe para /resources/{id}/skills${NC}"
    echo -e "${YELLOW}   Necesitas configurar la integración con Lambda para este método${NC}"
else
    echo -e "${GREEN}✓ Método DELETE existe${NC}"
fi

# Desplegar cambios
echo -e "${YELLOW}🚀 Desplegando cambios a stage $STAGE...${NC}"

aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --region $REGION \
    --stage-name $STAGE \
    --description "Configuración CORS para endpoints de skills"

echo -e "${GREEN}✅ CORS configurado exitosamente para endpoints de skills${NC}"
echo -e "${GREEN}   URL: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/resources/{id}/skills${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "   Si los métodos POST y DELETE no existen, necesitas:"
echo -e "   1. Crear un handler Lambda para gestionar skills"
echo -e "   2. Configurar la integración en API Gateway"
echo -e "   3. Volver a ejecutar este script"
