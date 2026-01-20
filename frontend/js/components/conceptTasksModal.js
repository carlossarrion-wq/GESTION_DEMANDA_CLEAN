/**
 * Concept Tasks Modal Component
 * Manages conceptualization tasks for projects (separate from resource assignments)
 */

import { API_CONFIG } from '../config/data.js';
import { showNotification } from '../utils/helpers.js';

export class ConceptTasksModal {
    constructor() {
        this.gridApi = null;
        this.projectId = null;
        this.projectCode = null;
        this.projectTitle = null;
        this.modalElement = null;
        this.tasks = [];
    }

    /**
     * Initialize the modal (called from main.js)
     */
    init() {
        this.modalElement = document.getElementById('taskDetailsModal');
        if (!this.modalElement) {
            console.error('Concept tasks modal element not found');
            return;
        }
        
        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.modalElement.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close on overlay click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.style.display !== 'none') {
                this.close();
            }
        });
    }

    /**
     * Open modal for a specific project
     */
    async open(projectCode, projectTitle, projectId) {
        this.projectCode = projectCode;
        this.projectTitle = projectTitle;
        this.projectId = projectId;

        console.log('Opening concept tasks modal for:', { projectCode, projectTitle, projectId });

        // Update modal title
        const titleElement = document.getElementById('taskModalTitle');
        if (titleElement) {
            titleElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px; display: inline-block; margin-right: 8px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                Tareas Conceptualización - ${projectCode} - ${projectTitle}
            `;
        }

        // Load tasks from API
        await this.loadTasks();

        // Initialize AG Grid
        this.initializeGrid();

        // Show modal
        this.modalElement.classList.add('active');
        this.modalElement.style.display = 'flex';
    }

    /**
     * Close modal
     */
    close() {
        this.modalElement.classList.remove('active');
        this.modalElement.style.display = 'none';
        
        // Destroy grid
        if (this.gridApi) {
            this.gridApi.destroy();
            this.gridApi = null;
        }

        // Reload projects table
        if (window.location.hash === '#projects-tab' || document.querySelector('[data-tab="projects-tab"]').classList.contains('active')) {
            window.location.reload();
        }
    }

    /**
     * Load tasks from concept-tasks API
     */
    async loadTasks() {
        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                console.warn('No authentication tokens found');
                this.tasks = [];
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/concept-tasks?projectId=${this.projectId}`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            });

            if (!response.ok) {
                throw new Error('Error loading concept tasks');
            }

            const data = await response.json();
            this.tasks = data.tasks || [];
            
            console.log('Loaded concept tasks:', this.tasks.length);
            
        } catch (error) {
            console.error('Error loading concept tasks:', error);
            this.tasks = [];
        }
    }

    /**
     * Initialize AG Grid
     */
    initializeGrid() {
        const gridDiv = document.getElementById('taskGrid');

        // Transform tasks to grid format
        const rowData = this.tasks.map(task => ({
            id: task.id,
            task: task.title,
            description: task.description || '',
            hours: parseFloat(task.hours) || 0,
            skillName: task.skillName || ''
        }));

        // Add empty rows if no tasks
        if (rowData.length === 0) {
            rowData.push(
                { task: '', description: '', hours: 0, skillName: '' },
                { task: '', description: '', hours: 0, skillName: '' },
                { task: '', description: '', hours: 0, skillName: '' }
            );
        }

        const columnDefs = [
            {
                headerName: '',
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 50,
                pinned: 'left',
                lockPosition: true,
                suppressMenu: true
            },
            {
                headerName: 'Tarea',
                field: 'task',
                editable: true,
                width: 200,
                minWidth: 150,
                pinned: 'left',
                cellStyle: { 
                    fontWeight: '600',
                    background: 'rgba(49, 151, 149, 0.05)'
                }
            },
            {
                headerName: 'Descripción',
                field: 'description',
                editable: true,
                width: 400,
                minWidth: 200,
                pinned: 'left',
                cellEditor: 'agLargeTextCellEditor',
                cellEditorPopup: true,
                cellEditorParams: {
                    maxLength: 500,
                    rows: 5,
                    cols: 50
                },
                wrapText: true,
                autoHeight: true
            },
            {
                headerName: 'Horas Estimadas',
                field: 'hours',
                editable: true,
                width: 150,
                minWidth: 120,
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                    min: 0,
                    precision: 1
                },
                valueFormatter: params => params.value ? `${params.value}h` : '',
                cellStyle: {
                    textAlign: 'center',
                    fontWeight: '600'
                }
            },
            {
                headerName: 'Skill/Perfil',
                field: 'skillName',
                editable: true,
                width: 150,
                minWidth: 120,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: ['Frontend', 'Backend', 'QA', 'Análisis', 'Diseño', 'Project Management', 'DevOps']
                }
            }
        ];

        const gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
                suppressMenu: false
            },
            rowSelection: 'multiple',
            animateRows: true,
            enableCellTextSelection: true,
            ensureDomOrder: true,
            suppressRowClickSelection: true,
            stopEditingWhenCellsLoseFocus: true,
            singleClickEdit: false,
            enterNavigatesVertically: true,
            enterNavigatesVerticallyAfterEdit: true,
            undoRedoCellEditing: true,
            undoRedoCellEditingLimit: 20,
            onCellValueChanged: (event) => {
                console.log('Cell value changed:', event);
            },
            onGridReady: (params) => {
                this.gridApi = params.api;
                params.api.sizeColumnsToFit();
            }
        };

        // Create grid
        this.gridApi = agGrid.createGrid(gridDiv, gridOptions);
    }

    /**
     * Add new row
     */
    addRow() {
        if (!this.gridApi) return;

        const newRow = { 
            task: '', 
            description: '', 
            hours: 0,
            skillName: ''
        };
        
        this.gridApi.applyTransaction({ add: [newRow] });

        // Focus on the new row
        const rowCount = this.gridApi.getDisplayedRowCount();
        this.gridApi.ensureIndexVisible(rowCount - 1);
    }

    /**
     * Delete selected rows
     */
    deleteSelectedRows() {
        if (!this.gridApi) return;

        const selectedRows = this.gridApi.getSelectedRows();
        
        if (selectedRows.length === 0) {
            alert('Por favor, selecciona las filas que deseas eliminar.');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar ${selectedRows.length} tarea(s)?`)) {
            this.gridApi.applyTransaction({ remove: selectedRows });
        }
    }

    /**
     * Save changes
     */
    async save() {
        if (!this.gridApi) return;

        const allRows = [];
        this.gridApi.forEachNode(node => allRows.push(node.data));

        // Filter out empty rows
        const validRows = allRows.filter(row => 
            row.task && row.task.trim() !== '' && row.hours > 0
        );

        console.log('Saving concept tasks:', validRows);

        try {
            const awsAccessKey = sessionStorage.getItem('aws_access_key');
            const userTeam = sessionStorage.getItem('user_team');
            
            if (!awsAccessKey || !userTeam) {
                throw new Error('No authentication tokens found');
            }

            // Delete existing tasks and create new ones
            // First, delete all existing tasks for this project
            for (const task of this.tasks) {
                try {
                    await fetch(`${API_CONFIG.BASE_URL}/concept-tasks/${task.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': awsAccessKey,
                            'x-user-team': userTeam
                        }
                    });
                } catch (error) {
                    console.warn('Error deleting task:', error);
                }
            }

            // Create new tasks
            let successCount = 0;
            let errorCount = 0;

            for (const row of validRows) {
                try {
                    const taskData = {
                        projectId: this.projectId,
                        title: row.task.trim(),
                        description: row.description?.trim() || '',
                        hours: parseFloat(row.hours) || 0,
                        skillName: row.skillName?.trim() || null
                    };

                    const response = await fetch(`${API_CONFIG.BASE_URL}/concept-tasks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': awsAccessKey,
                            'x-user-team': userTeam
                        },
                        body: JSON.stringify(taskData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        const errorData = await response.json();
                        console.error('Error creating task:', errorData);
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Error creating task:', error);
                }
            }

            console.log(`Save results: ${successCount} success, ${errorCount} errors`);

            if (successCount > 0) {
                showNotification(`✓ Guardado exitoso\n\nTareas guardadas: ${successCount}`, 'success');
                this.close();
            } else {
                showNotification('No se pudo guardar ninguna tarea', 'error');
            }

        } catch (error) {
            console.error('Error saving concept tasks:', error);
            showNotification(`Error al guardar: ${error.message}`, 'error');
        }
    }
}

// Make functions globally available for HTML onclick handlers
window.addTaskRow = function() {
    if (window.conceptTasksModal) {
        window.conceptTasksModal.addRow();
    }
};

window.deleteSelectedTasks = function() {
    if (window.conceptTasksModal) {
        window.conceptTasksModal.deleteSelectedRows();
    }
};

window.saveTaskChanges = function() {
    if (window.conceptTasksModal) {
        window.conceptTasksModal.save();
    }
};

window.closeTaskDetailsModal = function() {
    if (window.conceptTasksModal) {
        window.conceptTasksModal.close();
    }
};
