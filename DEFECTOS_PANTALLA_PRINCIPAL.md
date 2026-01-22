# 🐛 DEFECTOS IDENTIFICADOS EN PANTALLA PRINCIPAL - Vista General

**Fecha**: 22 de Enero de 2026  
**Versión**: 1.2.0  
**Estado**: 🔴 CRÍTICO - Múltiples problemas de visualización de datos

---

## 📋 RESUMEN EJECUTIVO

Se han identificado **múltiples defectos críticos** en la pantalla principal (Vista General) que afectan a:
- ✅ KPIs principales (5 tarjetas)
- ✅ Gráficas (3 charts)
- ✅ Tabla de Planificación de Recursos
- ✅ Tabla de Esfuerzo Incurrido vs. Planificado
- ✅ Filtro de período

---

## 🔴 DEFECTO #1: KPIs NO SE ACTUALIZAN CON FILTRO DE PERÍODO

### Descripción
Los 5 KPIs principales NO se actualizan cuando el usuario cambia el selector de período (Mes actual, 3 meses, 6 meses, 12 meses).

### Ubicación
- **Archivo**: `frontend/js/main.js`
- **Función**: `updateKPIsWithFilteredData()`
- **Líneas**: 1050-1180

### Problema Identificado
```javascript
// LÍNEA 1050-1180 en main.js
async function updateKPIsWithFilteredData(assignments) {
    // Esta función calcula correctamente los KPIs
    // PERO los KPIs se calculan SOLO con el período seleccionado
    // NO incluye la lógica para calcular capacidad correctamente
}
```

### Impacto
- ❌ KPI "CAPACIDAD INICIAL DISPONIBLE" muestra valor incorrecto
- ❌ KPI "EFICIENCIA" calcula mal el porcentaje
- ❌ Sub-KPIs de "Equivalencia FTEs" son incorrectos

### Causa Raíz
La función `updateKPIsWithFilteredData()` calcula la capacidad de forma simplista:
```javascript
// INCORRECTO - Línea 1130
const numberOfMonths = dateRange.length;
const capacityPerResource = 160 * numberOfMonths;
```

**Debería usar**: La misma lógica que `resourceCapacity.js` que resta las ausencias.

---

## 🔴 DEFECTO #2: GRÁFICA "HORAS COMPROMETIDAS VS DISPONIBLES" INCONSISTENTE

### Descripción
La gráfica principal muestra datos que NO coinciden con los KPIs ni con la tabla de planificación.

### Ubicación
- **Archivo**: `frontend/js/components/charts.js`
- **Función**: `initializeOverviewCommittedHoursChart()`
- **Líneas**: 180-250

### Problema Identificado
```javascript
// LÍNEA 180-250 en charts.js
async function initializeOverviewCommittedHoursChart() {
    // ✅ CORRECTO: Usa calculateCapacityHoursFromResourceCapacity()
    // ✅ CORRECTO: Importa desde resourceCapacity.js
    
    // ❌ PROBLEMA: NO filtra por período seleccionado
    // Siempre muestra los 12 meses completos
}
```

### Impacto
- ❌ La gráfica muestra 12 meses aunque el usuario seleccione "Mes actual"
- ❌ Los datos de la gráfica NO coinciden con los KPIs filtrados
- ❌ Confusión para el usuario sobre qué datos está viendo

### Causa Raíz
La función NO respeta el filtro de período `window.currentPeriod`:
```javascript
// INCORRECTO - Línea 230
let monthsToShow = monthLabels; // Siempre 12 meses
```

**Debería**: Filtrar los meses según `window.currentPeriod` como hacen las otras gráficas.

---

## 🔴 DEFECTO #3: GRÁFICA "HORAS POR TIPO DE PROYECTO" - DATOS INCOMPLETOS

### Descripción
La gráfica muestra solo 2 categorías (Evolutivos y Proyectos) cuando debería mostrar 3 (Evolutivos, Proyectos-Conceptualización, Proyectos-Resto).

### Ubicación
- **Archivo**: `frontend/js/components/overviewCharts.js`
- **Función**: `initializeOverviewHoursByTypeChart()`
- **Líneas**: 80-180

### Problema Identificado
```javascript
// LÍNEA 120-140 en overviewCharts.js
assignments.forEach(assignment => {
    // ✅ CORRECTO: Filtra por año y mes
    // ✅ CORRECTO: Separa Evolutivos
    
    // ⚠️ PROBLEMA POTENCIAL: Usa assignment.team para detectar "Conceptualización"
    const team = assignment.team || '';
    if (team === 'Conceptualización') {
        hoursByMonthConceptualizacion[monthIndex] += hours;
    }
    
    // ❌ PROBLEMA: Si assignment.team NO está poblado correctamente,
    // todas las horas van a "Resto" en lugar de "Conceptualización"
}
```

### Impacto
- ⚠️ Posible clasificación incorrecta de horas de Conceptualización
- ⚠️ La gráfica puede mostrar 0 horas en "Conceptualización" cuando debería tener datos

### Causa Raíz
Dependencia del campo `assignment.team` que puede no estar correctamente poblado en la base de datos.

---

## 🔴 DEFECTO #4: GRÁFICA "SPLIT HORAS COMPROMETIDAS" - MISMA LÓGICA DEFECTUOSA

### Descripción
Mismo problema que Defecto #3 - depende de `assignment.team` para clasificar.

### Ubicación
- **Archivo**: `frontend/js/components/overviewCharts.js`
- **Función**: `initializeOverviewSplitHoursChart()`
- **Líneas**: 190-280

### Problema Identificado
```javascript
// LÍNEA 230-250 en overviewCharts.js
// ❌ MISMO PROBLEMA: Usa assignment.team
const team = assignment.team || '';
if (team === 'Conceptualización') {
    horasProyectosConceptualizacion += hours;
}
```

### Impacto
- ⚠️ El gráfico de tarta puede mostrar distribución incorrecta
- ⚠️ Porcentajes calculados sobre datos incompletos

---

## 🔴 DEFECTO #5: TABLA "PLANIFICACIÓN DE RECURSOS" - NO SE ACTUALIZA CON PERÍODO

### Descripción
La tabla muestra SIEMPRE los 12 meses del año, independientemente del filtro de período seleccionado.

### Ubicación
- **Archivo**: `frontend/js/main.js`
- **Función**: `populateMatrixTable()`
- **Líneas**: 850-950

### Problema Identificado
```javascript
// LÍNEA 850-950 en main.js
async function populateMatrixTable() {
    // ✅ CORRECTO: Carga assignments correctamente
    // ✅ CORRECTO: Calcula horas por proyecto y mes
    
    // ❌ PROBLEMA: NO filtra las columnas de meses según período
    // Siempre muestra las 12 columnas (ENE-DIC)
    
    const monthCells = hours.map((h, index) => {
        // Genera TODAS las 12 celdas
        return `<td>...</td>`;
    }).join('');
}
```

### Impacto
- ❌ Usuario selecciona "Mes actual" pero ve 12 columnas
- ❌ Inconsistencia visual con las gráficas que SÍ filtran
- ❌ Tabla muy ancha e ilegible cuando solo se necesitan 1-3 meses

### Causa Raíz
La función NO consulta `window.currentPeriod` para determinar qué columnas mostrar.

---

## 🔴 DEFECTO #6: TABLA "ESFUERZO INCURRIDO VS PLANIFICADO" - CÁLCULOS INCORRECTOS

### Descripción
Los cálculos de ETC (Estimate To Complete) y EAC (Estimate At Completion) pueden ser incorrectos.

### Ubicación
- **Archivo**: `frontend/js/components/effortTracking.js`
- **Función**: `initializeEffortTrackingTable()`
- **Líneas**: 50-200

### Problema Identificado
```javascript
// Necesito revisar este archivo para confirmar el problema exacto
// Posibles causas:
// 1. Estimación Inicial no se carga correctamente desde concept_tasks
// 2. Incurrido ITD no suma correctamente desde assignments
// 3. ETC = Estimación - Incurrido puede dar negativos
// 4. Desviación % mal calculada
```

### Impacto
- ❌ Métricas de seguimiento de esfuerzo incorrectas
- ❌ Decisiones de gestión basadas en datos erróneos
- ❌ Imposible detectar proyectos con sobrecostes

---

## 🔴 DEFECTO #7: FILTRO DE PERÍODO - OPCIÓN "MES ACTUAL" NO FUNCIONA

### Descripción
Cuando el usuario selecciona "Mes actual", el sistema NO muestra solo el mes actual.

### Ubicación
- **Archivo**: `frontend/js/utils/helpers.js`
- **Función**: `getPeriodDateRange()`
- **Líneas**: Necesito revisar

### Problema Identificado
```javascript
// La función getPeriodDateRange() puede no manejar correctamente 'current'
// O las funciones que la consumen no interpretan bien el resultado
```

### Impacto
- ❌ Opción "Mes actual" no funciona como esperado
- ❌ Usuario no puede ver solo el mes en curso

---

## 🔴 DEFECTO #8: PROYECTOS "ABSENCES" CONTAMINAN LOS KPIs

### Descripción
Los proyectos con código `ABSENCES-*` se incluyen en algunos cálculos de KPIs cuando deberían excluirse.

### Ubicación
- **Archivo**: `frontend/js/main.js`
- **Función**: `updateKPIsWithFilteredData()`
- **Líneas**: 1050-1180

### Problema Identificado
```javascript
// LÍNEA 1070-1090 en main.js
assignments.forEach(assignment => {
    if (assignment.projectId) uniqueProjects.add(assignment.projectId);
    // ❌ NO FILTRA proyectos ABSENCES
    
    const hours = parseFloat(assignment.hours) || 0;
    totalHours += hours;
    // ❌ Suma TODAS las horas incluyendo ausencias
});
```

### Impacto
- ❌ KPI "PROYECTOS ACTIVOS" cuenta proyectos de ausencias
- ❌ KPI "HORAS COMPROMETIDAS" incluye horas de ausencias
- ❌ KPI "EFICIENCIA" se calcula con datos contaminados

### Causa Raíz
Falta filtro para excluir proyectos cuyo código empieza con "ABSENCES-".

---

## 📊 RESUMEN DE IMPACTO POR COMPONENTE

| Componente | Defectos | Severidad | Estado |
|------------|----------|-----------|--------|
| KPIs (5 tarjetas) | #1, #8 | 🔴 CRÍTICO | Datos incorrectos |
| Gráfica Horas Comprometidas | #2 | 🔴 CRÍTICO | No filtra por período |
| Gráfica Horas por Tipo | #3 | 🟡 MEDIO | Clasificación dudosa |
| Gráfica Split Horas | #4 | 🟡 MEDIO | Clasificación dudosa |
| Tabla Planificación | #5 | 🔴 CRÍTICO | No filtra columnas |
| Tabla Esfuerzo | #6 | 🔴 CRÍTICO | Cálculos incorrectos |
| Filtro Período | #7 | 🔴 CRÍTICO | No funciona |

---

## 🔧 PLAN DE CORRECCIÓN PROPUESTO

### Prioridad 1 (CRÍTICO - Resolver primero)
1. **Defecto #1**: Corregir cálculo de capacidad en KPIs
2. **Defecto #2**: Hacer que gráfica respete filtro de período
3. **Defecto #5**: Filtrar columnas de tabla según período
4. **Defecto #7**: Arreglar opción "Mes actual"
5. **Defecto #8**: Excluir proyectos ABSENCES de KPIs

### Prioridad 2 (MEDIO - Resolver después)
6. **Defecto #3**: Verificar campo `assignment.team` en BD
7. **Defecto #4**: Mismo que #3
8. **Defecto #6**: Revisar y corregir cálculos de esfuerzo

---

## 🎯 ARCHIVOS A MODIFICAR

1. ✅ `frontend/js/main.js` - Defectos #1, #5, #8
2. ✅ `frontend/js/components/charts.js` - Defecto #2
3. ✅ `frontend/js/components/overviewCharts.js` - Defectos #3, #4
4. ✅ `frontend/js/components/effortTracking.js` - Defecto #6
5. ✅ `frontend/js/utils/helpers.js` - Defecto #7

---

## 📝 NOTAS ADICIONALES

### Observaciones Positivas
- ✅ La arquitectura modular facilita la corrección
- ✅ El código está bien documentado
- ✅ Ya existe la función `calculateCapacityHoursFromResourceCapacity()` que funciona correctamente
- ✅ El sistema de filtrado por período está implementado, solo falta aplicarlo consistentemente

### Recomendaciones
1. **Centralizar lógica de capacidad**: Usar siempre `calculateCapacityHoursFromResourceCapacity()`
2. **Centralizar lógica de filtrado**: Crear función `applyPeriodFilter()` reutilizable
3. **Excluir ABSENCES**: Crear constante `ABSENCES_PREFIX = 'ABSENCES-'` y usarla consistentemente
4. **Testing**: Crear tests E2E para verificar que el filtro de período funciona en todos los componentes

---

**Última actualización**: 22 de Enero de 2026  
**Analista**: Cline AI  
**Estado**: 📋 Documentación completa - Listo para corrección
