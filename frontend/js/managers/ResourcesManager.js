/**
 * Resources Manager
 * Business logic for resource management
 */

import apiService from '../services/api.js';
import authService from '../services/auth.js';

class ResourcesManager {
    constructor() {
        this.resources = [];
    }

    /**
     * Load all resources from API (filtered by user's team)
     * @returns {Promise<Array>}
     */
    async loadResources() {
        try {
            const allResources = await apiService.getResources();
            const userTeam = authService.getUserTeam();
            
            // Filter resources by user's team
            this.resources = allResources.filter(r => {
                const resourceTeam = (r.team || '').toLowerCase().trim();
                const normalizedUserTeam = userTeam.toLowerCase().trim();
                return resourceTeam === normalizedUserTeam;
            });
            
            console.log(`Loaded ${this.resources.length} resources (filtered by team: ${userTeam})`);
            
            return this.resources;
        } catch (error) {
            console.error('Error loading resources:', error);
            throw error;
        }
    }

    /**
     * Get all resources
     * @returns {Array}
     */
    getResources() {
        return this.resources;
    }

    /**
     * Get active resources only
     * @returns {Array}
     */
    getActiveResources() {
        return this.resources.filter(r => r.active);
    }

    /**
     * Find resource by ID
     * @param {string|number} id
     * @returns {Object|undefined}
     */
    findById(id) {
        return this.resources.find(r => r.id === id);
    }

    /**
     * Find resource by name
     * @param {string} name
     * @returns {Object|undefined}
     */
    findByName(name) {
        return this.resources.find(r => r.name === name);
    }

    /**
     * Calculate resource statistics
     * @returns {Object}
     */
    getStatistics() {
        const stats = {
            total: this.resources.length,
            active: 0,
            inactive: 0,
            totalCapacity: 0,
            bySkill: {}
        };

        this.resources.forEach(resource => {
            if (resource.active) {
                stats.active++;
                stats.totalCapacity += resource.defaultCapacity || 160;
            } else {
                stats.inactive++;
            }

            // Count by skills
            if (resource.skills && Array.isArray(resource.skills)) {
                resource.skills.forEach(skill => {
                    stats.bySkill[skill] = (stats.bySkill[skill] || 0) + 1;
                });
            }
        });

        return stats;
    }

    /**
     * Calculate total capacity for a period
     * @param {number} numberOfMonths - Number of months in the period
     * @returns {number} Total capacity in hours
     */
    calculateTotalCapacity(numberOfMonths = 1) {
        const activeResources = this.getActiveResources();
        const hoursPerMonth = 160; // Standard hours per month
        return activeResources.length * hoursPerMonth * numberOfMonths;
    }

    /**
     * Get resource capacity for a specific month
     * @param {string|number} resourceId
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Promise<Object>} Capacity information
     */
    async getResourceCapacity(resourceId, month, year) {
        try {
            const resource = this.findById(resourceId);
            if (!resource) {
                throw new Error(`Resource ${resourceId} not found`);
            }

            // Get assignments for this resource in this month
            const assignments = await apiService.getAssignments({ 
                resourceId,
                month,
                year
            });

            const assignedHours = assignments.reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
            const capacity = resource.defaultCapacity || 160;
            const available = capacity - assignedHours;
            const utilizationPercent = capacity > 0 ? Math.round((assignedHours / capacity) * 100) : 0;

            return {
                resourceId,
                resourceName: resource.name,
                month,
                year,
                capacity,
                assignedHours,
                available,
                utilizationPercent,
                isOverCapacity: assignedHours > capacity
            };
        } catch (error) {
            console.error('Error getting resource capacity:', error);
            throw error;
        }
    }

    /**
     * Get resources with high utilization (>80%)
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Promise<Array>}
     */
    async getHighUtilizationResources(month, year) {
        const highUtilization = [];

        for (const resource of this.getActiveResources()) {
            try {
                const capacity = await this.getResourceCapacity(resource.id, month, year);
                if (capacity.utilizationPercent > 80) {
                    highUtilization.push(capacity);
                }
            } catch (error) {
                console.error(`Error checking capacity for resource ${resource.id}:`, error);
            }
        }

        return highUtilization.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    }

    /**
     * Get resources with low utilization (<50%)
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Promise<Array>}
     */
    async getLowUtilizationResources(month, year) {
        const lowUtilization = [];

        for (const resource of this.getActiveResources()) {
            try {
                const capacity = await this.getResourceCapacity(resource.id, month, year);
                if (capacity.utilizationPercent < 50) {
                    lowUtilization.push(capacity);
                }
            } catch (error) {
                console.error(`Error checking capacity for resource ${resource.id}:`, error);
            }
        }

        return lowUtilization.sort((a, b) => a.utilizationPercent - b.utilizationPercent);
    }
}

// Create singleton instance
const resourcesManager = new ResourcesManager();

// Export singleton
export default resourcesManager;
