// Main Application Entry Point

import appState from './state/AppState.js';
import apiService from './services/api.js';
import projectsManager from './managers/ProjectsManager.js';
import resourcesManager from './managers/ResourcesManager.js';
import assignmentsManager from './managers/AssignmentsManager.js';
import { initializeTabs } from './components/tabs.js';
import { initializeAllCharts } from './components/charts.js';
import { initializeKPIs } from './components/kpi.js';
import { initializeEffortTrackingTable } from './components/effortTracking.js';
import { 
    initProjectModal, 
    openCreateProjectModal, 
    openEditProjectModal, 
    openDeleteModal 
} from './components/projectModal.js';
import { 
    initResourceModal,
    openCreateResourceModal,
    openEditResourceModal,
    openDeleteResourceModal
} from './components/resourceModal.js';
import { TaskModal } from './components/taskModal.js';
import { ConceptTasksModal } from './components/conceptTasksModal.js';
import { CreateTaskModal } from './components/createTaskModal.js';
import { ResourceCapacityModal } from './components/resourceCapacityModal.js';
import { JiraModal } from './components/jiraModal.js';
import { openAssignmentView } from './components/assignmentView.js';
import { initializeResourceCapacity } from './components/resourceCapacity.js';
import { projectMetadata, projectSkillBreakdown, monthKeys, API_CONFIG } from './config/data.js';
import { 
    getPriorityText, 
    getPriorityClass, 
    getStatusText, 
    getStatusClass,
    getDomainText,
    truncateText,
    formatNumber,
    getPeriodDateRange
} from './utils/helpers.js';

// Make getPeriodDateRange globally available for charts
window.getPeriodDateRange = getPeriodDateRange;

// Global modal instances
let taskModal = null;
let conceptTasksModal = null;
let createTaskModal = null;
let capacityModal = null;
let jiraModal = null;

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('Initializing Capacity Planning Application...');
    
    // Check if we need to restore a specific tab
    const activeTab = sessionStorage.getItem('activeTab');
    if (activeTab) {
        console.log('Restoring active tab:', activeTab);
        sessionStorage.removeItem('activeTab'); // Clear the flag
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            const tabButton = document.querySelector(`[data-tab="${activeTab}"]`);
            if (tabButton) {
                tabButton.click();
                console.log('Tab restored:', activeTab);
            }
        }, 100);
    }
    
    // Initialize components
    initializeTabs();
    
    // Set initial period from selector BEFORE initializing charts
    const periodSelector = document.getElementById('period-selector');
    if (periodSelector) {
        window.currentPeriod = periodSelector.value || 'next12';
        console.log('Initial period set to:', window.currentPeriod);
    }
    
    initProjectModal();
    initResourceModal();
    initializeResourceCapacity();
    
    // Initialize modals
    taskModal = new TaskModal();
    taskModal.init();
    
    conceptTasksModal = new ConceptTasksModal();
    conceptTasksModal.init();
    
    createTaskModal = new CreateTaskModal();
    createTaskModal.init();
    
    capacityModal = new ResourceCapacityModal();
    capacityModal.init();
    
    jiraModal = new JiraModal();
    jiraModal.init();
    
    // Make modals globally available
    window.conceptTasksModal = conceptTasksModal;
    window.createTaskModal = createTaskModal;
    window.capacityModal = capacityModal;
    window.jiraModal = jiraModal;
    console.log('Modals initialized:', { conceptTasksModal: !!window.conceptTasksModal, createTaskModal: !!window.createTaskModal, capacityModal: !!window.capacityModal, jiraModal: !!window.jiraModal });
    
    // Load all data once at startup
    await loadInitialData();
    
    // Update UI with loaded data
    updateMatrixKPIs();
    await populateMatrixTable();
    await initializeEffortTrackingTable();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Apply initial period filter to KPIs
    const initialPeriod = window.currentPeriod || 'next12';
    await updateDashboardByPeriod(initialPeriod);
    
    // Check if we need to activate the projects tab after Jira import
    const activateProjectsTab = sessionStorage.getItem('activate_projects_tab');
    if (activateProjectsTab === 'true') {
        // Remove the flag
        sessionStorage.removeItem('activate_projects_tab');
        
        // Activate the projects tab
        console.log('Activating projects tab after Jira import...');
        
        // Deactivate all tabs
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Activate projects tab
        const projectsTabButton = document.querySelector('.tab-button[data-tab="projects-tab"]');
        const projectsTabContent = document.getElementById('projects-tab');
        
        if (projectsTabButton && projectsTabContent) {
            projectsTabButton.classList.add('active');
            projectsTabContent.classList.add('active');
            console.log('Projects tab activated successfully');
        }
    }
    
    console.log('Application initialized successfully!');
}

/**
 * Load all initial data once (optimized to avoid redundant API calls)
 */
async function loadInitialData() {
    console.log('Loading initial data...');
    const startTime = performance.now();
    
    try {
        // Load all data in parallel for better performance
        const [projects, resources, assignments] = await Promise.all([
            projectsManager.loadProjects(),
            resourcesManager.loadResources(),
            assignmentsManager.loadAssignments()
        ]);
        
        // Store in AppState for caching
        appState.setProjects(projects.filter(p => !p.code.startsWith('ABSENCES')));
        appState.setProjectsWithAbsences(projects);
        appState.setResources(resources);
        appState.setAssignments(assignments);
        
        // Update projects table
        updateProjectsTable(projects);
        
        const endTime = performance.now();
        console.log(`Initial data loaded in ${Math.round(endTime - startTime)}ms:`, {
            projects: projects.length,
            resources: resources.length,
            assignments: assignments.length
        });
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

/**
 * Load projects from API and populate the table
 */
async function loadProjectsFromAPI() {
    try {
        console.log('Loading projects from API...');
        
        // Use projectsManager to load projects
        const projects = await projectsManager.loadProjects();
        
        // Update table
        updateProjectsTable(projects);
        
        console.log(`Loaded ${projects.length} projects from API`);
        
    } catch (error) {
        console.error('Error loading projects from API:', error);
        // Don't show error notification on page load, just log it
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Period selector
    const periodSelector = document.getElementById('period-selector');
    if (periodSelector) {
        periodSelector.addEventListener('change', async function() {
            console.log(`Período seleccionado: ${this.value}`);
            await updateDashboardByPeriod(this.value);
        });
    }
    
    // Project search
    const projectSearch = document.getElementById('project-search');
    if (projectSearch) {
        projectSearch.addEventListener('keyup', function() {
            filterProjects(this.value);
        });
    }
    
    // Add resource button
    const addResourceBtn = document.getElementById('add-resource-btn');
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', function() {
            console.log('Add resource button clicked!');
            openCreateResourceModal();
        });
    }
    
    // Add project button
    const addProjectBtn = document.getElementById('add-project-btn');
    console.log('Add project button found:', addProjectBtn);
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function() {
            console.log('Add project button clicked!');
            console.log('openCreateProjectModal function:', typeof openCreateProjectModal);
            openCreateProjectModal();
        });
        console.log('Event listener attached to add-project-btn');
    } else {
        console.error('Add project button NOT found!');
    }
    
    // Import Jira button
    const importJiraBtn = document.getElementById('import-jira-btn');
    if (importJiraBtn) {
        importJiraBtn.addEventListener('click', function() {
            importFromJira();
        });
    }
    
    // Tab change listener - reload projects when Projects tab is opened
    document.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (tabButton && tabButton.getAttribute('data-tab') === 'projects') {
            console.log('Projects tab opened, reloading projects...');
            loadProjectsFromAPI();
        }
    });
    
    // Expand icons for project skills and resource projects
    document.addEventListener('click', function(e) {
        const expandIcon = e.target.closest('.expand-icon');
        if (expandIcon) {
            const projectId = expandIcon.getAttribute('data-project');
            const resourceId = expandIcon.getAttribute('data-resource');
            
            if (projectId) {
                toggleProjectSkills(projectId);
            } else if (resourceId) {
                toggleResourceProjects(resourceId, expandIcon);
            }
        }
    });
    
    // Action icons
    document.addEventListener('click', function(e) {
        const actionIcon = e.target.closest('.action-icon');
        if (actionIcon) {
            const action = actionIcon.getAttribute('data-action');
            const projectId = actionIcon.getAttribute('data-project');
            
            if (action && projectId) {
                if (action === 'edit') {
                    editProject(projectId);
                } else if (action === 'tasks') {
                    openTasksModal(projectId);
                } else if (action === 'resources') {
                    openConceptTasksModal(projectId);
                } else if (action === 'delete') {
                    deleteProject(projectId);
                } else if (action === 'sync') {
                    syncWithJira(projectId);
                }
            }
        }
    });
}

/**
 * Open tasks modal for a project (Resource Assignment with AG Grid)
 */
function openTasksModal(projectCode) {
    console.log('Opening resource assignment modal for project:', projectCode);
    
    if (!taskModal) {
        console.error('Task modal not initialized');
        return;
    }
    
    // Find project in allProjects array
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found`);
        return;
    }
    
    // Load existing tasks from storage
    const existingTasks = TaskModal.loadFromStorage(project.code);
    
    // Open modal with project data and dates
    taskModal.open(project.code, project.title, existingTasks, project.startDate, project.endDate);
}

/**
 * Open concept tasks modal for a project (Conceptualization Tasks)
 */
function openConceptTasksModal(projectCode) {
    console.log('Opening concept tasks list for project:', projectCode);
    
    // Find project in allProjects array
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found`);
        return;
    }
    
    // Open assignment view which shows the list of concept tasks
    openAssignmentView(project.id, project.code, project.title);
}

/**
 * Assign resources to a project
 */
function assignResources(projectCode) {
    console.log('Opening assignment view for project:', projectCode);
    
    // Find project in allProjects array
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found`);
        return;
    }
    
    // Open assignment view with project ID, code, and title
    openAssignmentView(project.id, project.code, project.title);
}

/**
 * Filter projects in table
 */
function filterProjects(searchTerm) {
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) return;
    
    const rows = tableBody.getElementsByTagName('tr');
    const term = searchTerm.toLowerCase();
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        if (cells.length > 0) {
            const id = cells[0].textContent.toLowerCase();
            const title = cells[1].textContent.toLowerCase();
            const description = cells[2].textContent.toLowerCase();
            
            if (id.includes(term) || title.includes(term) || description.includes(term)) {
                found = true;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

/**
 * Toggle project resources breakdown - show resources assigned to project
 */
async function toggleProjectSkills(projectId) {
    console.log('Toggling resources for project:', projectId);
    
    // Find all resource rows for this project
    const resourceRows = document.querySelectorAll(`.resource-row[data-project="${projectId}"]`);
    
    // Find the expand icon
    const expandIcon = document.querySelector(`.expand-icon[data-project="${projectId}"]`);
    
    if (resourceRows.length === 0) {
        // No rows exist yet, need to create them
        await loadProjectResources(projectId, expandIcon);
    } else {
        // Rows exist, toggle visibility
        const isHidden = resourceRows[0].style.display === 'none';
        
        resourceRows.forEach(row => {
            row.style.display = isHidden ? 'table-row' : 'none';
        });
        
        // Toggle icon
        if (expandIcon) {
            expandIcon.textContent = isHidden ? '−' : '+';
        }
    }
}

/**
 * Load and display resources assigned to a project
 */
async function loadProjectResources(projectCode, expandIcon) {
    try {
        // Find the project
        const project = window.allProjects?.find(p => p.code === projectCode);
        if (!project) {
            console.error('Project not found:', projectCode);
            return;
        }
        
        // Use projectsManager to load project resources
        const resourceSkillHoursMap = await projectsManager.loadProjectResources(project.id);
        
        // Find the project row in the table
        const projectRow = document.querySelector(`.project-row[data-project="${projectCode}"]`);
        if (!projectRow) {
            console.error('Project row not found in table');
            return;
        }
        
        // Create resource rows
        const tableBody = projectRow.parentElement;
        const projectRowIndex = Array.from(tableBody.children).indexOf(projectRow);
        
        // Insert resource rows after project row
        let insertIndex = projectRowIndex + 1;
        
        resourceSkillHoursMap.forEach((data, key) => {
            const resourceRow = document.createElement('tr');
            resourceRow.className = 'resource-row';
            resourceRow.setAttribute('data-project', projectCode);
            resourceRow.style.backgroundColor = '#f9fafb';
            resourceRow.style.fontStyle = 'italic';
            
            // Build monthly cells with hours
            const monthlyCells = data.monthlyHours.map((hours, index) => {
                const display = hours > 0 ? Math.round(hours) : '-';
                return `<td style="text-align: center; font-size: 0.85em;">${display}</td>`;
            }).join('');
            
            // Create cells: empty first cell, resource name + skill, total hours in separate column, then 12 monthly cells
            resourceRow.innerHTML = `
                <td style="text-align: center;"></td>
                <td colspan="2" style="text-align: left; padding-left: 2rem;">
                    ${data.name} - ${data.skill}
                </td>
                <td style="text-align: center; font-weight: bold;">${formatNumber(Math.round(data.totalHours))}</td>
                ${monthlyCells}
            `;
            
            // Insert at the correct position
            if (insertIndex < tableBody.children.length) {
                tableBody.insertBefore(resourceRow, tableBody.children[insertIndex]);
            } else {
                tableBody.appendChild(resourceRow);
            }
            
            insertIndex++;
        });
        
        // Change icon to minus
        if (expandIcon) {
            expandIcon.textContent = '−';
        }
        
        console.log(`Loaded ${resourceSkillHoursMap.size} resource-skill combinations for project ${projectCode}`);
        
    } catch (error) {
        console.error('Error loading project resources:', error);
        alert('Error al cargar recursos del proyecto');
    }
}

/**
 * Toggle resource projects visibility
 */
function toggleResourceProjects(resourceId, expandIcon) {
    // Find all skill rows for this resource
    const skillRows = document.querySelectorAll(`.skill-row[data-resource="${resourceId}"]`);
    
    if (skillRows.length === 0) return;
    
    // Check current state
    const isExpanded = skillRows[0].style.display !== 'none';
    
    // Toggle visibility
    skillRows.forEach(row => {
        row.style.display = isExpanded ? 'none' : 'table-row';
    });
    
    // Toggle icon
    expandIcon.textContent = isExpanded ? '+' : '−';
}

/**
 * Edit project
 */
function editProject(projectCode) {
    console.log('Edit project called for code:', projectCode);
    
    // Find project in allProjects array (loaded from API)
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found in allProjects`);
        return;
    }
    
    console.log('Project found for editing:', project);
    
    // The project object from API already has the correct structure
    // that openEditProjectModal expects: {id, code, type, title, description, domain, priority, startDate, endDate, status}
    openEditProjectModal(project);
}

/**
 * Delete project
 */
function deleteProject(projectCode) {
    console.log('Delete project called for code:', projectCode);
    
    // Find project in allProjects array (loaded from API)
    const project = allProjects.find(p => p.code === projectCode);
    
    if (!project) {
        console.error(`Project ${projectCode} not found in allProjects`);
        // Fallback: try to find in projectMetadata (for backward compatibility)
        const metadata = projectMetadata[projectCode];
        if (metadata) {
            const fallbackProject = {
                id: metadata.id || projectCode,
                code: projectCode,
                title: metadata.title
            };
            openDeleteModal(fallbackProject);
            return;
        }
        console.error(`Project ${projectCode} not found anywhere`);
        return;
    }
    
    console.log('Project found:', project);
    
    // Create project object for modal with the correct structure
    const projectForModal = {
        id: project.id,
        code: project.code,
        title: project.title
    };
    
    openDeleteModal(projectForModal);
}

/**
 * Sync with Jira
 */
function syncWithJira(projectId) {
    alert(`Sincronizando proyecto ${projectId} con Jira...`);
    setTimeout(() => {
        alert('Sincronización completada (simulación)');
    }, 1000);
}

/**
 * Import from Jira
 */
function importFromJira() {
    console.log('=== importFromJira function called ===');
    console.log('window.jiraModal:', window.jiraModal);
    
    if (window.jiraModal) {
        console.log('Opening jiraModal...');
        window.jiraModal.open();
    } else {
        console.error('Jira modal not initialized');
        console.error('Available window properties:', Object.keys(window).filter(k => k.includes('jira') || k.includes('Modal')));
        alert('Error: Modal de Jira no está inicializado. Revisa la consola para más detalles.');
    }
}

/**
 * Update Matrix KPIs with real data
 */
async function updateMatrixKPIs() {
    // Count projects by type from real data (excluding ABSENCES)
    let totalProjects = 0;
    let evolutivosCount = 0;
    let proyectosCount = 0;
    
    // Use window.allProjects array (loaded from API, already filtered without ABSENCES)
    if (window.allProjects && Array.isArray(window.allProjects)) {
        // Filter out ABSENCES projects from KPI calculation
        const projectsForKPI = window.allProjects.filter(p => !p.code.startsWith('ABSENCES'));
        
        totalProjects = projectsForKPI.length;
        
        projectsForKPI.forEach(project => {
            if (project.type === 'Evolutivo') {
                evolutivosCount++;
            } else if (project.type === 'Proyecto') {
                proyectosCount++;
            }
        });
    }
    
    // Update Matrix tab elements
    const matrixTotalElement = document.getElementById('matrix-total-projects');
    const matrixEvolutivosElement = document.getElementById('matrix-evolutivos-count');
    const matrixProyectosElement = document.getElementById('matrix-proyectos-count');
    
    if (matrixTotalElement) matrixTotalElement.textContent = totalProjects;
    if (matrixEvolutivosElement) matrixEvolutivosElement.textContent = evolutivosCount;
    if (matrixProyectosElement) matrixProyectosElement.textContent = proyectosCount;
    
    // Update Projects tab elements
    const projectsTotalElement = document.getElementById('projects-total-count');
    const projectsEvolutivosElement = document.getElementById('projects-evolutivos-count');
    const projectsProyectosElement = document.getElementById('projects-proyectos-count');
    
    if (projectsTotalElement) projectsTotalElement.textContent = totalProjects;
    if (projectsEvolutivosElement) projectsEvolutivosElement.textContent = evolutivosCount;
    if (projectsProyectosElement) projectsProyectosElement.textContent = proyectosCount;
    
    // Calculate average hours per project from real assignments
    await updateAverageHoursKPI();
    
    console.log('Matrix and Projects KPIs updated:', { totalProjects, evolutivosCount, proyectosCount });
}

/**
 * Update Average Hours per Project KPI with real data from assignments
 */
async function updateAverageHoursKPI() {
    try {
        // Use projectsManager to calculate average hours
        const avgHours = await projectsManager.calculateAverageHours();
        
        // Update UI elements
        const avgTotalElement = document.getElementById('matrix-avg-hours-project');
        const avgEvolutivosElement = document.getElementById('matrix-avg-evolutivos');
        const avgProyectosElement = document.getElementById('matrix-avg-proyectos');
        
        if (avgTotalElement) avgTotalElement.textContent = formatNumber(avgHours.avgTotal);
        if (avgEvolutivosElement) avgEvolutivosElement.textContent = formatNumber(avgHours.avgEvolutivos);
        if (avgProyectosElement) avgProyectosElement.textContent = formatNumber(avgHours.avgProyectos);
        
        console.log('Average hours KPI updated:', avgHours);
        
    } catch (error) {
        console.error('Error updating average hours KPI:', error);
    }
}

// Pagination state - now managed by AppState
// Access via: appState.getCurrentPage(), appState.get('projects.perPage'), appState.getProjects()
let currentPage = 1;
const projectsPerPage = 10;
let allProjects = []; // Keep for backward compatibility, but use appState as source of truth

/**
 * Update projects table with new data from API
 * Called after CRUD operations to refresh the table
 * @param {Array} projects - Array of project objects from API
 */
async function updateProjectsTable(projects) {
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) {
        console.warn('Projects table body not found');
        return;
    }
    
    // Store all projects (including ABSENCES)
    const allProjectsRaw = projects || [];
    
    // INCLUDE ABSENCES projects in the main table
    allProjects = [...allProjectsRaw];
    
    console.log('All projects loaded (including ABSENCES):', allProjects.length);
    
    // Sort projects by numeric ID (descending)
    // Extract numeric part from code (e.g., "NC-734" -> 734)
    allProjects.sort((a, b) => {
        const getNumericId = (code) => {
            const match = code.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        };
        return getNumericId(b.code) - getNumericId(a.code); // Descending order
    });
    
    // Make allProjects globally available (without ABSENCES)
    window.allProjects = allProjects;
    
    // Create separate array WITH ABSENCES for Matrix table (Desglose de Proyectos por Recurso)
    const allProjectsWithAbsences = [...allProjectsRaw];
    allProjectsWithAbsences.sort((a, b) => {
        const getNumericId = (code) => {
            const match = code.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        };
        return getNumericId(b.code) - getNumericId(a.code);
    });
    window.allProjectsWithAbsences = allProjectsWithAbsences;
    
    // Update KPIs immediately after loading projects (without ABSENCES)
    updateMatrixKPIs();
    
    // Calculate conceptualization hours for each project
    const conceptHoursMap = await calculateConceptualizationHours(allProjects);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are no projects (excluding ABSENCES)
    if (!allProjects || allProjects.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" style="text-align: center; padding: 2rem; color: #6b7280;">
                No hay proyectos disponibles. Haz clic en "Añadir Proyecto" para crear uno.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No projects to display');
        
        // Hide pagination if no projects
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(allProjects.length / projectsPerPage);
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const projectsToDisplay = allProjects.slice(startIndex, endIndex);
    
    // Populate with paginated data
    projectsToDisplay.forEach(project => {
        const row = document.createElement('tr');
        
        // Debug logging
        console.log('Project data:', {
            code: project.code,
            domain: project.domain,
            domainType: typeof project.domain,
            status: project.status,
            statusType: typeof project.status,
            type: project.type
        });
        
        const priorityClass = getPriorityClass(project.priority);
        const priorityText = getPriorityText(project.priority);
        const statusClass = getStatusClass(project.status);
        const statusText = getStatusText(project.status);
        const domainText = getDomainText(project.domain);
        
        console.log('Converted values:', {
            code: project.code,
            domainText: domainText,
            statusText: statusText
        });
        
        // Format dates if they exist
        const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : '-';
        const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : '-';
        
        // Get conceptualization hours for this project
        const conceptHours = conceptHoursMap.get(project.id) || 0;
        const conceptHoursDisplay = conceptHours > 0 ? formatNumber(Math.round(conceptHours)) : '-';
        
        // Check if this is an ABSENCES project
        const isAbsencesProject = project.code.startsWith('ABSENCES-');
        
        // Create Jira link for project code (only if not ABSENCES)
        const jiraBaseUrl = 'https://naturgy-adn.atlassian.net/browse/';
        const projectCodeDisplay = isAbsencesProject 
            ? `<strong>${project.code}</strong>`
            : `<a href="${jiraBaseUrl}${project.code}" target="_blank" rel="noopener noreferrer" style="color: #0052CC; text-decoration: none; font-weight: bold;">${project.code}</a>`;
        
        row.innerHTML = `
            <td style="text-align: left;">${projectCodeDisplay}</td>
            <td style="text-align: left;">${project.title}</td>
            <td style="text-align: left;">${truncateText(project.description || '', 50)}</td>
            <td style="text-align: left;">${isAbsencesProject ? '-' : domainText}</td>
            <td style="text-align: center;"><strong>${conceptHoursDisplay}</strong></td>
            <td style="text-align: center;">${isAbsencesProject ? '-' : startDate}</td>
            <td style="text-align: center;">${isAbsencesProject ? '-' : endDate}</td>
            <td style="text-align: center;">
                ${isAbsencesProject ? '-' : `<span class="status-badge ${statusClass}">${statusText}</span>`}
            </td>
            <td style="text-align: center;">${isAbsencesProject ? '-' : (project.type || '-')}</td>
            <td>
                ${!isAbsencesProject ? `
                <span class="action-icon" data-action="edit" data-project="${project.code}" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                </span>
                ` : ''}
                <span class="action-icon" data-action="tasks" data-project="${project.code}" title="Asignación de Recursos">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                </span>
                ${!isAbsencesProject ? `
                <span class="action-icon" data-action="resources" data-project="${project.code}" title="Tareas Conceptualización">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                </span>
                <span class="action-icon" data-action="delete" data-project="${project.code}" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </span>
                ` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Render pagination controls
    renderPagination(totalPages);
    
    console.log(`Projects table updated with ${allProjects.length} projects (showing page ${currentPage} of ${totalPages})`);
}

/**
 * Render pagination controls
 * @param {number} totalPages - Total number of pages
 */
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer) {
        console.warn('Pagination container not found');
        return;
    }
    
    // Hide pagination if only one page or no projects
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn';
    prevButton.innerHTML = '&laquo; Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateProjectsTable(allProjects);
        }
    };
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page button if not visible
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.className = 'pagination-btn';
        firstButton.textContent = '1';
        firstButton.onclick = () => {
            currentPage = 1;
            updateProjectsTable(allProjects);
        };
        paginationContainer.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn';
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentPage = i;
            updateProjectsTable(allProjects);
        };
        paginationContainer.appendChild(pageButton);
    }
    
    // Last page button if not visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastButton = document.createElement('button');
        lastButton.className = 'pagination-btn';
        lastButton.textContent = totalPages;
        lastButton.onclick = () => {
            currentPage = totalPages;
            updateProjectsTable(allProjects);
        };
        paginationContainer.appendChild(lastButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn';
    nextButton.innerHTML = 'Siguiente &raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateProjectsTable(allProjects);
        }
    };
    paginationContainer.appendChild(nextButton);
}

// Debounce timer for dashboard updates
let dashboardUpdateTimer = null;

/**
 * Update dashboard (KPIs and charts) after CRUD operations
 * Optimized to update only what changed and with debouncing
 * @param {Object} options - Update options
 * @param {boolean} options.projects - Update projects-related data
 * @param {boolean} options.resources - Update resources-related data
 * @param {boolean} options.assignments - Update assignments-related data
 * @param {boolean} options.immediate - Skip debouncing
 */
function updateDashboard(options = {}) {
    const {
        projects = true,
        resources = false,
        assignments = false,
        immediate = false
    } = options;
    
    // Clear existing timer
    if (dashboardUpdateTimer) {
        clearTimeout(dashboardUpdateTimer);
    }
    
    const performUpdate = async () => {
        console.log('Updating dashboard...', { projects, resources, assignments });
        const startTime = performance.now();
        
        try {
            // Only update what changed
            if (projects) {
                // Reload projects data
                const updatedProjects = await projectsManager.loadProjects();
                appState.setProjects(updatedProjects.filter(p => !p.code.startsWith('ABSENCES')));
                appState.setProjectsWithAbsences(updatedProjects);
                
                // Update projects table
                await updateProjectsTable(updatedProjects);
                
                // Update Matrix KPIs (depends on projects)
                updateMatrixKPIs();
                
                // Update charts (depends on projects)
                initializeAllCharts();
            }
            
            if (resources) {
                // Reload resources data
                const updatedResources = await resourcesManager.loadResources();
                appState.setResources(updatedResources);
                
                // Update resource-related KPIs
                await initializeKPIs();
            }
            
            if (assignments) {
                // Reload assignments data
                const updatedAssignments = await assignmentsManager.loadAssignments();
                appState.setAssignments(updatedAssignments);
                
                // Update assignment-related components
                await populateMatrixTable();
                await initializeEffortTrackingTable();
                
                // Update KPIs that depend on assignments
                await updateAverageHoursKPI();
            }
            
            const endTime = performance.now();
            console.log(`Dashboard updated in ${Math.round(endTime - startTime)}ms`);
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    };
    
    // Debounce updates unless immediate
    if (immediate) {
        performUpdate();
    } else {
        dashboardUpdateTimer = setTimeout(performUpdate, 300); // 300ms debounce
    }
}

// Make functions and modals globally available
window.updateProjectsTable = updateProjectsTable;
window.updateDashboard = updateDashboard;
window.loadProjectsFromAPI = loadProjectsFromAPI;
window.capacityModal = null;

// Function to set capacity modal reference
export function setCapacityModal(modal) {
    window.capacityModal = modal;
}

// Set capacity modal after initialization
setTimeout(() => {
    if (capacityModal) {
        window.capacityModal = capacityModal;
    }
}, 100);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * Populate Matrix table with real data from API
 */
async function populateMatrixTable() {
    const tableBody = document.querySelector('.capacity-matrix tbody');
    if (!tableBody) {
        console.warn('Matrix table body not found');
        return;
    }
    
    try {
        // Use assignmentsManager to load assignments and calculate monthly hours
        await assignmentsManager.loadAssignments();
        const projectMonthHours = assignmentsManager.calculateMonthlyHoursByProject(2026);
        
        // Convert Map to object for easier iteration
        const projectMonthHoursObj = {};
        projectMonthHours.forEach((hours, projectId) => {
            projectMonthHoursObj[projectId] = hours;
        });
        
        // Clear existing rows (except last row which is summary)
        const existingRows = Array.from(tableBody.querySelectorAll('tr'));
        existingRows.forEach((row, index) => {
            // Keep the last row (summary row)
            if (index < existingRows.length - 1) {
                row.remove();
            }
        });
        
        // Get summary row
        const summaryRow = tableBody.querySelector('.summary-row');
        
        // Calculate monthly totals
        const monthlyTotals = new Array(12).fill(0);
        
        // Generate rows for each project with hours
        // Use allProjectsWithAbsences to include ABSENCES projects
        if (window.allProjectsWithAbsences && Array.isArray(window.allProjectsWithAbsences)) {
            window.allProjectsWithAbsences.forEach(project => {
                const hours = projectMonthHoursObj[project.id];
                if (!hours) return; // Skip projects with no hours
                
                const row = document.createElement('tr');
                row.className = 'project-row';
                row.setAttribute('data-project', project.code);
                
                // Get class for capacity cells
                const getCapacityClass = (hours) => {
                    if (hours === 0) return 'empty';
                    if (hours < 200) return 'low';
                    if (hours < 400) return 'medium';
                    return 'high';
                };
                
            // Calculate total hours for this project
            const projectTotal = hours.reduce((sum, h) => sum + h, 0);
            
            // Build month cells
            const monthCells = hours.map((h, index) => {
                monthlyTotals[index] += h;
                const className = getCapacityClass(h);
                const display = h > 0 ? Math.round(h) : '-';
                const title = h > 0 ? `${Math.round(h)} horas` : '0 horas';
                return `<td><span class="capacity-cell ${className}" data-project="${project.code}" data-month="${index + 1}" title="${title}">${display}</span></td>`;
            }).join('');
            
            // Check if this is an ABSENCES project
            const isAbsencesProject = project.code.startsWith('ABSENCES');
            
            row.innerHTML = `
                <td class="project-name">
                    <span class="expand-icon" data-project="${project.code}">+</span>
                    <strong>${project.code}</strong> - ${truncateText(project.title, 30)}
                </td>
                <td>${isAbsencesProject ? '-' : (project.type || '-')}</td>
                <td>${isAbsencesProject ? '-' : getDomainText(project.domain)}</td>
                <td style="text-align: center; font-weight: bold;">${formatNumber(Math.round(projectTotal))}</td>
                ${monthCells}
            `;
                
                // Insert before summary row
                if (summaryRow) {
                    tableBody.insertBefore(row, summaryRow);
                } else {
                    tableBody.appendChild(row);
                }
            });
        }
        
        // Update summary row with real totals
        if (summaryRow) {
            const summaryCells = summaryRow.querySelectorAll('td');
            // Cell 0: "TOTAL HORAS" (project name)
            // Cell 1: colspan="2" (covers type and domain columns)
            // Cells 2-13: Month cells (ENE-DIC)
            monthlyTotals.forEach((total, index) => {
                const cellIndex = index + 2; // Skip first 2 cells (name + colspan)
                if (summaryCells[cellIndex]) {
                    summaryCells[cellIndex].innerHTML = `<strong>${formatNumber(Math.round(total))}</strong>`;
                }
            });
        }
        
        console.log('Matrix table populated with real data:', {
            projects: Object.keys(projectMonthHours).length,
            monthlyTotals
        });
        
    } catch (error) {
        console.error('Error populating Matrix table:', error);
    }
}

/**
 * Calculate total conceptualization hours for all projects
 * Total hours = SUM(hours) for all concept tasks of the project
 * @param {Array} projects - Array of project objects
 * @returns {Map} Map of projectId -> total conceptualization hours
 */
async function calculateConceptualizationHours(projects) {
    try {
        // Use projectsManager to calculate conceptualization hours
        return await projectsManager.calculateConceptualizationHours();
    } catch (error) {
        console.error('Error calculating conceptualization hours:', error);
        return new Map(); // Return empty map so the table still renders with "-" for hours
    }
}

/**
 * Update dashboard (KPIs and charts) filtered by selected period
 * @param {string} period - Selected period value ('current', 'next', 'next3', 'next6', 'next12')
 */
async function updateDashboardByPeriod(period) {
    console.log('='.repeat(80));
    console.log(`🔄 UPDATING DASHBOARD FOR PERIOD: ${period}`);
    console.log('='.repeat(80));
    
    try {
        const awsAccessKey = sessionStorage.getItem('aws_access_key');
        const userTeam = sessionStorage.getItem('user_team');
        
        if (!awsAccessKey || !userTeam) {
            console.warn('No authentication for period filtering');
            return;
        }
        
        // Get date range for the selected period (including 'current' which returns 1 month)
        const dateRange = getPeriodDateRange(period);
        console.log('📅 Date range for period', period, ':', dateRange);
        console.log('📊 Number of months to show:', dateRange.length);
        
        // Fetch all assignments
        const response = await fetch(`${API_CONFIG.BASE_URL}/assignments`, {
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (!response.ok) {
            throw new Error('Error loading assignments');
        }
        
        const data = await response.json();
        const allAssignments = data.data?.assignments || data.assignments || [];
        
        // Filter assignments by date range
        const filteredAssignments = allAssignments.filter(assignment => {
            return dateRange.some(range => 
                assignment.month === range.month && assignment.year === range.year
            );
        });
        
        console.log(`✅ Filtered ${filteredAssignments.length} assignments from ${allAssignments.length} total for period: ${period}`);
        
        // Store filtered assignments globally for charts
        window.filteredAssignmentsByPeriod = filteredAssignments;
        window.currentPeriod = period;
        
        console.log('🌐 Global variables set:');
        console.log('  - window.filteredAssignmentsByPeriod:', window.filteredAssignmentsByPeriod?.length, 'assignments');
        console.log('  - window.currentPeriod:', window.currentPeriod);
        
        // Update KPIs with filtered data
        await updateKPIsWithFilteredData(filteredAssignments);
        
        // Update charts with filtered data
        await updateChartsWithFilteredData(filteredAssignments, period);
        
    } catch (error) {
        console.error('Error updating dashboard by period:', error);
    }
}

/**
 * Update KPIs with filtered assignment data
 */
async function updateKPIsWithFilteredData(assignments) {
    // Calculate metrics from filtered assignments
    const uniqueProjects = new Set();
    const uniqueResources = new Set();
    let totalHours = 0;
    let assignedHours = 0;
    let hoursEvolutivos = 0;
    let horasProyectos = 0;
    
    assignments.forEach(assignment => {
        if (assignment.projectId) uniqueProjects.add(assignment.projectId);
        if (assignment.resourceId) uniqueResources.add(assignment.resourceId);
        
        const hours = parseFloat(assignment.hours) || 0;
        totalHours += hours;
        
        if (assignment.resourceId) {
            assignedHours += hours;
        }
        
        // Calculate hours by project type
        if (window.allProjects && assignment.projectId) {
            const project = window.allProjects.find(p => p.id === assignment.projectId);
            if (project && !project.code.startsWith('ABSENCES')) {
                if (project.type === 'Evolutivo') {
                    hoursEvolutivos += hours;
                } else if (project.type === 'Proyecto') {
                    horasProyectos += hours;
                }
            }
        }
    });
    
    // Count projects by type from unique project IDs
    let evolutivosCount = 0;
    let proyectosCount = 0;
    
    uniqueProjects.forEach(projectId => {
        if (window.allProjects) {
            const project = window.allProjects.find(p => p.id === projectId);
            if (project && !project.code.startsWith('ABSENCES')) {
                if (project.type === 'Evolutivo') {
                    evolutivosCount++;
                } else if (project.type === 'Proyecto') {
                    proyectosCount++;
                }
            }
        }
    });
    
    // Calculate resource utilization (resources assigned >50% and >80%)
    const resourceUtilization = new Map(); // resourceId -> total hours assigned
    
    assignments.forEach(assignment => {
        if (assignment.resourceId) {
            const current = resourceUtilization.get(assignment.resourceId) || 0;
            resourceUtilization.set(assignment.resourceId, current + (parseFloat(assignment.hours) || 0));
        }
    });
    
    // Get date range to calculate capacity per resource
    const dateRange = getPeriodDateRange(window.currentPeriod || 'current');
    const numberOfMonths = dateRange.length;
    const capacityPerResource = 160 * numberOfMonths; // 160h/month × number of months
    
    let resourcesOver50 = 0;
    let resourcesOver80 = 0;
    
    resourceUtilization.forEach((hours, resourceId) => {
        const utilizationPercent = (hours / capacityPerResource) * 100;
        if (utilizationPercent > 50) resourcesOver50++;
        if (utilizationPercent > 80) resourcesOver80++;
    });
    
    // Get resources from API for capacity calculation
    const awsAccessKey = sessionStorage.getItem('aws_access_key');
    const userTeam = sessionStorage.getItem('user_team');
    
    let totalCapacity = 0;
    if (awsAccessKey && userTeam) {
        const resourcesResponse = await fetch(`${API_CONFIG.BASE_URL}/resources`, {
            headers: {
                'Authorization': awsAccessKey,
                'x-user-team': userTeam
            }
        });
        
        if (resourcesResponse.ok) {
            const resourcesData = await resourcesResponse.json();
            const allResources = resourcesData.data?.resources || resourcesData.resources || [];
            
            // Filter resources by team
            const teamResources = allResources.filter(r => r.team === userTeam && r.active);
            
            // Calculate total capacity based on number of months in period
            const dateRange = getPeriodDateRange(window.currentPeriod || 'current');
            const numberOfMonths = dateRange.length;
            
            // Total capacity = number of active resources × 160h/month × number of months
            totalCapacity = teamResources.length * 160 * numberOfMonths;
            
            console.log('Capacity calculation:', {
                teamResources: teamResources.length,
                hoursPerMonth: 160,
                numberOfMonths,
                totalCapacity,
                formula: `${teamResources.length} × 160 × ${numberOfMonths} = ${totalCapacity}`
            });
        }
    }
    
    // Update KPI elements (only if they exist)
    const proyectosActivosEl = document.getElementById('proyectos-activos');
    const recursosActivosEl = document.getElementById('recursos-activos');
    const capacidadTotalEl = document.getElementById('capacidad-total');
    const horasComprometidasEl = document.getElementById('kpi-horas-comprometidas');
    const eficienciaEl = document.getElementById('eficiencia');
    
    // Main KPI values
    if (proyectosActivosEl) proyectosActivosEl.textContent = uniqueProjects.size;
    if (recursosActivosEl) recursosActivosEl.textContent = uniqueResources.size;
    if (capacidadTotalEl) capacidadTotalEl.textContent = formatNumber(totalCapacity);
    if (horasComprometidasEl) horasComprometidasEl.textContent = formatNumber(Math.round(assignedHours));
    
    // Sub-KPIs for PROYECTOS ACTIVOS
    const kpiNumEvolutivosEl = document.getElementById('kpi-num-evolutivos');
    const kpiNumProyectosEl = document.getElementById('kpi-num-proyectos');
    if (kpiNumEvolutivosEl) kpiNumEvolutivosEl.textContent = evolutivosCount;
    if (kpiNumProyectosEl) kpiNumProyectosEl.textContent = proyectosCount;
    
    // Sub-KPIs for RECURSOS ACTIVOS
    const kpiAsignados50El = document.getElementById('kpi-asignados-50');
    const kpiAsignados80El = document.getElementById('kpi-asignados-80');
    if (kpiAsignados50El) kpiAsignados50El.textContent = resourcesOver50;
    if (kpiAsignados80El) kpiAsignados80El.textContent = resourcesOver80;
    
    // Sub-KPIs for HORAS COMPROMETIDAS
    const kpiHorasEvolutivosEl = document.getElementById('kpi-horas-evolutivos');
    const kpiHorasProyectosEl = document.getElementById('kpi-horas-proyectos');
    if (kpiHorasEvolutivosEl) kpiHorasEvolutivosEl.textContent = formatNumber(Math.round(hoursEvolutivos));
    if (kpiHorasProyectosEl) kpiHorasProyectosEl.textContent = formatNumber(Math.round(horasProyectos));
    
    // Sub-KPIs for CAPACIDAD DISPONIBLE
    const kpiFtesCapacidadEl = document.getElementById('kpi-ftes-capacidad');
    if (kpiFtesCapacidadEl) {
        const dateRange = getPeriodDateRange(window.currentPeriod || 'current');
        const numberOfMonths = dateRange.length;
        const ftesCapacidad = (totalCapacity / 160 / numberOfMonths).toFixed(1);
        kpiFtesCapacidadEl.textContent = `${ftesCapacidad} FTEs`;
    }
    
    // Calculate efficiency (utilization percentage)
    const efficiency = totalCapacity > 0 ? Math.round((assignedHours / totalCapacity) * 100) : 0;
    if (eficienciaEl) eficienciaEl.textContent = `${efficiency}%`;
    
    // Sub-KPIs for EFICIENCIA
    const kpiFtesEficienciaEl = document.getElementById('kpi-ftes-eficiencia');
    if (kpiFtesEficienciaEl) {
        const dateRange = getPeriodDateRange(window.currentPeriod || 'current');
        const numberOfMonths = dateRange.length;
        const ftesEficiencia = (assignedHours / 160 / numberOfMonths).toFixed(1);
        kpiFtesEficienciaEl.textContent = `${ftesEficiencia} FTEs`;
    }
    
    console.log('KPIs updated with filtered data:', {
        projects: uniqueProjects.size,
        evolutivosCount,
        proyectosCount,
        resources: uniqueResources.size,
        resourcesOver50,
        resourcesOver80,
        totalCapacity,
        assignedHours,
        hoursEvolutivos,
        horasProyectos,
        efficiency
    });
}

/**
 * Update charts with filtered assignment data
 */
async function updateChartsWithFilteredData(assignments, period) {
    // The charts are managed by charts.js
    // We'll trigger a re-initialization with filtered data
    window.filteredAssignmentsByPeriod = assignments;
    window.currentPeriod = period;
    
    // Re-initialize charts with filtered data
    await initializeAllCharts();
    
    console.log('Charts updated with filtered data');
}

// Export for external use if needed
export { initializeApp, updateProjectsTable, updateDashboard, loadProjectsFromAPI };
