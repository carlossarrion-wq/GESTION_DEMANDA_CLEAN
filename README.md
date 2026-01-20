# 📦 Sistema de Gestión de Capacidad y Planificación de Recursos - VERSIÓN LIMPIA

**Organización**: Naturgy LCS  
**Versión**: 1.2.0  
**Fecha**: 20 de Enero de 2026  
**Estado**: ✅ Producción - Solo archivos activos

---

## 📋 Descripción

Este directorio contiene **únicamente los archivos fundamentales** que están activos en producción del Sistema de Gestión de Capacidad y Planificación de Recursos. Se ha eliminado todo código temporal, de prueba o no utilizado.

---

## 🗂️ Estructura del Proyecto

```
GESTIÓN_DEMANDA_CLEAN/
│
├── frontend/                          # FRONTEND (26 archivos)
│   ├── html/                          # Páginas HTML (2)
│   │   ├── index-modular.html        # ✅ Aplicación principal (SPA)
│   │   └── login.html                # ✅ Página de autenticación
│   │
│   ├── css/                           # Estilos CSS (7 archivos)
│   │   ├── base.css                  # ✅ Variables, reset, tipografía
│   │   ├── components.css            # ✅ Botones, badges, cards, forms
│   │   ├── layout.css                # ✅ Header, containers, grids, KPIs
│   │   ├── tabs.css                  # ✅ Sistema de pestañas
│   │   ├── tables.css                # ✅ Tablas, matrices, expandibles
│   │   ├── modal.css                 # ✅ Modales y overlays
│   │   └── responsive.css            # ✅ Media queries, print styles
│   │
│   └── js/                            # JavaScript ES6 (17 archivos)
│       ├── main.js                   # ✅ Punto de entrada principal
│       │
│       ├── config/                   # Configuración (2)
│       │   ├── data.js               # ✅ API config, datos mock
│       │   └── jiraConfig.example.js # ✅ Template Jira config
│       │
│       ├── utils/                    # Utilidades (2)
│       │   ├── helpers.js            # ✅ Funciones auxiliares
│       │   └── dropdownLoader.js     # ✅ Carga de dropdowns desde API
│       │
│       └── components/               # Componentes (15)
│           ├── tabs.js               # ✅ Gestión de pestañas
│           ├── charts.js             # ✅ Gráficos Chart.js
│           ├── kpi.js                # ✅ Cálculo de KPIs
│           ├── overviewCharts.js     # ✅ Gráficos vista general
│           ├── projectModal.js       # ✅ Modal de proyectos
│           ├── resourceModal.js      # ✅ Modal de recursos
│           ├── taskModal.js          # ✅ Modal de tareas (AG Grid)
│           ├── conceptTasksModal.js  # ✅ Modal tareas conceptuales
│           ├── createTaskModal.js    # ✅ Modal creación rápida
│           ├── jiraModal.js          # ✅ Modal importación Jira
│           ├── assignmentView.js     # ✅ Vista de asignaciones
│           ├── resourceCapacity.js   # ✅ Matriz de capacidad
│           ├── resourceCapacityModal.js # ✅ Modal edición capacidad
│           ├── capacityErrorModal.js # ✅ Modal error capacidad
│           └── effortTracking.js     # ✅ Seguimiento de esfuerzo
│
├── backend/                           # BACKEND
│   │
│   ├── lambda-functions/             # Lambda Functions (8 handlers)
│   │   ├── projects/                 # ✅ CRUD de proyectos
│   │   │   └── projectsHandler.js
│   │   │
│   │   ├── resources/                # ✅ CRUD de recursos
│   │   │   └── resourcesHandler.js
│   │   │
│   │   ├── assignments/              # ✅ Gestión de asignaciones
│   │   │   └── assignmentsHandler.js
│   │   │
│   │   ├── capacity/                 # ✅ Gestión de capacidad
│   │   │   └── capacityHandler.js
│   │   │
│   │   ├── domains/                  # ✅ Catálogo de dominios
│   │   │   └── domainsHandler.js
│   │   │
│   │   ├── statuses/                 # ✅ Catálogo de estados
│   │   │   └── statusesHandler.js
│   │   │
│   │   ├── concept-tasks/            # ✅ Tareas conceptuales
│   │   │   └── conceptTasksHandler.js
│   │   │
│   │   └── jira/                     # ✅ Integración con Jira
│   │       └── jiraHandler.js
│   │
│   ├── shared-libraries/             # Librerías compartidas (4)
│   │   ├── prisma.js                 # ✅ Cliente Prisma singleton
│   │   ├── response.js               # ✅ Helpers de respuesta HTTP
│   │   ├── errors.js                 # ✅ Manejo de errores
│   │   └── validators.js             # ✅ Validaciones de negocio
│   │
│   ├── database/                     # Base de Datos
│   │   └── schema/                   # Schema Prisma
│   │       └── schema.prisma         # ✅ Definición de 9 tablas + 4 vistas
│   │
│   ├── deployment-scripts/           # Scripts de despliegue (15+)
│   │   ├── deploy-handlers-minimal.ps1
│   │   ├── deploy-assignments.ps1
│   │   ├── deploy-capacity.ps1
│   │   ├── deploy-jira.sh
│   │   ├── deploy-concept-tasks.sh
│   │   ├── configure-assignments-api.ps1
│   │   ├── configure-capacity-api.ps1
│   │   ├── configure-assignments-cors.sh
│   │   ├── configure-concept-tasks-api.sh
│   │   ├── configure-concept-tasks-cors.sh
│   │   ├── configure-cors-jira.sh
│   │   ├── configure-jira-api.sh
│   │   ├── configure-resources-api.ps1
│   │   ├── configure-skills-cors.sh
│   │   └── configure-skills-methods.sh
│   │
│   ├── package.json                  # ✅ Dependencias backend
│   └── .env.example                  # ✅ Template variables de entorno
│
├── testing/                           # TESTING
│   └── e2e/                          # Tests End-to-End (Playwright)
│       ├── pages/                    # Page Objects (3)
│       │   ├── ProjectsPage.js
│       │   ├── CreateTaskModal.js
│       │   └── TasksConceptualizationModal.js
│       │
│       ├── specs/                    # Test Specs (1+)
│       │   └── example.spec.js
│       │
│       ├── utils/                    # Utilidades de testing (1)
│       │   └── helpers.js
│       │
│       ├── playwright.config.js      # ✅ Configuración Playwright
│       └── package.json              # ✅ Dependencias testing
│
├── documentation/                     # DOCUMENTACIÓN
│   ├── README.md                     # ✅ Documentación general
│   ├── MAPA_CONEXIONES.md           # ✅ Arquitectura y conexiones
│   └── INVENTARIO_APLICACION.md     # ✅ Inventario completo
│
├── .gitignore                        # ✅ Archivos ignorados por Git
├── package.json                      # ✅ Dependencias raíz
└── README.md                         # ✅ Este archivo
```

---

## 📊 Resumen de Archivos

### Frontend (26 archivos)
- **HTML**: 2 páginas (index-modular.html, login.html)
- **CSS**: 7 archivos modulares (~1,280 líneas)
- **JavaScript**: 17 módulos ES6 (~1,900 líneas)

### Backend (12 archivos activos)
- **Lambda Handlers**: 8 funciones (Node.js 18+)
- **Librerías compartidas**: 4 archivos
- **Schema Prisma**: 1 archivo (9 tablas + 4 vistas)

### Testing (6+ archivos)
- **Page Objects**: 3 archivos
- **Specs**: 1+ archivos
- **Configuración**: 2 archivos

### Documentación (3 archivos)
- README.md (general)
- MAPA_CONEXIONES.md (arquitectura)
- INVENTARIO_APLICACION.md (inventario detallado)

### Scripts de Despliegue (15+ archivos)
- PowerShell y Bash para AWS Lambda y API Gateway

---

## 🚀 Inicio Rápido

### Frontend

```bash
# Opción 1: Abrir directamente
open frontend/html/index-modular.html

# Opción 2: Servidor local (recomendado)
cd frontend/html
python3 -m http.server 8000
# Abrir: http://localhost:8000/index-modular.html
```

### Backend

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Generar Prisma Client
npx prisma generate

# 4. Desplegar Lambda Functions
# Ver scripts en deployment-scripts/
```

### Testing

```bash
cd testing/e2e

# 1. Instalar dependencias
npm install

# 2. Ejecutar tests
npx playwright test

# 3. Ver reporte
npx playwright show-report
```

---

## 🔗 Arquitectura

```
Frontend (Browser)
    ↓ HTTPS REST API
AWS API Gateway
    ↓
AWS Lambda Functions (8 handlers)
    ↓ Prisma ORM
AWS RDS PostgreSQL 15+
```

**Base URL API**: `https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod`

---

## 📦 Dependencias Principales

### Frontend (CDN)
- Chart.js 3.x
- Handsontable 14.1.0
- AG Grid 31.0.0
- Moment.js 2.29.1

### Backend (npm)
- @prisma/client 5.22.0
- axios 1.6.0

### Testing (npm)
- @playwright/test

---

## 🗄️ Base de Datos

### Tablas (9)
1. **domains** - Dominios funcionales
2. **statuses** - Estados de proyectos
3. **projects** - Proyectos y evolutivos
4. **resources** - Recursos humanos
5. **resource_skills** - Skills por recurso
6. **project_skill_breakdown** - Desglose de horas por skill
7. **capacity** - Capacidad mensual de recursos
8. **assignments** - Asignaciones recurso-proyecto
9. **concept_tasks** - Tareas en fase de conceptualización

### Vistas Materializadas (4)
1. **mv_monthly_capacity_summary** - Resumen mensual de capacidad
2. **mv_project_utilization** - Utilización por proyecto
3. **mv_resource_allocation** - Asignación por recurso
4. **mv_skill_capacity** - Capacidad por skill

---

## 📝 Endpoints API

| Endpoint | Handler | Métodos |
|----------|---------|---------|
| `/projects` | projectsHandler | GET, POST, PUT, DELETE |
| `/resources` | resourcesHandler | GET, POST, PUT, DELETE |
| `/assignments` | assignmentsHandler | GET, POST, PUT, DELETE |
| `/capacity` | capacityHandler | GET, PUT |
| `/domains` | domainsHandler | GET, POST |
| `/statuses` | statusesHandler | GET |
| `/concept-tasks` | conceptTasksHandler | GET, POST, PUT, DELETE |
| `/jira` | jiraHandler | POST |

---

## 📚 Documentación Adicional

Para más información, consulta los documentos en el directorio `documentation/`:

- **README.md**: Documentación general del proyecto (~800 líneas)
- **MAPA_CONEXIONES.md**: Arquitectura detallada y flujos de datos (~600 líneas)
- **INVENTARIO_APLICACION.md**: Inventario completo de archivos (~1,500 líneas)

---

## ✅ Diferencias con el Directorio Original

Este directorio **CLEAN** contiene:

✅ **Solo archivos activos en producción**  
✅ **Estructura organizada por función**  
✅ **Sin archivos temporales** (lambda-*-temp/)  
✅ **Sin código de prueba** (test-extract/)  
✅ **Sin mockups no utilizados**  
✅ **Sin scripts de migración ya aplicados**

---

## 🔐 Seguridad

- Autenticación por equipos (sessionStorage)
- Headers personalizados: `Authorization`, `x-user-team`
- Filtrado automático de datos por equipo
- CORS habilitado en API Gateway
- VPC privada para RDS
- Secrets Manager para credenciales

---

## 📞 Soporte

Para más información o soporte, consulta la documentación completa en el directorio `documentation/`.

---

**Última actualización**: 20 de Enero de 2026  
**Versión**: 1.2.0  
**Estado**: ✅ Producción - Solo archivos activos  
**Organización**: Naturgy LCS
