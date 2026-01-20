# Configuración de Jira por Equipo

Este documento explica cómo configurar la integración con Jira para múltiples equipos.

## 📋 Resumen

La aplicación soporta múltiples equipos, cada uno con su propia configuración de Jira:
- **Credenciales comunes**: Email y API Token compartidos
- **URLs específicas**: Cada equipo puede tener su propia URL de Jira
- **JQL personalizado**: Consultas JQL específicas por equipo

## 🔧 Configuración

### 1. Crear archivo `.env`

Copia el archivo `.env.example` a `.env`:

```bash
cp backend/.env.example backend/.env
```

### 2. Configurar credenciales comunes

Edita `backend/.env` y configura las credenciales de Jira:

```env
# Jira Integration - Common Credentials
JIRA_EMAIL=tu.email@naturgy.com
JIRA_API_TOKEN=tu_token_aqui
```

#### Cómo obtener el API Token:

1. Ve a: https://id.atlassian.com/manage-profile/security/api-tokens
2. Haz clic en "Create API token"
3. Dale un nombre descriptivo (ej: "Capacity Planning App")
4. Copia el token generado
5. Pégalo en `JIRA_API_TOKEN`

### 3. Configurar equipos

Para cada equipo, añade dos variables:

```env
# Equipo GADEA
JIRA_URL_GADEA=https://naturgy-adn.atlassian.net
JIRA_JQL_GADEA=project = 'NC' AND status != 'Closed'

# Equipo TEAM2 (ejemplo)
JIRA_URL_TEAM2=https://naturgy-adn.atlassian.net
JIRA_JQL_TEAM2=project = 'TEAM2' AND status != 'Closed'
```

**Formato de variables:**
- `JIRA_URL_{TEAM}`: URL de Jira (en mayúsculas)
- `JIRA_JQL_{TEAM}`: Consulta JQL por defecto (opcional)

## 📝 Ejemplo Completo

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# AWS Configuration
AWS_REGION=eu-west-1
AWS_ACCOUNT_ID=123456789012

# Jira Integration - Common Credentials
JIRA_EMAIL=integracion@naturgy.com
JIRA_API_TOKEN=ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz

# Jira Integration - Team: GADEA
JIRA_URL_GADEA=https://naturgy-adn.atlassian.net
JIRA_JQL_GADEA=project = 'NC' AND status != 'Closed'

# Jira Integration - Team: OPERATIONS
JIRA_URL_OPERATIONS=https://naturgy-adn.atlassian.net
JIRA_JQL_OPERATIONS=project = 'OPS' AND status != 'Closed'

# Jira Integration - Team: DEVELOPMENT
JIRA_URL_DEVELOPMENT=https://naturgy-adn.atlassian.net
JIRA_JQL_DEVELOPMENT=project = 'DEV' AND status != 'Closed'
```

## 🚀 Añadir Nuevo Equipo

Para añadir un nuevo equipo, simplemente añade dos líneas en `.env`:

```env
JIRA_URL_NUEVOTEAM=https://naturgy-adn.atlassian.net
JIRA_JQL_NUEVOTEAM=project = 'NUEVO' AND status != 'Closed'
```

**No se necesita cambiar código**, solo configuración.

## 🔒 Seguridad

### Archivo `.env`

El archivo `.env` contiene información sensible y **NO debe subirse a Git**.

Verifica que `.gitignore` incluya:

```gitignore
.env
.env.local
.env.*.local
```

### Variables de Entorno en Producción

En producción, configura las variables de entorno en:

- **AWS Lambda**: Variables de entorno de la función
- **AWS Secrets Manager**: Para máxima seguridad (recomendado)
- **AWS Systems Manager Parameter Store**: Alternativa a Secrets Manager

## 🧪 Verificar Configuración

Para verificar que la configuración es correcta:

1. **Backend**: Las credenciales se cargan automáticamente desde `.env`
2. **Frontend**: No necesita configuración (usa el backend)
3. **Logs**: Revisa los logs de Lambda para ver si hay errores de configuración

## 📚 Estructura de Archivos

```
backend/
├── .env                          # ✅ Configuración (NO subir a Git)
├── .env.example                  # ✅ Plantilla de configuración
├── .gitignore                    # ✅ Incluye .env
├── JIRA_CONFIGURATION.md         # ✅ Esta documentación
└── lambda-functions/
    └── jira/
        ├── jiraConfig.js         # ✅ Lógica de configuración
        └── jiraHandler.js        # ✅ Handler de endpoints
```

## ❓ Preguntas Frecuentes

### ¿Puedo usar diferentes URLs de Jira por equipo?

Sí, cada equipo puede tener su propia URL configurada en `JIRA_URL_{TEAM}`.

### ¿Qué pasa si no configuro el JQL para un equipo?

Se usará un JQL por defecto: `project = '{TEAM}' AND status != 'Closed'`

### ¿Puedo usar diferentes credenciales por equipo?

No, actualmente las credenciales (email y API token) son comunes para todos los equipos. Si necesitas credenciales diferentes, contacta al equipo de desarrollo.

### ¿Cómo actualizo el API Token?

1. Genera un nuevo token en Jira
2. Actualiza `JIRA_API_TOKEN` en `.env`
3. Reinicia la aplicación/Lambda

## 🆘 Solución de Problemas

### Error: "Jira credentials not configured"

**Causa**: Faltan `JIRA_EMAIL` o `JIRA_API_TOKEN` en `.env`

**Solución**: Verifica que ambas variables estén configuradas correctamente.

### Error: "Jira URL not configured for team 'X'"

**Causa**: Falta `JIRA_URL_X` en `.env`

**Solución**: Añade la variable `JIRA_URL_X` con la URL de Jira.

### Error: "404 Not Found" al importar

**Causa**: El endpoint de Jira no existe o la URL es incorrecta

**Solución**: Verifica que `JIRA_URL_{TEAM}` sea correcta y accesible.

### Error: "401 Unauthorized"

**Causa**: Credenciales incorrectas o token expirado

**Solución**: 
1. Verifica que `JIRA_EMAIL` sea correcto
2. Genera un nuevo `JIRA_API_TOKEN`
3. Verifica que el usuario tenga permisos en Jira

## 📞 Soporte

Para más ayuda, contacta al equipo de desarrollo o revisa la documentación de Jira:
- https://support.atlassian.com/jira-cloud-administration/docs/manage-api-tokens-for-your-atlassian-account/
