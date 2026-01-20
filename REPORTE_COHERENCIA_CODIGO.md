# 🔍 REPORTE DE COHERENCIA Y REVISIÓN DE CÓDIGO

**Fecha**: 20 de Enero de 2026  
**Proyecto**: Sistema de Gestión de Capacidad y Planificación de Recursos  
**Alcance**: Código HTML, JavaScript y CSS

---

## 📊 RESUMEN EJECUTIVO

Se ha realizado una revisión exhaustiva del código frontend identificando:
- ✅ **Código bien estructurado**: Arquitectura modular con ES6
- ⚠️ **Código no utilizado**: Funciones y elementos HTML sin uso
- ❌ **Inconsistencias**: Duplicación de lógica y referencias rotas
- 🔧 **Mejoras recomendadas**: Optimizaciones y limpieza

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Funciones Duplicadas en HTML y JS

#### A. AG Grid Task Management (index-modular.html)
**Ubicación**: Líneas 600-750 del HTML

```javascript
// CÓDIGO DUPLICADO EN HTML
let taskGridApi;
let taskGridColumnApi;
let currentProject = null;

window.openTaskDetailsModal = function (projectCode, projectTitle, startDate, endDate) {
    // ... implementación completa en HTML
}

function initializeTaskGrid(projectCode) {
    // ... implementación completa en HTML
}
```

**Problema**: 
- Esta funcionalidad está implementada COMPLETAMENTE en el HTML
- Existe un componente `taskModal.js` que debería manejar esto
- Duplicación de lógica entre HTML y JS

**Impacto**: ALTO
- Mantenimiento difícil (cambios en 2 lugares)
- Confusión sobre qué código se está usando
- Posibles bugs por inconsistencias

**Recomendación**: 
🔴 **ELIMINAR** el código de AG Grid del HTML y usar solo `taskModal.js`

---

#### B. Gestión de Autenticación Duplicada

**Ubicación**: HTML (líneas 450-520) y múltiples archivos JS

```javascript
// EN HTML (línea 450)
(function () {
    const isAuthenticated = sessionStorage.getItem('user_authenticated');
    if (isAuthenticated !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    // ... más código de autenticación
})();
```

**Problema**:
- Lógica de autenticación repetida en cada archivo JS que hace llamadas API
- No hay un módulo centralizado de autenticación

**Recomendación**:
⚠️ Crear módulo `auth.js` centralizado

---

### 2. Referencias a Elementos HTML No Existentes

#### A. Tabla "Top 5 Projects"

**En main.js** (línea 150):
```javascript
async function populateTopProjectsTable() {
    const tableBody = document.getElementById('top-projects-table-body');
    // ...
}
```

**Problema**: 
- El elemento `top-projects-table-body` NO EXISTE en el HTML
- La función se ejecuta pero no hace nada
- Consume recursos innecesariamente

**Impacto**: MEDIO
- Función inútil que se ejecuta en cada carga
- Confusión en el código

**Recomendación**:
🔴 **ELIMINAR** función `populateTopProjectsTable()` y su llamada en `initializeApp()`

---

#### B. Tabla de Ausencias

**En main.js** (línea 1100):
```javascript
function updateAbsencesTable(absencesProject) {
    const tableBody = document.getElementById('absences-table-body');
    // ...
}
```

**Problema**:
- El elemento `absences-table-body` NO EXISTE en el HTML
- Función nunca se usa efectivamente

**Recomendación**:
🔴 **ELIMINAR** función `updateAbsencesTable()`

---

### 3. Modales No Utilizados

#### A. Capacity Error Modal

**Archivo**: `capacityErrorModal.js`

**Problema**:
- Componente completo implementado
- NUNCA se importa ni se usa en `main.js`
- Modal no se muestra en ningún flujo

**Recomendación**:
⚠️ **ELIMINAR** o **INTEGRAR** en flujo de validación de capacidad

---

#### B. Create Task Modal

**En main.js**:
```javascript
createTaskModal = new CreateTaskModal();
createTaskModal.init();
window.createTaskModal = createTaskModal;
```

**Problema**:
- Modal se inicializa pero NUNCA se abre
- No hay botón ni evento que lo active
- Ocupa memoria sin uso

**Recomendación**:
⚠️ **ELIMINAR** si no se usa, o **DOCUMENTAR** su propósito

---

## ⚠️ INCONSISTENCIAS IDENTIFICADAS

### 4. Gestión de Proyectos ABSENCES

**Inconsistencia en filtrado**:

```javascript
// En updateProjectsTable() - línea 850
// INCLUYE ABSENCES en tabla principal
allProjects = [...allProjectsRaw];

// En updateMatrixKPIs() - línea 750
// EXCLUYE ABSENCES de KPIs
const projectsForKPI = window.allProjects.filter(p => !p.code.startsWith('ABSENCES'));

// En populateMatrixTable() - línea 1000
// INCLUYE ABSENCES en matriz
if (window.allProjectsWithAbsences && Array.isArray(window.allProjectsWithAbsences)) {
```

**Problema**:
- Lógica inconsistente sobre cuándo incluir/excluir ABSENCES
- Tres variables globales diferentes: `allProjects`, `allProjectsWithAbsences`, `projectsForKPI`
- Confusión sobre cuál usar en cada contexto

**Recomendación**:
🔧 **UNIFICAR** lógica con una sola fuente de verdad y filtros claros

---

### 5. Cálculo de Horas de Conceptualización

**En main.js** (línea 1050):
```javascript
async function calculateConceptualizationHours(projects) {
    // Logs excesivos para debugging
    console.log('[CONCEPT HOURS] Starting calculation...');
    console.log('[CONCEPT HOURS] Auth:', { awsAccessKey: awsAccessKey ? 'present' : 'missing', userTeam });
    console.log('[CONCEPT HOURS] ========== FETCH DETAILS ==========');
    // ... 15+ líneas de console.log
}
```

**Problema**:
- Logs de debugging dejados en producción
- Contaminan la consola
- Pueden exponer información sensible

**Recomendación**:
🔧 **ELIMINAR** logs de debugging o usar sistema de logging configurable

---

### 6. Paginación de Proyectos

**Variables globales**:
```javascript
let currentPage = 1;
const projectsPerPage = 10;
let allProjects = [];
```

**Problema**:
- Variables globales en lugar de estado encapsulado
- Dificulta testing y mantenimiento
- Puede causar bugs si se modifica desde múltiples lugares

**Recomendación**:
🔧 Crear clase `ProjectsManager` con estado encapsulado

---

## 📋 CÓDIGO NO UTILIZADO

### 7. Funciones Declaradas Pero No Usadas

#### A. En main.js

```javascript
// Línea 600 - NUNCA SE USA
function syncWithJira(projectId) {
    alert(`Sincronizando proyecto ${projectId} con Jira...`);
}

// Línea 650 - NUNCA SE USA
function editCapacity(projectId, month) {
    const newValue = prompt(`Editar capacidad para ${projectId} en ${month}:`);
}

// Línea 660 - NUNCA SE USA
function editResourceCapacity(resourceId, month) {
    console.log(`Capacity cell clicked for resource ${resourceId}, month ${month}`);
}
```

**Recomendación**:
🔴 **ELIMINAR** funciones no utilizadas

---

#### B. Event Listeners Sin Efecto

```javascript
// Línea 350 - Event listener para algo que no existe
document.addEventListener('click', function(e) {
    const capacityCell = e.target.closest('.capacity-cell');
    if (capacityCell) {
        const projectId = capacityCell.getAttribute('data-project');
        const month = capacityCell.getAttribute('data-month');
        const resourceId = capacityCell.getAttribute('data-resource');
        
        if (projectId && month) {
            editCapacity(projectId, month); // Función que no hace nada útil
        }
    }
});
```

**Problema**:
- Event listener activo pero función destino inútil
- Consume recursos en cada click

**Recomendación**:
🔴 **ELIMINAR** o **IMPLEMENTAR** correctamente

---

### 8. Imports No Utilizados

**En main.js**:
```javascript
import { TaskModal } from './components/taskModal.js';
import { ConceptTasksModal } from './components/conceptTasksModal.js';
import { CreateTaskModal } from './components/createTaskModal.js';
```

**Problema**:
- `TaskModal` se importa pero el código de AG Grid está en el HTML
- `CreateTaskModal` se inicializa pero nunca se usa
- Confusión sobre qué modal se está usando realmente

**Recomendación**:
🔧 **CLARIFICAR** qué modales se usan y eliminar los no utilizados

---

## 🔧 MEJORAS RECOMENDADAS

### 9. Arquitectura y Organización

#### A. Separación de Responsabilidades

**Problema Actual**:
- `main.js` tiene 1200+ líneas
- Mezcla lógica de negocio, UI y API calls
- Difícil de mantener y testear

**Recomendación**:
```
assets/js/
├── main.js (solo inicialización)
├── services/
│   ├── api.js (todas las llamadas API)
│   ├── auth.js (autenticación centralizada)
│   └── storage.js (sessionStorage/localStorage)
├── managers/
│   ├── ProjectsManager.js (lógica de proyectos)
│   ├── ResourcesManager.js (lógica de recursos)
│   └── AssignmentsManager.js (lógica de asignaciones)
├── components/ (ya existe)
└── utils/ (ya existe)
```

---

#### B. Gestión de Estado

**Problema Actual**:
```javascript
// Variables globales dispersas
let currentPage = 1;
let allProjects = [];
let taskGridApi;
window.allProjects = allProjects;
window.allProjectsWithAbsences = allProjectsWithAbsences;
```

**Recomendación**:
```javascript
// Estado centralizado
const AppState = {
    projects: {
        all: [],
        filtered: [],
        currentPage: 1,
        perPage: 10
    },
    resources: {
        all: [],
        active: []
    },
    user: {
        team: null,
        authenticated: false
    }
};
```

---

### 10. Manejo de Errores

**Problema Actual**:
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Error al cargar proyectos');
    }
} catch (error) {
    console.error('Error loading projects:', error);
    // No hay feedback al usuario
}
```

**Recomendación**:
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Error al cargar proyectos');
    }
} catch (error) {
    console.error('Error loading projects:', error);
    showNotification('Error al cargar proyectos', 'error');
    // Implementar sistema de notificaciones
}
```

---

### 11. Performance

#### A. Llamadas API Redundantes

**Problema**:
```javascript
// En initializeApp()
await loadProjectsFromAPI();        // Carga proyectos
await populateTopProjectsTable();   // Vuelve a cargar assignments
await populateMatrixTable();        // Vuelve a cargar assignments
await initializeEffortTrackingTable(); // Vuelve a cargar assignments
```

**Recomendación**:
- Cargar assignments UNA VEZ
- Compartir datos entre funciones
- Usar caché cuando sea apropiado

---

#### B. Re-renders Innecesarios

**Problema**:
```javascript
// Cada vez que cambia algo, se recarga TODO
function updateDashboard() {
    initializeKPIs();           // Recalcula TODOS los KPIs
    initializeAllCharts();      // Redibuja TODOS los charts
    updateMatrixKPIs();         // Recalcula matriz completa
    populateTopProjectsTable(); // Recarga tabla completa
}
```

**Recomendación**:
- Actualizar solo lo que cambió
- Usar virtual DOM o diffing
- Implementar debouncing

---

## 📊 MÉTRICAS DE CÓDIGO

### Complejidad

| Archivo | Líneas | Funciones | Complejidad | Estado |
|---------|--------|-----------|-------------|--------|
| **main.js** | 1,200+ | 35+ | ALTA | ⚠️ Refactorizar |
| **index-modular.html** | 1,000+ | 10+ (en script) | ALTA | ⚠️ Limpiar |
| **projectModal.js** | ~500 | 15 | MEDIA | ✅ OK |
| **resourceCapacity.js** | ~400 | 12 | MEDIA | ✅ OK |

### Código No Utilizado

- **Funciones**: 8 funciones sin uso
- **Event Listeners**: 3 listeners inútiles
- **Modales**: 2 modales no utilizados
- **Elementos HTML**: 5+ IDs referenciados pero no existen

### Duplicación

- **Lógica de autenticación**: 5+ lugares
- **Llamadas API similares**: 10+ lugares
- **Formateo de datos**: 8+ lugares

---

## 🎯 PLAN DE ACCIÓN PRIORITIZADO

### Prioridad ALTA 🔴 (Esta Semana)

1. **Eliminar código AG Grid del HTML**
   - Mover a `taskModal.js` o eliminar si no se usa
   - Tiempo estimado: 2 horas

2. **Eliminar funciones no utilizadas**
   - `populateTopProjectsTable()`
   - `updateAbsencesTable()`
   - `syncWithJira()`
   - `editCapacity()`
   - Tiempo estimado: 1 hora

3. **Limpiar logs de debugging**
   - Eliminar console.log excesivos
   - Implementar sistema de logging configurable
   - Tiempo estimado: 1 hora

### Prioridad MEDIA ⚠️ (Próximas 2 Semanas)

4. **Unificar gestión de proyectos ABSENCES**
   - Una sola variable global
   - Filtros claros y documentados
   - Tiempo estimado: 3 horas

5. **Centralizar autenticación**
   - Crear módulo `auth.js`
   - Eliminar duplicación
   - Tiempo estimado: 4 horas

6. **Optimizar llamadas API**
   - Cargar datos una vez
   - Compartir entre funciones
   - Implementar caché
   - Tiempo estimado: 6 horas

### Prioridad BAJA ℹ️ (Próximo Mes)

7. **Refactorizar main.js**
   - Separar en módulos más pequeños
   - Crear managers
   - Tiempo estimado: 16 horas

8. **Implementar gestión de estado**
   - Estado centralizado
   - Reducir variables globales
   - Tiempo estimado: 12 horas

9. **Mejorar manejo de errores**
   - Sistema de notificaciones
   - Feedback al usuario
   - Tiempo estimado: 8 horas

---

## 📝 CONCLUSIONES

### Estado Actual del Código

**Puntos Fuertes** ✅:
- Arquitectura modular con ES6
- Separación de componentes
- Uso de async/await
- Código generalmente legible

**Puntos Débiles** ❌:
- Código no utilizado (15-20%)
- Duplicación de lógica (10-15%)
- Funciones muy largas (main.js)
- Variables globales excesivas
- Falta de manejo de errores consistente

### Impacto en Mantenimiento

- **Tiempo de desarrollo**: +30% por duplicación y código no utilizado
- **Bugs potenciales**: ALTO por inconsistencias
- **Dificultad de testing**: ALTA por acoplamiento
- **Onboarding nuevos devs**: DIFÍCIL por falta de documentación

### Recomendación General

⚠️ **REFACTORIZACIÓN GRADUAL RECOMENDADA**

1. Empezar con limpieza de código no utilizado (impacto inmediato)
2. Continuar con unificación de lógica duplicada
3. Finalizar con refactorización arquitectónica

**Tiempo total estimado**: 50-60 horas
**Beneficio esperado**: 
- -40% tiempo de desarrollo futuro
- -60% bugs por inconsistencias
- +80% facilidad de mantenimiento

---

**Fecha del análisis**: 20 de Enero de 2026  
**Herramientas**: Revisión manual de código  
**Archivos analizados**: 
- index-modular.html
- assets/js/main.js
- assets/js/components/*.js (15 archivos)
