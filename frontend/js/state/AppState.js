/**
 * Application State Management
 * Centralized state for the entire application
 */

class AppState {
    constructor() {
        this.state = {
            // Projects state
            projects: {
                all: [],
                allWithAbsences: [],
                filtered: [],
                currentPage: 1,
                perPage: 10,
                searchTerm: ''
            },
            
            // Resources state
            resources: {
                all: [],
                active: [],
                byId: new Map()
            },
            
            // Assignments state
            assignments: {
                all: [],
                byProject: new Map(),
                byResource: new Map(),
                filtered: null
            },
            
            // User state
            user: {
                team: null,
                authenticated: false,
                awsAccessKey: null
            },
            
            // UI state
            ui: {
                activeTab: 'overview',
                currentPeriod: 'current',
                modals: {
                    task: null,
                    conceptTasks: null,
                    createTask: null,
                    capacity: null,
                    jira: null
                }
            },
            
            // Filters state
            filters: {
                period: 'current',
                dateRange: null
            }
        };
        
        // Subscribers for state changes
        this.subscribers = new Map();
    }

    /**
     * Get current state
     * @returns {Object}
     */
    getState() {
        return this.state;
    }

    /**
     * Get specific state slice
     * @param {string} path - Dot notation path (e.g., 'projects.all')
     * @returns {any}
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[key];
        }
        
        return value;
    }

    /**
     * Set state value
     * @param {string} path - Dot notation path
     * @param {any} value - New value
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;
        
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        
        // Notify subscribers
        this.notify(path, value);
    }

    /**
     * Update state (merge with existing)
     * @param {string} path - Dot notation path
     * @param {Object} updates - Updates to merge
     */
    update(path, updates) {
        const current = this.get(path);
        if (typeof current === 'object' && !Array.isArray(current)) {
            this.set(path, { ...current, ...updates });
        } else {
            this.set(path, updates);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} path - Path to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        
        this.subscribers.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(path);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Notify subscribers of state change
     * @param {string} path - Changed path
     * @param {any} value - New value
     */
    notify(path, value) {
        // Notify exact path subscribers
        const callbacks = this.subscribers.get(path);
        if (callbacks) {
            callbacks.forEach(callback => callback(value, path));
        }
        
        // Notify parent path subscribers (e.g., 'projects' when 'projects.all' changes)
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentCallbacks = this.subscribers.get(parentPath);
            if (parentCallbacks) {
                parentCallbacks.forEach(callback => callback(this.get(parentPath), parentPath));
            }
        }
    }

    // ==================== PROJECTS ====================

    /**
     * Set all projects
     * @param {Array} projects
     */
    setProjects(projects) {
        this.set('projects.all', projects);
        
        // Also update window.allProjects for backward compatibility
        window.allProjects = projects;
    }

    /**
     * Set projects with absences
     * @param {Array} projects
     */
    setProjectsWithAbsences(projects) {
        this.set('projects.allWithAbsences', projects);
        
        // Also update window for backward compatibility
        window.allProjectsWithAbsences = projects;
    }

    /**
     * Get all projects
     * @returns {Array}
     */
    getProjects() {
        return this.get('projects.all') || [];
    }

    /**
     * Get projects with absences
     * @returns {Array}
     */
    getProjectsWithAbsences() {
        return this.get('projects.allWithAbsences') || [];
    }

    /**
     * Set current page
     * @param {number} page
     */
    setCurrentPage(page) {
        this.set('projects.currentPage', page);
    }

    /**
     * Get current page
     * @returns {number}
     */
    getCurrentPage() {
        return this.get('projects.currentPage') || 1;
    }

    // ==================== RESOURCES ====================

    /**
     * Set all resources
     * @param {Array} resources
     */
    setResources(resources) {
        this.set('resources.all', resources);
        
        // Create byId map for quick lookup
        const byId = new Map();
        resources.forEach(resource => {
            byId.set(resource.id, resource);
        });
        this.set('resources.byId', byId);
        
        // Set active resources
        const active = resources.filter(r => r.active);
        this.set('resources.active', active);
    }

    /**
     * Get all resources
     * @returns {Array}
     */
    getResources() {
        return this.get('resources.all') || [];
    }

    /**
     * Get active resources
     * @returns {Array}
     */
    getActiveResources() {
        return this.get('resources.active') || [];
    }

    /**
     * Get resource by ID
     * @param {string|number} id
     * @returns {Object|undefined}
     */
    getResourceById(id) {
        const byId = this.get('resources.byId');
        return byId ? byId.get(id) : undefined;
    }

    // ==================== ASSIGNMENTS ====================

    /**
     * Set all assignments
     * @param {Array} assignments
     */
    setAssignments(assignments) {
        this.set('assignments.all', assignments);
        
        // Create maps for quick lookup
        const byProject = new Map();
        const byResource = new Map();
        
        assignments.forEach(assignment => {
            // By project
            if (assignment.projectId) {
                if (!byProject.has(assignment.projectId)) {
                    byProject.set(assignment.projectId, []);
                }
                byProject.get(assignment.projectId).push(assignment);
            }
            
            // By resource
            if (assignment.resourceId) {
                if (!byResource.has(assignment.resourceId)) {
                    byResource.set(assignment.resourceId, []);
                }
                byResource.get(assignment.resourceId).push(assignment);
            }
        });
        
        this.set('assignments.byProject', byProject);
        this.set('assignments.byResource', byResource);
    }

    /**
     * Get all assignments
     * @returns {Array}
     */
    getAssignments() {
        return this.get('assignments.all') || [];
    }

    /**
     * Get assignments by project
     * @param {string|number} projectId
     * @returns {Array}
     */
    getAssignmentsByProject(projectId) {
        const byProject = this.get('assignments.byProject');
        return byProject ? (byProject.get(projectId) || []) : [];
    }

    /**
     * Get assignments by resource
     * @param {string|number} resourceId
     * @returns {Array}
     */
    getAssignmentsByResource(resourceId) {
        const byResource = this.get('assignments.byResource');
        return byResource ? (byResource.get(resourceId) || []) : [];
    }

    // ==================== USER ====================

    /**
     * Set user authentication
     * @param {string} team
     * @param {string} awsAccessKey
     */
    setUserAuth(team, awsAccessKey) {
        this.update('user', {
            team,
            awsAccessKey,
            authenticated: true
        });
    }

    /**
     * Get user team
     * @returns {string|null}
     */
    getUserTeam() {
        return this.get('user.team');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.get('user.authenticated') || false;
    }

    // ==================== UI ====================

    /**
     * Set active tab
     * @param {string} tab
     */
    setActiveTab(tab) {
        this.set('ui.activeTab', tab);
    }

    /**
     * Get active tab
     * @returns {string}
     */
    getActiveTab() {
        return this.get('ui.activeTab') || 'overview';
    }

    /**
     * Set modal reference
     * @param {string} modalName
     * @param {Object} modal
     */
    setModal(modalName, modal) {
        this.set(`ui.modals.${modalName}`, modal);
        
        // Also set on window for backward compatibility
        window[`${modalName}Modal`] = modal;
    }

    /**
     * Get modal reference
     * @param {string} modalName
     * @returns {Object|null}
     */
    getModal(modalName) {
        return this.get(`ui.modals.${modalName}`);
    }

    // ==================== FILTERS ====================

    /**
     * Set current period filter
     * @param {string} period
     */
    setCurrentPeriod(period) {
        this.set('filters.period', period);
        
        // Also set on window for backward compatibility
        window.currentPeriod = period;
    }

    /**
     * Get current period
     * @returns {string}
     */
    getCurrentPeriod() {
        return this.get('filters.period') || 'current';
    }

    /**
     * Set filtered assignments
     * @param {Array|null} assignments
     */
    setFilteredAssignments(assignments) {
        this.set('assignments.filtered', assignments);
        
        // Also set on window for backward compatibility
        window.filteredAssignmentsByPeriod = assignments;
    }

    /**
     * Get filtered assignments
     * @returns {Array|null}
     */
    getFilteredAssignments() {
        return this.get('assignments.filtered');
    }

    // ==================== UTILITY ====================

    /**
     * Reset state to initial values
     */
    reset() {
        this.state = {
            projects: {
                all: [],
                allWithAbsences: [],
                filtered: [],
                currentPage: 1,
                perPage: 10,
                searchTerm: ''
            },
            resources: {
                all: [],
                active: [],
                byId: new Map()
            },
            assignments: {
                all: [],
                byProject: new Map(),
                byResource: new Map(),
                filtered: null
            },
            user: {
                team: null,
                authenticated: false,
                awsAccessKey: null
            },
            ui: {
                activeTab: 'overview',
                currentPeriod: 'current',
                modals: {
                    task: null,
                    conceptTasks: null,
                    createTask: null,
                    capacity: null,
                    jira: null
                }
            },
            filters: {
                period: 'current',
                dateRange: null
            }
        };
        
        this.notify('*', this.state);
    }

    /**
     * Log current state (for debugging)
     */
    debug() {
        console.log('=== AppState Debug ===');
        console.log('Projects:', this.get('projects'));
        console.log('Resources:', this.get('resources'));
        console.log('Assignments:', this.get('assignments'));
        console.log('User:', this.get('user'));
        console.log('UI:', this.get('ui'));
        console.log('Filters:', this.get('filters'));
        console.log('====================');
    }
}

// Create singleton instance
const appState = new AppState();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
    window.appState = appState;
}

// Export singleton
export default appState;
