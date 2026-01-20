# 📦 INVENTARIO DE ARCHIVOS DEL SISTEMA DE GESTIÓN DE DEMANDA

**Proyecto**: Sistema de Gestión de Capacidad y Planificación de Recursos  
**Organización**: Naturgy LCS  
**Versión**: 1.2.0  
**Fecha de Inventario**: 20 de Enero de 2026  
**Estado**: ✅ Producción - Totalmente funcional

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Frontend - Páginas HTML](#frontend---páginas-html)
3. [Frontend - Estilos CSS](#frontend---estilos-css)
4. [Frontend - JavaScript](#frontend---javascript)
5. [Backend - Lambda Functions](#backend---lambda-functions)
6. [Backend - Base de Datos](#backend---base-de-datos)
7. [Backend - Configuración y Despliegue](#backend---configuración-y-despliegue)
8. [Testing](#testing)
9. [Documentación](#documentación)
10. [Resumen de Métricas](#resumen-de-métricas)

---

## 1. RESUMEN EJECUTIVO

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                        │
│  • 2 páginas HTML principales                                │
│  • 7 archivos CSS modulares                                  │
│  • 17 archivos JavaScript (ES6 modules)                      │
│  • Librerías: Chart.js, Handsontable, AG Grid               │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS API GATEWAY (REST API)                      │
│  Base URL: https://xrqo2gedpl.execute-api.eu-west-1...      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS LAMBDA FUNCTIONS                        │
│  • 8 handlers principales (Node.js 18+)                     │
│  • Prisma ORM para acceso a datos                           │
│  • 4 archivos de librería compartida                        │
└────────────────────────┬─────────────────────────────────────┘
                         │ PostgreSQL Protocol
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS RDS POSTGRESQL 15+                          │
│  • 9 tablas principales                                      │
│  • 4 vistas materializadas                                   │
│  • Schema gestionado por Prisma                             │
└─────────────────────────────────────────────────────────────┘
```

### Estadísticas Generales

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| **Páginas HTML** | 2 | Aplicación principal + Login |
| **Archivos CSS** | 7 | Estilos modulares (~1,280 líneas) |
| **Archivos JavaScript** | 17 | Módulos ES6 (~1,100 líneas) |
| **Lambda Handlers** | 8 | Funciones serverless en Node.js |
| **Tablas de BD** | 9 | Modelo de datos PostgreSQL |
| **Vistas Materializadas** | 4 | Para optimización de KPIs |
| **Scripts de Despliegue** | 20+ | PowerShell y Bash |
| **Tests Automatizados** | 3+ | Playwright E2E |

---

## 2. FRONTEND - PÁGINAS HTML

### 2.1. Página Principal de Aplicación

**Archivo**: `index-modular.html`  
**Propósito**: Single Page Application (SPA) principal del sistema  
**Tamaño**: ~500 líneas  
**Estado**: ✅ Activo en producción

**Características**:
- Dashboard interactivo con 5 KPIs principales
- Sistema de pestañas (tabs) para navegación
- Matriz de utilización mensual (12 meses)
- Gráficos interactivos (Chart.js)
- Gestión de proyectos (tabla con CRUD)
- Gestión de capacidad de recursos
- Modales para creación/edición de datos
- Responsive design

**Secciones principales**:
1. **Header**: Logo, título, dropdown de usuario
2. **Tab Navigation**: Vista General, Proyectos, Capacidad
3. **Vista General**:
   - 5 KPIs con indicadores de tendencia
   - 3 gráficos de dona (Chart.js)
   - Top 5 proyectos
   - Matriz de utilización mensual
   - Insights de IA
4. **Proyectos**:
   - Tabla de proyectos con búsqueda y filtros
   - Botones de acción (crear, editar, eliminar)
   - Gráficos de distribución
5. **Capacidad**:
   - Matriz de recursos por mes
   - Drill-down de asignaciones
   - KPIs de recursos

**Dependencias externas**:
- Chart.js 3.x (CDN)
- Handsontable 14.1.0 (CDN)
- AG Grid 31.0.0 (CDN)
- Moment.js 2.29.1 (CDN)

**Módulos JavaScript importados**:
```javascript
import { initializeTabs } from './assets/js/components/tabs.js';
import { initializeAllCharts } from './assets/js/components/charts.js';
import { updateMatrixKPIs } from './assets/js/components/kpi.js';
import { openCreateProjectModal } from './assets/js/components/projectModal.js';
import { loadResourceCapacity } from './assets/js/components/resourceCapacity.js';
// ... y más
```

---

### 2.2. Página de Autenticación

**Archivo**: `login.html`  
**Propósito**: Página de login con autenticación por equipos  
**Tamaño**: ~200 líneas  
**Estado**: ✅ Activo en producción

**Características**:
- Formulario de login (usuario, contraseña, equipo)
- Validación de campos en tiempo real
- Almacenamiento en sessionStorage
- Redirección automática a index-modular.html
- Diseño responsive y centrado

**Campos del formulario**:
1. Usuario (text input)
2. Contraseña (password input)
3. Equipo (select dropdown)
   - Opciones: LCS, DIGITAL, OTROS

**Flujo de autenticación**:
```javascript
handleLogin() {
  // 1. Validar campos
  // 2. Generar token simulado
  // 3. Guardar en sessionStorage:
  //    - aws_access_key
  //    - user_team
  //    - user_name
  //    - user_email
  // 4. Redirigir a index-modular.html
}
```

**Estilos inline**: Incluye CSS específico para el diseño del login

---

### 2.3. Mockup (No en producción)

**Archivo**: `mockup-asignacion-recursos.html`  
**Propósito**: Prototipo de interfaz para asignación de recursos  
**Estado**: 🚧 Mockup/Prototipo (no usado en producción)

---

## 3. FRONTEND - ESTILOS CSS

### Arquitectura CSS Modular

Total: **7 archivos CSS** (~1,280 líneas)  
Ubicación: `assets/css/`

### 3.1. Base Styles

**Archivo**: `assets/css/base.css`  
**Líneas**: ~180  
**Propósito**: Variables CSS, reset, tipografía base

**Contenido**:
- Variables CSS (colores, espaciados, fuentes)
- Reset CSS básico
- Estilos de tipografía (h1-h6, p, etc.)
- Estilos de body y html
- Clases de utilidad

**Variables principales**:
```css
:root {
  --primary-color: #319795;
  --secondary-color: #2c5282;
  --success-color: #48bb78;
  --warning-color: #ed8936;
  --error-color: #f56565;
  --info-color: #4299e1;
  --bg-color: #f7fafc;
  --text-color: #2d3748;
  --border-color: #e2e8f0;
}
```

---

### 3.2. Components

**Archivo**: `assets/css/components.css`  
**Líneas**: ~250  
**Propósito**: Componentes reutilizables (botones, badges, cards, forms)

**Componentes incluidos**:
- **Botones**: Primary, secondary, success, danger, icon buttons
- **Badges**: Prioridad (Muy Alta, Alta, Media, Baja), Estado
- **Cards**: Contenedores con sombras y bordes
- **Forms**: Inputs, selects, textareas, labels
- **Alerts**: Success, warning, error, info
- **Tooltips**: Información contextual

**Ejemplo de estilos de botones**:
```css
.btn-primary { background: var(--primary-color); }
.btn-secondary { background: var(--secondary-color); }
.btn-success { background: var(--success-color); }
.btn-danger { background: var(--error-color); }
```

---

### 3.3. Layout

**Archivo**: `assets/css/layout.css`  
**Líneas**: ~200  
**Propósito**: Estructura de página (header, containers, grids, KPIs)

**Secciones**:
- **Header**: Logo, título, navegación, dropdown de usuario
- **Containers**: Main container, content wrappers
- **Grid Systems**: CSS Grid para layouts
- **KPI Cards**: Diseño de tarjetas de indicadores
- **Section Headers**: Títulos de secciones

**Estructura del header**:
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

---

### 3.4. Tabs

**Archivo**: `assets/css/tabs.css`  
**Líneas**: ~120  
**Propósito**: Sistema de pestañas para navegación

**Características**:
- Tabs horizontales con indicador activo
- Animaciones de transición
- Estados: default, hover, active
- Responsive (se convierten en dropdown en móvil)

**Estructura**:
```css
.tabs-container { /* Contenedor principal */ }
.tab-button { /* Botón de pestaña */ }
.tab-button.active { /* Pestaña activa */ }
.tab-content { /* Contenido de pestaña */ }
.tab-content.active { /* Contenido visible */ }
```

---

### 3.5. Tables

**Archivo**: `assets/css/tables.css`  
**Líneas**: ~280  
**Propósito**: Estilos de tablas, matrices, filas expandibles

**Características**:
- Tablas responsivas con scroll horizontal
- Hover effects en filas
- Celdas editables
- Filas expandibles (drill-down)
- Matriz de utilización mensual
- Indicadores de carga (bajo/medio/alto)

**Tipos de tablas**:
1. **Tabla de proyectos**: Con acciones (editar, eliminar, tareas)
2. **Matriz de utilización**: 12 meses con totales
3. **Matriz de capacidad**: Recursos por mes con drill-down
4. **Tabla de asignaciones**: Detalle de horas por proyecto

**Clases de indicadores**:
```css
.utilization-low { background: #c6f6d5; }    /* Verde claro */
.utilization-medium { background: #feebc8; } /* Naranja claro */
.utilization-high { background: #fed7d7; }   /* Rojo claro */
```

---

### 3.6. Modals

**Archivo**: `assets/css/modal.css`  
**Líneas**: ~150  
**Propósito**: Ventanas modales y overlays

**Características**:
- Overlay con fondo oscuro semitransparente
- Animaciones de entrada/salida
- Diferentes tamaños (small, medium, large, xlarge)
- Header, body, footer estructurados
- Botón de cierre (X)
- Scroll interno cuando el contenido es largo

**Estructura**:
```css
.modal-overlay { /* Fondo oscuro */ }
.modal { /* Contenedor del modal */ }
.modal-header { /* Título y botón cerrar */ }
.modal-body { /* Contenido principal */ }
.modal-footer { /* Botones de acción */ }
```

**Tamaños disponibles**:
- `.modal-small`: 400px
- `.modal-medium`: 600px (default)
- `.modal-large`: 800px
- `.modal-xlarge`: 1200px

---

### 3.7. Responsive

**Archivo**: `assets/css/responsive.css`  
**Líneas**: ~100  
**Propósito**: Media queries y estilos para impresión

**Breakpoints**:
- **Desktop**: > 1024px (layout completo)
- **Tablet**: 768px - 1024px (adaptación de grids)
- **Mobile**: < 768px (navegación optimizada, tablas scrollables)

**Adaptaciones principales**:
```css
@media (max-width: 768px) {
  .header { flex-direction: column; }
  .kpi-grid { grid-template-columns: 1fr; }
  .tabs-container { overflow-x: auto; }
  table { display: block; overflow-x: auto; }
}
```

**Print styles**:
- Oculta elementos de navegación
- Optimiza para impresión en blanco y negro
- Ajusta tamaños de fuente

---

## 4. FRONTEND - JAVASCRIPT

### Arquitectura JavaScript Modular

Total: **17 archivos JavaScript** (~1,100 líneas)  
Ubicación: `assets/js/`  
Tipo: **ES6 Modules** (import/export)

### 4.1. Punto de Entrada Principal

**Archivo**: `assets/js/main.js`  
**Líneas**: ~150  
**Propósito**: Inicialización de la aplicación y orquestación

**Funciones principales**:
```javascript
// Inicialización
initializeApp()
checkAuthentication()

// Carga de datos
loadProjectsFromAPI()
loadResourcesFromAPI()

// Gestión de proyectos
addProject()
editProject(projectCode)
deleteProject(projectCode)

// Actualización de UI
updateProjectsTable(projects)
updateMatrixKPIs()
```

**Variables globales**:
- `window.allProjects`: Array de todos los proyectos
- `window.allResources`: Array de todos los recursos
- `window.currentUser`: Información del usuario autenticado

**Event listeners**:
- Click en botón "Añadir Proyecto"
- Click en iconos de editar/eliminar
- Cambio de pestañas
- Búsqueda y filtrado

---

### 4.2. Configuración

#### 4.2.1. Data Config

**Archivo**: `assets/js/config/data.js`  
**Líneas**: ~50  
**Propósito**: Configuración de API y datos mock

**Contenido**:
```javascript
export const API_CONFIG = {
  BASE_URL: 'https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod',
  ENDPOINTS: {
    PROJECTS: '/projects',
    RESOURCES: '/resources',
    ASSIGNMENTS: '/assignments',
    CAPACITY: '/capacity',
    DOMAINS: '/domains',
    STATUSES: '/statuses',
    CONCEPT_TASKS: '/concept-tasks',
    JIRA: '/jira'
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': '', // Se completa desde sessionStorage
    'x-user-team': ''    // Se completa desde sessionStorage
  }
};

export const MOCK_DATA = {
  domains: [...],
  statuses: [...],
  priorities: ['Muy Alta', 'Alta', 'Media', 'Baja']
};
```

---

#### 4.2.2. Jira Config (Ejemplo)

**Archivo**: `assets/js/config/jiraConfig.example.js`  
**Líneas**: ~30  
**Propósito**: Plantilla de configuración para integración con Jira  
**Estado**: 📝 Template (no usado directamente)

**Contenido**:
```javascript
export const JIRA_CONFIG = {
  BASE_URL: 'https://your-domain.atlassian.net',
  API_TOKEN: 'your-api-token',
  EMAIL: 'your-email@domain.com',
  PROJECT_KEY: 'PROJ'
};
```

---

### 4.3. Utilidades

#### 4.3.1. Helpers

**Archivo**: `assets/js/utils/helpers.js`  
**Líneas**: ~80  
**Propósito**: Funciones auxiliares reutilizables

**Funciones incluidas**:
```javascript
// Formateo
formatDate(date)
formatCurrency(amount)
formatNumber(number)
formatPercentage(value)

// Validación
validateEmail(email)
validateRequired(value)
validateDateRange(startDate, endDate)

// Cálculos
calculatePercentage(value, total)
calculateTrend(current, previous)
sumArray(array, property)

// DOM
showElement(elementId)
hideElement(elementId)
toggleElement(elementId)
```

---

#### 4.3.2. Dropdown Loader

**Archivo**: `assets/js/utils/dropdownLoader.js`  
**Líneas**: ~60  
**Propósito**: Carga dinámica de dropdowns desde API

**Funciones**:
```javascript
// Carga de catálogos
async loadDomains(selectElement)
async loadStatuses(selectElement)
async loadResources(selectElement)
async loadProjects(selectElement)

// Población de dropdowns
populateDropdown(selectElement, data, valueField, textField)
```

**Uso típico**:
```javascript
import { loadDomains, loadStatuses } from './utils/dropdownLoader.js';

// En modal de proyecto
await loadDomains(document.getElementById('domain-select'));
await loadStatuses(document.getElementById('status-select'));
```

---

### 4.4. Componentes

#### 4.4.1. Tabs

**Archivo**: `assets/js/components/tabs.js`  
**Líneas**: ~40  
**Propósito**: Gestión del sistema de pestañas

**Funciones**:
```javascript
initializeTabs()
switchTab(tabName)
```

**Pestañas disponibles**:
1. `overview`: Vista General
2. `projects`: Gestión de Proyectos
3. `capacity`: Gestión de Capacidad

---

#### 4.4.2. Charts

**Archivo**: `assets/js/components/charts.js`  
**Líneas**: ~120  
**Propósito**: Inicialización de gráficos con Chart.js

**Gráficos implementados**:
```javascript
// Vista General
initializeStatusChart()      // Distribución por estado
initializePriorityChart()    // Distribución por prioridad
initializeDomainChart()      // Distribución por dominio

// Capacidad
initializeCapacityChart()    // Horas comprometidas vs disponibles
initializeSkillChart()       // Distribución por skill/perfil

// Orquestador
initializeAllCharts()
```

**Configuración típica**:
```javascript
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: [...],
    datasets: [{
      data: [...],
      backgroundColor: [...]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true }
    }
  }
});
```

---

#### 4.4.3. KPI

**Archivo**: `assets/js/components/kpi.js`  
**Líneas**: ~100  
**Propósito**: Cálculo y actualización de KPIs

**KPIs calculados**:
```javascript
updateMatrixKPIs() {
  // 1. Proyectos activos (evolutivos vs proyectos)
  // 2. Recursos activos (asignación >50% y >80%)
  // 3. Capacidad total disponible (horas y FTEs)
  // 4. Utilización actual (horas comprometidas y FTEs)
  // 5. Eficiencia del equipo (recursos optimizados)
}

calculateTrend(current, previous)
updateKPICard(kpiId, value, trend)
```

**Indicadores de tendencia**:
- ↑ Verde: Mejora
- ↓ Rojo: Empeora
- → Gris: Sin cambios

---

#### 4.4.4. Project Modal

**Archivo**: `assets/js/components/projectModal.js`  
**Líneas**: ~150  
**Propósito**: Gestión de modales de proyectos (crear, editar, eliminar)

**Funciones principales**:
```javascript
// Apertura de modales
openCreateProjectModal()
openEditProjectModal(project)
openDeleteModal(project)

// Guardado
async saveProject(projectData)

// Validación
validateProjectForm()

// Eliminación
async confirmDelete(projectId)
```

**Campos del formulario**:
- Código del proyecto
- Título
- Descripción
- Tipo (Proyecto/Evolutivo)
- Dominio (dropdown desde API)
- Prioridad (Muy Alta/Alta/Media/Baja)
- Fecha inicio
- Fecha fin
- Estado (dropdown desde API)

---

#### 4.4.5. Resource Modal

**Archivo**: `assets/js/components/resourceModal.js`  
**Líneas**: ~120  
**Propósito**: Gestión de modales de recursos

**Funciones**:
```javascript
openCreateResourceModal()
openEditResourceModal(resource)
async saveResource(resourceData)
validateResourceForm()
```

**Campos del formulario**:
- Código del recurso
- Nombre
- Email
- Equipo
- Capacidad por defecto (horas/mes)
- Skills (múltiples)
- Activo (checkbox)

---

#### 4.4.6. Task Modal

**Archivo**: `assets/js/components/taskModal.js`  
**Líneas**: ~200  
**Propósito**: Modal de gestión de tareas con AG Grid

**Características**:
- Interfaz tipo Excel con AG Grid
- Vista de calendario: -30 días a +120 días
- Edición inline de celdas
- Añadir/eliminar filas
- Cálculo automático de totales
- Navegación con Tab/Enter

**Funciones**:
```javascript
openTaskDetailsModal(projectId)
initializeAGGrid()
addTaskRow()
deleteTaskRow(rowIndex)
async saveTaskChanges()
calculateTotals()
```

**Columnas de la grid**:
- Recurso (dropdown)
- Skill (dropdown)
- Descripción
- Fechas (columnas dinámicas por día)
- Total horas

---

#### 4.4.7. Concept Tasks Modal

**Archivo**: `assets/js/components/conceptTasksModal.js`  
**Líneas**: ~150  
**Propósito**: Modal para gestión de tareas en fase de conceptualización

**Funciones**:
```javascript
openConceptTasksModal(projectId)
addConceptTask()
editConceptTask(taskId)
deleteConceptTask(taskId)
async saveConceptTasks()
```

**Campos de tarea conceptual**:
- Título
- Descripción
- Horas estimadas
- Skill requerido

---

#### 4.4.8. Create Task Modal

**Archivo**: `assets/js/components/createTaskModal.js`  
**Líneas**: ~100  
**Propósito**: Modal simplificado para creación rápida de tareas

**Funciones**:
```javascript
openCreateTaskModal(projectId)
async createTask(taskData)
validateTaskForm()
```

---

#### 4.4.9. Jira Modal

**Archivo**: `assets/js/components/jiraModal.js`  
**Líneas**: ~180  
**Propósito**: Modal de importación desde Jira

**Funciones**:
```javascript
openJiraImportModal()
async fetchJiraProjects()
async importJiraProject(projectKey)
async syncJiraIssues(projectId)
mapJiraFieldsToSystem(jiraData)
```

**Flujo de importación**:
1. Usuario ingresa Jira Project Key
2. Sistema consulta API de Jira
3. Mapea campos Jira → Sistema
4. Crea proyecto en BD
5. Importa issues como tareas

---

#### 4.4.10. Assignment View

**Archivo**: `assets/js/components/assignmentView.js`  
**Líneas**: ~120  
**Propósito**: Vista de asignaciones de recursos a proyectos

**Funciones**:
```javascript
loadAssignments(filters)
renderAssignmentTable(assignments)
filterByResource(resourceId)
filterByProject(projectId)
filterByPeriod(startDate, endDate)
```

---

#### 4.4.11. Resource Capacity

**Archivo**: `assets/js/components/resourceCapacity.js`  
**Líneas**: ~180  
**Propósito**: Matriz de capacidad de recursos por mes

**Funciones**:
```javascript
loadResourceCapacity()
renderCapacityMatrix()
expandResource(resourceId)
collapseResource(resourceId)
calculateOccupationRatio(resourceId, month, year)
```

**Estructura de la matriz**:
- Filas: Recursos
- Columnas: 12 meses
- Celdas: Horas disponibles / comprometidas / ratio
- Drill-down: Proyectos asignados al expandir

---

#### 4.4.12. Resource Capacity Modal

**Archivo**: `assets/js/components/resourceCapacityModal.js`  
**Líneas**: ~100  
**Propósito**: Modal para editar capacidad de un recurso

**Funciones**:
```javascript
openCapacityModal(resourceId, month, year)
async updateCapacity(capacityData)
validateCapacity()
```

---

#### 4.4.13. Capacity Error Modal

**Archivo**: `assets/js/components/capacityErrorModal.js`  
**Líneas**: ~60  
**Propósito**: Modal de advertencia cuando se excede la capacidad

**Funciones**:
```javascript
showCapacityError(resourceId, exceededHours)
calculateAvailableCapacity(resourceId, month, year)
```

---

#### 4.4.14. Effort Tracking

**Archivo**: `assets/js/components/effortTracking.js`  
**Líneas**: ~140  
**Propósito**: Seguimiento de esfuerzo incurrido vs planificado

**Funciones**:
```javascript
loadEffortData(projectId)
renderEffortChart()
calculateVariance()
updateProgressBar()
```

**Métricas**:
- Horas planificadas
- Horas incurridas
- Varianza (%)
- Progreso del proyecto

---

#### 4.4.15. Overview Charts

**Archivo**: `assets/js/components/overviewCharts.js`  
**Líneas**: ~100  
**Propósito**: Gráficos específicos de la vista general

**Gráficos**:
```javascript
initializeUtilizationChart()    // Utilización mensual
initializeProjectTypeChart()    // Proyectos vs Evolutivos
initializeTopProjectsChart()    // Top 5 proyectos
```

---

## 5. BACKEND - LAMBDA FUNCTIONS

### Arquitectura Backend

Total: **8 Lambda Handlers** + **4 archivos de librería**  
Ubicación: `backend/lambda-all-handlers/`  
Runtime: **Node.js 18+**  
Lenguaje: **JavaScript** (compilado desde TypeScript)

### 5.1. Handlers Principales

#### 5.1.1. Projects Handler

**Archivo**: `backend/lambda-all-handlers/functions/projectsHandler.js`  
**Propósito**: CRUD de proyectos  
**Endpoints**: `/projects`

**Operaciones**:
```javascript
// GET /assignments
async function listAssignments(event) {
  const { projectId, resourceId } = event.queryStringParameters || {};
  const filters = { team: event.headers['x-user-team'] };
  if (projectId) filters.projectId = projectId;
  if (resourceId) filters.resourceId = resourceId;
  
  const assignments = await prisma.assignment.findMany({
    where: filters,
    include: { project: true, resource: true }
  });
  return success(assignments);
}

// POST /assignments
async function createAssignment(event) { ... }

// PUT /assignments/:id
async function updateAssignment(event) { ... }

// DELETE /assignments/:id
async function deleteAssignment(event) { ... }
```

**Validaciones**:
- Recurso tiene capacidad disponible
- No hay solapamiento de asignaciones
- Proyecto y recurso existen
- Horas > 0

---

#### 5.1.4. Capacity Handler

**Archivo**: `backend/lambda-all-handlers/functions/capacityHandler.js`  
**Propósito**: Gestión de capacidad mensual de recursos  
**Endpoints**: `/capacity`

**Operaciones**:
```javascript
// GET /capacity
async function getCapacity(event) {
  const { resourceId, year, month } = event.queryStringParameters;
  const capacity = await prisma.capacity.findUnique({
    where: {
      resourceId_month_year: { resourceId, month, year }
    }
  });
  return success(capacity);
}

// PUT /capacity/:resourceId/:year/:month
async function updateCapacity(event) {
  const { resourceId, year, month } = event.pathParameters;
  const { totalHours } = JSON.parse(event.body);
  
  const capacity = await prisma.capacity.upsert({
    where: { resourceId_month_year: { resourceId, month, year } },
    update: { totalHours },
    create: { resourceId, month, year, totalHours }
  });
  return success(capacity);
}
```

---

#### 5.1.5. Domains Handler

**Archivo**: `backend/lambda-all-handlers/functions/domainsHandler.js`  
**Propósito**: Gestión de dominios funcionales  
**Endpoints**: `/domains`

**Operaciones**:
```javascript
// GET /domains
async function listDomains(event) {
  const domains = await prisma.domain.findMany({
    orderBy: { name: 'asc' }
  });
  return success(domains);
}

// POST /domains (Admin)
async function createDomain(event) { ... }
```

**Dominios predefinidos**:
- Atención
- Datos
- Facturación
- Integración
- Operaciones
- Otros

---

#### 5.1.6. Statuses Handler

**Archivo**: `backend/lambda-all-handlers/functions/statusesHandler.js`  
**Propósito**: Gestión de estados de proyectos  
**Endpoints**: `/statuses`

**Operaciones**:
```javascript
// GET /statuses
async function listStatuses(event) {
  const statuses = await prisma.status.findMany({
    orderBy: { order: 'asc' }
  });
  return success(statuses);
}
```

**Estados predefinidos** (en orden):
1. Idea
2. Concepto
3. Viabilidad
4. Diseño
5. Desarrollo
6. Implantado
7. Finalizado

---

#### 5.1.7. Concept Tasks Handler

**Archivo**: `backend/lambda-all-handlers/functions/conceptTasksHandler.js`  
**Propósito**: Gestión de tareas en fase de conceptualización  
**Endpoints**: `/concept-tasks`

**Operaciones**:
```javascript
// GET /concept-tasks?projectId=X
async function listConceptTasks(event) {
  const { projectId } = event.queryStringParameters;
  const tasks = await prisma.conceptTask.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });
  return success(tasks);
}

// POST /concept-tasks
async function createConceptTask(event) { ... }

// PUT /concept-tasks/:id
async function updateConceptTask(event) { ... }

// DELETE /concept-tasks/:id
async function deleteConceptTask(event) { ... }
```

---

#### 5.1.8. Jira Handler

**Archivo**: `backend/lambda-all-handlers/functions/jiraHandler.js`  
**Propósito**: Integración con Jira (importación de proyectos e issues)  
**Endpoints**: `/jira`

**Operaciones**:
```javascript
// POST /jira/import-project
async function importJiraProject(event) {
  const { projectKey } = JSON.parse(event.body);
  
  // 1. Consultar API de Jira
  const jiraProject = await fetchJiraProject(projectKey);
  
  // 2. Mapear campos
  const projectData = mapJiraToSystem(jiraProject);
  
  // 3. Crear en BD
  const project = await prisma.project.create({ data: projectData });
  
  // 4. Importar issues
  await importJiraIssues(project.id, projectKey);
  
  return success(project);
}

// POST /jira/sync-issues
async function syncJiraIssues(event) { ... }
```

**Mapeo de campos Jira → Sistema**:
- `key` → `code`
- `summary` → `title`
- `description` → `description`
- `status.name` → `status`
- `priority.name` → `priority`
- `created` → `startDate`

---

### 5.2. Librerías Compartidas

#### 5.2.1. Prisma Client

**Archivo**: `backend/lambda-all-handlers/lib/prisma.js`  
**Propósito**: Cliente Prisma singleton para conexión a BD

**Contenido**:
```javascript
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = { prisma };
```

**Configuración**:
- Connection pooling automático
- Lazy loading de conexiones
- Singleton pattern para reutilización

---

#### 5.2.2. Response Helpers

**Archivo**: `backend/lambda-all-handlers/lib/response.js`  
**Propósito**: Helpers para respuestas HTTP estandarizadas

**Funciones**:
```javascript
// Respuesta exitosa
function success(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

// Respuesta de error
function error(message, statusCode = 500, details = null) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        code: statusCode,
        details
      }
    })
  };
}

module.exports = { success, error };
```

---

#### 5.2.3. Error Handlers

**Archivo**: `backend/lambda-all-handlers/lib/errors.js`  
**Propósito**: Manejo centralizado de errores

**Clases de error**:
```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError
};
```

---

#### 5.2.4. Validators

**Archivo**: `backend/lambda-all-handlers/lib/validators.js`  
**Propósito**: Validaciones de negocio reutilizables

**Funciones**:
```javascript
// Validar proyecto
function validateProject(data) {
  if (!data.code) throw new ValidationError('Code is required', 'code');
  if (!data.title) throw new ValidationError('Title is required', 'title');
  if (data.startDate && data.endDate) {
    if (new Date(data.startDate) > new Date(data.endDate)) {
      throw new ValidationError('Start date must be before end date', 'dates');
    }
  }
}

// Validar recurso
function validateResource(data) {
  if (!data.code) throw new ValidationError('Code is required', 'code');
  if (!data.name) throw new ValidationError('Name is required', 'name');
  if (data.email && !isValidEmail(data.email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
}

// Validar asignación
function validateAssignment(data) {
  if (!data.projectId) throw new ValidationError('Project is required', 'projectId');
  if (!data.hours || data.hours <= 0) {
    throw new ValidationError('Hours must be greater than 0', 'hours');
  }
}

// Validar email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

module.exports = {
  validateProject,
  validateResource,
  validateAssignment,
  isValidEmail
};
```

---

## 6. BACKEND - BASE DE DATOS

### 6.1. Schema Prisma

**Archivo**: `backend/lambda-all-handlers/prisma/schema.prisma`  
**Propósito**: Definición del modelo de datos  
**ORM**: Prisma 5.22.0  
**Base de datos**: PostgreSQL 15+

### 6.2. Tablas Principales (9)

#### 6.2.1. domains

**Propósito**: Dominios funcionales de la organización

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | Nombre único del dominio |
| description | TEXT | Descripción opcional |

**Índices**: name (unique)

---

#### 6.2.2. statuses

**Propósito**: Estados del ciclo de vida de proyectos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | Nombre único del estado |
| order | INTEGER | Orden de visualización |

**Índices**: name (unique)

---

#### 6.2.3. projects

**Propósito**: Proyectos y evolutivos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| code | VARCHAR(50) | Código del proyecto |
| title | VARCHAR(255) | Título |
| description | TEXT | Descripción |
| type | VARCHAR(20) | Proyecto/Evolutivo |
| priority | VARCHAR(20) | Muy Alta/Alta/Media/Baja |
| startDate | DATE | Fecha de inicio |
| endDate | DATE | Fecha de fin |
| status | INTEGER | FK a statuses |
| domain | INTEGER | FK a domains |
| team | VARCHAR(50) | Equipo propietario |
| jiraProjectKey | VARCHAR(50) | Clave del proyecto en Jira |
| jiraUrl | TEXT | URL del proyecto en Jira |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

**Índices**:
- (code, team) unique
- code
- type
- status
- domain
- team

**Relaciones**:
- 1:N con assignments
- 1:N con projectSkillBreakdowns
- 1:N con conceptTasks

---

#### 6.2.4. resources

**Propósito**: Recursos humanos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| code | VARCHAR(50) | Código único del recurso |
| name | VARCHAR(255) | Nombre completo |
| email | VARCHAR(255) | Email (único) |
| team | VARCHAR(50) | Equipo |
| defaultCapacity | INTEGER | Capacidad por defecto (160h/mes) |
| active | BOOLEAN | Activo/Inactivo |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

**Índices**:
- code (unique)
- email (unique)
- active
- team

**Relaciones**:
- 1:N con assignments
- 1:N con capacities
- 1:N con resourceSkills

---

#### 6.2.5. resource_skills

**Propósito**: Skills/habilidades por recurso

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| resourceId | UUID | FK a resources |
| skillName | VARCHAR(100) | Nombre del skill |
| proficiency | VARCHAR(20) | Nivel de proficiencia |
| createdAt | TIMESTAMP | Fecha de creación |

**Índices**:
- (resourceId, skillName) unique
- resourceId
- skillName

**Relación**: N:1 con resources (CASCADE on delete)

---

#### 6.2.6. project_skill_breakdown

**Propósito**: Desglose de horas por skill en proyectos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | FK a projects |
| skillName | VARCHAR(100) | Nombre del skill |
| month | INTEGER | Mes (1-12) |
| year | INTEGER | Año |
| hours | DECIMAL(10,2) | Horas planificadas |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

**Índices**:
- (projectId, skillName, month, year) unique
- projectId
- skillName
- (year, month)

**Relación**: N:1 con projects (CASCADE on delete)

---

#### 6.2.7. capacity

**Propósito**: Capacidad mensual de recursos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| resourceId | UUID | FK a resources |
| month | INTEGER | Mes (1-12) |
| year | INTEGER | Año |
| totalHours | DECIMAL(10,2) | Horas disponibles |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

**Índices**:
- (resourceId, month, year) unique
- resourceId
- (year, month)

**Relación**: N:1 con resources (CASCADE on delete)

---

#### 6.2.8. assignments

**Propósito**: Asignaciones de recursos a proyectos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | FK a projects |
| resourceId | UUID | FK a resources (nullable) |
| title | VARCHAR(255) | Título de la tarea |
| description | TEXT | Descripción |
| skillName | VARCHAR(100) | Skill requerido |
| team | VARCHAR(50) | Equipo |
| month | INTEGER | Mes (1-12) |
| year | INTEGER | Año |
| date | DATE | Fecha específica |
| hours | DECIMAL(10,2) | Horas asignadas |
| jiraIssueKey | VARCHAR(50) | Clave del issue en Jira |
| jiraIssueId | VARCHAR(50) | ID del issue en Jira |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

**Índices**:
- jiraIssueKey (unique)
- projectId
- resourceId
- (year, month)
- skillName
- date
- (resourceId, date)

**Relaciones**:
- N:1 con projects (CASCADE on delete)
- N:1 con resources (SET NULL on delete)

---

#### 6.2.9. concept_tasks

**Propósito**: Tareas en fase de conceptualización

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | FK a projects |
| title | VARCHAR(255) | Título de la tarea |
| description | TEXT | Descripción |
| hours | DECIMAL(10,2) | Horas estimadas |
| skillName | VARCHAR(100) | Skill requerido |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

**Índices**:
- projectId
- skillName

**Relación**: N:1 con projects (CASCADE on delete)

---

### 6.3. Vistas Materializadas (4)

#### 6.3.1. mv_monthly_capacity_summary

**Propósito**: Resumen mensual de capacidad por equipo

**Columnas**:
- team
- year
- month
- total_available_hours
- total_committed_hours
- total_free_hours
- utilization_percentage

**Actualización**: Manual o programada

---

#### 6.3.2. mv_project_utilization

**Propósito**: Utilización por proyecto

**Columnas**:
- project_id
- project_code
- project_title
- planned_hours
- incurred_hours
- progress_percentage
- status

---

#### 6.3.3. mv_resource_allocation

**Propósito**: Asignación por recurso

**Columnas**:
- resource_id
- resource_code
- resource_name
- assigned_hours
- available_hours
- occupation_ratio

---

#### 6.3.4. mv_skill_capacity

**Propósito**: Capacidad por skill/perfil

**Columnas**:
- skill_name
- total_resources
- total_available_hours
- total_assigned_hours
- utilization_percentage

---

## 7. BACKEND - CONFIGURACIÓN Y DESPLIEGUE

### 7.1. Archivos de Configuración

#### 7.1.1. Package.json

**Archivo**: `backend/lambda-all-handlers/package.json`  
**Propósito**: Dependencias y scripts del backend

**Dependencias principales**:
```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "typescript": "^5.9.3"
  }
}
```

---

#### 7.1.2. Environment Variables

**Archivo**: `backend/.env.example`  
**Propósito**: Template de variables de entorno

**Variables**:
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
AWS_REGION="eu-west-1"
NODE_ENV="production"
```

---

### 7.2. Scripts de Despliegue

Total: **20+ scripts** (PowerShell y Bash)  
Ubicación: `backend/`

#### Scripts principales:

1. **deploy-handlers-minimal.ps1**: Despliegue mínimo de handlers
2. **deploy-assignments.ps1**: Despliegue de assignments handler
3. **deploy-capacity.ps1**: Despliegue de capacity handler
4. **deploy-jira.sh**: Despliegue de Jira handler
5. **deploy-concept-tasks.sh**: Despliegue de concept tasks handler
6. **configure-*-api.ps1**: Configuración de API Gateway
7. **configure-*-cors.sh**: Configuración de CORS

---

## 8. TESTING

### 8.1. Tests End-to-End (Playwright)

**Ubicación**: `tests/`  
**Framework**: Playwright  
**Navegadores**: Chromium, Firefox, WebKit

#### 8.1.1. Configuración

**Archivo**: `tests/playwright.config.js`

**Configuración**:
- Base URL: http://localhost:8000
- Timeout: 30 segundos
- Retries: 2
- Screenshots on failure

---

#### 8.1.2. Page Objects

**Archivos**:
1. `tests/pages/ProjectsPage.js`: Página de proyectos
2. `tests/pages/CreateTaskModal.js`: Modal de creación de tareas
3. `tests/pages/TasksConceptualizationModal.js`: Modal de tareas conceptuales

---

#### 8.1.3. Specs

**Archivo**: `tests/specs/example.spec.js`

**Tests incluidos**:
- Login exitoso
- Creación de proyecto
- Edición de proyecto
- Eliminación de proyecto
- Gestión de tareas
- Navegación entre pestañas

---

## 9. DOCUMENTACIÓN

### 9.1. Documentación Principal

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| **README.md** | Documentación general del proyecto | ~800 |
| **MAPA_CONEXIONES.md** | Arquitectura y conexiones del sistema | ~600 |
| **INVENTARIO_APLICACION.md** | Este documento - Inventario completo | ~1,500 |
| **backend/README.md** | Documentación específica del backend | ~300 |

---

### 9.2. Documentación de Configuración

| Archivo | Propósito |
|---------|-----------|
| **.env.example** | Template de variables de entorno |
| **jiraConfig.example.js** | Template de configuración Jira |
| **package.json** | Dependencias y scripts |
| **tsconfig.json** | Configuración de TypeScript |

---

## 10. RESUMEN DE MÉTRICAS

### 10.1. Métricas de Código

| Categoría | Archivos | Líneas Aprox. |
|-----------|----------|---------------|
| **HTML** | 2 | 700 |
| **CSS** | 7 | 1,280 |
| **JavaScript Frontend** | 17 | 1,900 |
| **JavaScript Backend** | 12 | 1,500 |
| **Configuración** | 10+ | 500 |
| **Documentación** | 4 | 2,200 |
| **Tests** | 5+ | 400 |
| **TOTAL** | **57+** | **~8,480** |

---

### 10.2. Componentes por Categoría

#### Frontend
- **Páginas HTML**: 2 activas + 1 mockup
- **Módulos CSS**: 7 archivos modulares
- **Módulos JavaScript**: 17 archivos ES6
- **Componentes UI**: 15 componentes reutilizables

#### Backend
- **Lambda Handlers**: 8 funciones principales
- **Librerías compartidas**: 4 archivos
- **Tablas de BD**: 9 tablas
- **Vistas materializadas**: 4 vistas

#### Infraestructura
- **Scripts de despliegue**: 20+ scripts
- **Archivos de configuración**: 10+ archivos

---

### 10.3. Dependencias Externas

#### Frontend (CDN)
- Chart.js 3.x
- Handsontable 14.1.0
- AG Grid 31.0.0
- Moment.js 2.29.1

#### Backend (npm)
- @prisma/client 5.22.0
- axios 1.6.0
- typescript 5.9.3

#### Servicios AWS
- Lambda (Node.js 18+)
- API Gateway (REST API)
- RDS PostgreSQL 15+
- VPC
- Security Groups
- Secrets Manager
- CloudWatch Logs

---

### 10.4. Endpoints API Activos

| Endpoint | Métodos | Handler | Estado |
|----------|---------|---------|--------|
| `/projects` | GET, POST, PUT, DELETE | projectsHandler | ✅ Activo |
| `/resources` | GET, POST, PUT, DELETE | resourcesHandler | ✅ Activo |
| `/assignments` | GET, POST, PUT, DELETE | assignmentsHandler | ✅ Activo |
| `/capacity` | GET, PUT | capacityHandler | ✅ Activo |
| `/domains` | GET, POST | domainsHandler | ✅ Activo |
| `/statuses` | GET | statusesHandler | ✅ Activo |
| `/concept-tasks` | GET, POST, PUT, DELETE | conceptTasksHandler | ✅ Activo |
| `/jira` | POST | jiraHandler | ✅ Activo |

---

### 10.5. Archivos NO Utilizados en Producción

Los siguientes directorios contienen archivos temporales o de desarrollo que NO se utilizan en producción:

- `backend/lambda-*-temp/`: Versiones temporales de handlers
- `backend/test-extract/`: Código de prueba
- `mockup-asignacion-recursos.html`: Prototipo
- Scripts de migración ya aplicados

---

## 11. CONCLUSIONES

### Resumen del Inventario

El Sistema de Gestión de Capacidad y Planificación de Recursos está compuesto por:

✅ **Frontend modular** con 2 páginas HTML, 7 archivos CSS y 17 módulos JavaScript ES6  
✅ **Backend serverless** con 8 Lambda handlers en Node.js y Prisma ORM  
✅ **Base de datos PostgreSQL** con 9 tablas y 4 vistas materializadas  
✅ **Infraestructura AWS** completamente configurada y desplegada  
✅ **Testing automatizado** con Playwright  
✅ **Documentación completa** y actualizada

### Estado del Proyecto

**Versión**: 1.2.0  
**Estado**: ✅ **Producción - Totalmente funcional**  
**Última actualización**: 20 de Enero de 2026

### Archivos Clave en Producción

**Frontend**:
1. `index-modular.html` - Aplicación principal
2. `login.html` - Autenticación
3. `assets/css/*` - 7 archivos de estilos
4. `assets/js/*` - 17 módulos JavaScript

**Backend**:
1. `backend/lambda-all-handlers/functions/*` - 8 handlers
2. `backend/lambda-all-handlers/lib/*` - 4 librerías
3. `backend/lambda-all-handlers/prisma/schema.prisma` - Schema de BD

**Documentación**:
1. `README.md` - Documentación general
2. `MAPA_CONEXIONES.md` - Arquitectura
3. `INVENTARIO_APLICACION.md` - Este inventario

---

**Fin del Inventario**

---

*Documento generado automáticamente el 20 de Enero de 2026*  
*Organización: Naturgy LCS*  
*Proyecto: Sistema de Gestión de Capacidad y Planificación de Recursos*
```javascript
// GET /projects
// Lista proyectos filtrados por equipo
async function listProjects(event) {
  const team = event.headers['x-user-team'];
  const projects = await prisma.project.findMany({
    where: { team },
    include: { domain: true, status: true }
  });
  return success(projects);
}

// GET /projects/:id
async function getProject(event) { ... }

// POST /projects
async function createProject(event) {
  const data = JSON.parse(event.body);
  // Validación
  const project = await prisma.project.create({ data });
  return success(project);
}

// PUT /projects/:id
async function updateProject(event) { ... }

// DELETE /projects/:id
async function deleteProject(event) { ... }
```

**Validaciones**:
- Código único por equipo
- Fechas válidas (inicio < fin)
- Dominio y estado existen
- Usuario pertenece al equipo

---

#### 5.1.2. Resources Handler

**Archivo**: `backend/lambda-all-handlers/functions/resourcesHandler.js`  
**Propósito**: CRUD de recursos  
**Endpoints**: `/resources`

**Operaciones**:
```javascript
// GET /resources
async function listResources(event) {
  const team = event.headers['x-user-team'];
  const resources = await prisma.resource.findMany({
    where: { team, active: true },
    include: { resourceSkills: true }
  });
  return success(resources);
}

// POST /resources
async function createResource(event) { ... }

// PUT /resources/:id
async function updateResource(event) { ... }

// DELETE /resources/:id (soft delete)
async function deactivateResource(event) {
  await prisma.resource.update({
    where: { id },
    data: { active: false }
  });
}
```

---

#### 5.1.3. Assignments Handler

**Archivo**: `backend/lambda-all-handlers/functions/assignmentsHandler.js`  
**Propósito**: Gestión de asignaciones recurso-proyecto  
**Endpoints**: `/assignments`

**Operaciones**:
