# Script de Despliegue Lambda con Prisma Layer

## deploy-with-layer.sh

Script universal para desplegar funciones Lambda con Prisma usando Lambda Layers.

### Ventajas

✅ **Tamaño reducido**: ~8KB vs ~40MB  
✅ **Despliegue rápido**: 5-10 segundos vs 2-3 minutos  
✅ **Reutilización**: Un layer compartido entre todas las funciones  
✅ **Mantenimiento simple**: Actualizar Prisma en un solo lugar  

### Uso

```bash
cd backend/deployment-scripts
./deploy-with-layer.sh <function-name> <handler-path>
```

### Ejemplos

```bash
# Desplegar función assignments
./deploy-with-layer.sh assignments lambda-functions/assignments

# Desplegar función capacity
./deploy-with-layer.sh capacity lambda-functions/capacity

# Desplegar función resources
./deploy-with-layer.sh resources lambda-functions/resources
```

### Qué hace

1. Verifica prerequisitos (AWS CLI, jq)
2. Crea/reutiliza el Prisma Layer (solo primera vez)
3. Empaqueta la función (sin Prisma)
4. Despliega a AWS Lambda
5. Prueba la función

### Requisitos

- AWS CLI configurado
- jq instalado: `brew install jq`
- Archivo `.env` con DATABASE_URL

### Ver logs

```bash
aws logs tail /aws/lambda/gestiondemanda_<function>Handler --region eu-west-1 --follow
