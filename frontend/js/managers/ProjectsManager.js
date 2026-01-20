/**
 * Projects Manager
 * Business logic for project management
 */

import apiService from '../services/api.js';
import { formatNumber, getDomainText, getStatusText, getPriorityText } from '../utils/helpers.js';

class ProjectsManager {
    constructor() {
        this.projects = [];
        this.projectsWithAbsences = [];
    }

    /**
     * Load all projects from API
     * @returns {Promise<Array>}
     */
    async loadProjects() {
        try {
            const projects = await apiService.getProjects();
            
            // Store all projects (including ABSENCES)
            this.projectsWithAbsences = [...projects];
            
            // Filter out ABSENCES for main list
            this.projects = projects.filter(p => !p.code.startsWith('ABSENCES'));
            
            // Sort by numeric ID (descending)
            const sortByNumericId = (a, b) => {
                const getNumericId = (code) => {
                    const match = code.match(/\d+/);
                    return match ? parseInt(match[0], 10) : 0;
                };
                return getNumericId(b.code) - getNumericId(a.code);
            };
            
            this.projects.sort(sortByNumericId);
            this.projectsWithAbsences.sort(sortByNumericId);
            
            console.log(`Loaded ${this.projects.length} projects (${this.projectsWithAbsences.length} with ABSENCES)`);
            
            // Return ALL projects including ABSENCES
            return this.projectsWithAbsences;
        } catch (error) {
            console.error('Error loading projects:', error);
            throw error;
        }
    }

    /**
     * Get all projects (without ABSENCES)
     * @returns {Array}
     */
    getProjects() {
        return this.projects;
    }

    /**
     * Get all projects including ABSENCES
     * @returns {Array}
     */
    getProjectsWithAbsences() {
        return this.projectsWithAbsences;
    }

    /**
     * Find project by code
     * @param {string} code
     * @returns {Object|undefined}
     */
    findByCode(code) {
        return this.projects.find(p => p.code === code);
    }

    /**
     * Find project by ID
     * @param {string|number} id
     * @returns {Object|undefined}
     */
    findById(id) {
        return this.projects.find(p => p.id === id);
    }

    /**
     * Calculate project statistics
     * @returns {Object}
     */
    getStatistics() {
        const stats = {
            total: this.projects.length,
            evolutivos: 0,
            proyectos: 0,
            byStatus: {},
            byDomain: {},
            byPriority: {}
        };

        this.projects.forEach(project => {
            // Count by type
            if (project.type === 'Evolutivo') {
                stats.evolutivos++;
            } else if (project.type === 'Proyecto') {
                stats.proyectos++;
            }

            // Count by status
            const status = getStatusText(project.status);
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Count by domain
            const domain = getDomainText(project.domain);
            stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;

            // Count by priority
            const priority = getPriorityText(project.priority);
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        });

        return stats;
    }

    /**
     * Calculate conceptualization hours for all projects
     * @returns {Promise<Map>} Map of projectId -> total hours
     */
    async calculateConceptualizationHours() {
        const totalHoursMap = new Map();
        
        try {
            const conceptTasks = await apiService.getConceptTasks();
            
            // Calculate total hours per project
            conceptTasks.forEach(task => {
                const projectId = task.projectId;
                
                if (!projectId) {
                    return;
                }
                
                const hours = parseFloat(task.hours) || 0;
                
                if (!totalHoursMap.has(projectId)) {
                    totalHoursMap.set(projectId, 0);
                }
                
                totalHoursMap.set(projectId, totalHoursMap.get(projectId) + hours);
            });
            
            console.log('Conceptualization hours calculated:', {
                projectsWithHours: totalHoursMap.size,
                totalProjects: this.projects.length,
                totalTasks: conceptTasks.length
            });
            
            return totalHoursMap;
        } catch (error) {
            console.error('Error calculating conceptualization hours:', error);
            return totalHoursMap;
        }
    }

    /**
     * Load project resources (assignments grouped by resource)
     * @param {string|number} projectId
     * @returns {Promise<Map>} Map of resourceId+skill -> resource data with hours
     */
    async loadProjectResources(projectId) {
        try {
            const assignments = await apiService.getAssignments({ projectId });
            
            // Group assignments by resource, skill/team (activity) and month
            const resourceSkillHoursMap = new Map();
            
            assignments.forEach(assignment => {
                if (!assignment.resourceId || !assignment.resource) return;
                
                const resourceId = assignment.resourceId;
                const resourceName = assignment.resource.name || 'Sin nombre';
                const skill = assignment.team || assignment.skillName || 'General';
                const hours = parseFloat(assignment.hours) || 0;
                const month = assignment.month; // 1-12
                
                // Create unique key: resourceId + skill
                const key = `${resourceId}|${skill}`;
                
                if (!resourceSkillHoursMap.has(key)) {
                    resourceSkillHoursMap.set(key, {
                        resourceId: resourceId,
                        name: resourceName,
                        skill: skill,
                        totalHours: 0,
                        monthlyHours: new Array(12).fill(0)
                    });
                }
                
                const resourceData = resourceSkillHoursMap.get(key);
                resourceData.totalHours += hours;
                
                // Add hours to the corresponding month
                if (month >= 1 && month <= 12) {
                    resourceData.monthlyHours[month - 1] += hours;
                }
            });
            
            console.log(`Loaded ${resourceSkillHoursMap.size} resource-skill combinations for project ${projectId}`);
            
            return resourceSkillHoursMap;
        } catch (error) {
            console.error('Error loading project resources:', error);
            throw error;
        }
    }

    /**
     * Calculate average hours per project type
     * @returns {Promise<Object>}
     */
    async calculateAverageHours() {
        try {
            const assignments = await apiService.getAssignments();
            
            // Calculate total hours per project
            const projectHours = {};
            
            assignments.forEach(assignment => {
                const projectId = assignment.projectId;
                if (!projectId) return;
                
                const hours = parseFloat(assignment.hours) || 0;
                
                if (!projectHours[projectId]) {
                    projectHours[projectId] = 0;
                }
                projectHours[projectId] += hours;
            });
            
            // Calculate averages by project type
            let totalHoursEvolutivos = 0;
            let totalHoursProyectos = 0;
            let countEvolutivos = 0;
            let countProyectos = 0;
            
            Object.keys(projectHours).forEach(projectId => {
                const project = this.findById(projectId);
                if (!project) return;
                
                const hours = projectHours[projectId];
                
                if (project.type === 'Evolutivo') {
                    totalHoursEvolutivos += hours;
                    countEvolutivos++;
                } else if (project.type === 'Proyecto') {
                    totalHoursProyectos += hours;
                    countProyectos++;
                }
            });
            
            // Calculate averages
            const avgEvolutivos = countEvolutivos > 0 ? Math.round(totalHoursEvolutivos / countEvolutivos) : 0;
            const avgProyectos = countProyectos > 0 ? Math.round(totalHoursProyectos / countProyectos) : 0;
            const avgTotal = (countEvolutivos + countProyectos) > 0 
                ? Math.round((totalHoursEvolutivos + totalHoursProyectos) / (countEvolutivos + countProyectos))
                : 0;
            
            return {
                avgTotal,
                avgEvolutivos,
                avgProyectos,
                countEvolutivos,
                countProyectos
            };
        } catch (error) {
            console.error('Error calculating average hours:', error);
            return {
                avgTotal: 0,
                avgEvolutivos: 0,
                avgProyectos: 0,
                countEvolutivos: 0,
                countProyectos: 0
            };
        }
    }
}

// Create singleton instance
const projectsManager = new ProjectsManager();

// Export singleton
export default projectsManager;
