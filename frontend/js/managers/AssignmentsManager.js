/**
 * Assignments Manager
 * Business logic for assignment management
 */

import apiService from '../services/api.js';

class AssignmentsManager {
    constructor() {
        this.assignments = [];
    }

    /**
     * Load all assignments from API
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>}
     */
    async loadAssignments(filters = {}) {
        try {
            this.assignments = await apiService.getAssignments(filters);
            console.log(`Loaded ${this.assignments.length} assignments`);
            return this.assignments;
        } catch (error) {
            console.error('Error loading assignments:', error);
            throw error;
        }
    }

    /**
     * Get all assignments
     * @returns {Array}
     */
    getAssignments() {
        return this.assignments;
    }

    /**
     * Get assignments for a specific project
     * @param {string|number} projectId
     * @returns {Array}
     */
    getProjectAssignments(projectId) {
        return this.assignments.filter(a => a.projectId === projectId);
    }

    /**
     * Get assignments for a specific resource
     * @param {string|number} resourceId
     * @returns {Array}
     */
    getResourceAssignments(resourceId) {
        return this.assignments.filter(a => a.resourceId === resourceId);
    }

    /**
     * Get assignments for a specific month/year
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Array}
     */
    getMonthAssignments(month, year) {
        return this.assignments.filter(a => a.month === month && a.year === year);
    }

    /**
     * Calculate total hours by project
     * @returns {Map} Map of projectId -> total hours
     */
    calculateHoursByProject() {
        const hoursByProject = new Map();

        this.assignments.forEach(assignment => {
            const projectId = assignment.projectId;
            if (!projectId) return;

            const hours = parseFloat(assignment.hours) || 0;
            const current = hoursByProject.get(projectId) || 0;
            hoursByProject.set(projectId, current + hours);
        });

        return hoursByProject;
    }

    /**
     * Calculate total hours by resource
     * @returns {Map} Map of resourceId -> total hours
     */
    calculateHoursByResource() {
        const hoursByResource = new Map();

        this.assignments.forEach(assignment => {
            const resourceId = assignment.resourceId;
            if (!resourceId) return;

            const hours = parseFloat(assignment.hours) || 0;
            const current = hoursByResource.get(resourceId) || 0;
            hoursByResource.set(resourceId, current + hours);
        });

        return hoursByResource;
    }

    /**
     * Calculate monthly hours for matrix table
     * @param {number} year - Year to filter (default 2026)
     * @returns {Map} Map of projectId -> array of 12 monthly hours
     */
    calculateMonthlyHoursByProject(year = 2026) {
        const projectMonthHours = new Map();

        this.assignments.forEach(assignment => {
            const projectId = assignment.projectId;
            if (!projectId || assignment.year !== year) return;

            if (!projectMonthHours.has(projectId)) {
                projectMonthHours.set(projectId, new Array(12).fill(0));
            }

            const monthIndex = assignment.month - 1; // Convert 1-12 to 0-11
            const hours = parseFloat(assignment.hours) || 0;
            const monthlyHours = projectMonthHours.get(projectId);
            monthlyHours[monthIndex] += hours;
        });

        return projectMonthHours;
    }

    /**
     * Filter assignments by date range
     * @param {Array} dateRange - Array of {month, year} objects
     * @returns {Array}
     */
    filterByDateRange(dateRange) {
        return this.assignments.filter(assignment => {
            return dateRange.some(range => 
                assignment.month === range.month && assignment.year === range.year
            );
        });
    }

    /**
     * Calculate statistics for filtered assignments
     * @param {Array} filteredAssignments - Optional filtered assignments
     * @returns {Object}
     */
    calculateStatistics(filteredAssignments = null) {
        const assignments = filteredAssignments || this.assignments;

        const stats = {
            totalHours: 0,
            uniqueProjects: new Set(),
            uniqueResources: new Set(),
            byMonth: {},
            byProject: {},
            byResource: {}
        };

        assignments.forEach(assignment => {
            const hours = parseFloat(assignment.hours) || 0;
            stats.totalHours += hours;

            if (assignment.projectId) {
                stats.uniqueProjects.add(assignment.projectId);
                stats.byProject[assignment.projectId] = (stats.byProject[assignment.projectId] || 0) + hours;
            }

            if (assignment.resourceId) {
                stats.uniqueResources.add(assignment.resourceId);
                stats.byResource[assignment.resourceId] = (stats.byResource[assignment.resourceId] || 0) + hours;
            }

            if (assignment.month && assignment.year) {
                const key = `${assignment.year}-${assignment.month}`;
                stats.byMonth[key] = (stats.byMonth[key] || 0) + hours;
            }
        });

        return {
            ...stats,
            projectCount: stats.uniqueProjects.size,
            resourceCount: stats.uniqueResources.size
        };
    }

    /**
     * Validate capacity for a new assignment
     * @param {string|number} resourceId
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {number} requestedHours
     * @param {string|number} excludeProjectId - Project ID to exclude from calculation
     * @returns {Promise<Object>} Validation result
     */
    async validateCapacity(resourceId, date, requestedHours, excludeProjectId = null) {
        try {
            const dailyCapacity = 8; // TODO: Get from resource configuration

            // Get existing assignments for this resource on this date
            const assignments = await apiService.getAssignments({ resourceId });

            // Filter assignments for this date, excluding current project
            const assignedHours = assignments
                .filter(a => {
                    const assignmentDate = a.date ? a.date.toString().split('T')[0] : null;
                    return assignmentDate === date && a.projectId !== excludeProjectId;
                })
                .reduce((sum, a) => sum + parseFloat(a.hours || 0), 0);

            const availableHours = dailyCapacity - assignedHours;
            const isValid = requestedHours <= availableHours;

            return {
                isValid,
                availableHours,
                assignedHours,
                requestedHours,
                dailyCapacity,
                message: isValid 
                    ? 'Capacity available' 
                    : `Assignment would exceed daily resource capacity. Available: ${availableHours} hours, Requested: ${requestedHours} hours, Assigned: ${assignedHours} hours`
            };
        } catch (error) {
            console.error('Error validating capacity:', error);
            throw error;
        }
    }

    /**
     * Batch create assignments
     * @param {Array} assignmentsData - Array of assignment objects
     * @returns {Promise<Object>} Results with success/failure counts
     */
    async batchCreate(assignmentsData) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const assignmentData of assignmentsData) {
            try {
                await apiService.createAssignment(assignmentData);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    assignment: assignmentData,
                    error: error.message
                });
            }
        }

        return results;
    }
}

// Create singleton instance
const assignmentsManager = new AssignmentsManager();

// Export singleton
export default assignmentsManager;
