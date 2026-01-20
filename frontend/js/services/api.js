/**
 * API Service
 * Centralized API calls for the application
 */

import { API_CONFIG } from '../config/data.js';
import authService from './auth.js';

class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    /**
     * Make authenticated API call
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<any>}
     */
    async fetch(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await authService.authenticatedFetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ==================== PROJECTS ====================

    /**
     * Get all projects
     * @returns {Promise<Array>}
     */
    async getProjects() {
        const data = await this.fetch('/projects');
        return data.data?.projects || data.projects || [];
    }

    /**
     * Get project by ID
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async getProject(projectId) {
        const data = await this.fetch(`/projects/${projectId}`);
        return data.data?.project || data.project;
    }

    /**
     * Create project
     * @param {Object} projectData
     * @returns {Promise<Object>}
     */
    async createProject(projectData) {
        return await this.fetch('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    /**
     * Update project
     * @param {string|number} projectId
     * @param {Object} projectData
     * @returns {Promise<Object>}
     */
    async updateProject(projectId, projectData) {
        return await this.fetch(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    /**
     * Delete project
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async deleteProject(projectId) {
        return await this.fetch(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    }

    // ==================== RESOURCES ====================

    /**
     * Get all resources
     * @returns {Promise<Array>}
     */
    async getResources() {
        const data = await this.fetch('/resources');
        return data.data?.resources || data.resources || [];
    }

    /**
     * Get resource by ID
     * @param {string|number} resourceId
     * @returns {Promise<Object>}
     */
    async getResource(resourceId) {
        const data = await this.fetch(`/resources/${resourceId}`);
        return data.data?.resource || data.resource;
    }

    /**
     * Create resource
     * @param {Object} resourceData
     * @returns {Promise<Object>}
     */
    async createResource(resourceData) {
        return await this.fetch('/resources', {
            method: 'POST',
            body: JSON.stringify(resourceData)
        });
    }

    /**
     * Update resource
     * @param {string|number} resourceId
     * @param {Object} resourceData
     * @returns {Promise<Object>}
     */
    async updateResource(resourceId, resourceData) {
        return await this.fetch(`/resources/${resourceId}`, {
            method: 'PUT',
            body: JSON.stringify(resourceData)
        });
    }

    /**
     * Delete resource
     * @param {string|number} resourceId
     * @returns {Promise<Object>}
     */
    async deleteResource(resourceId) {
        return await this.fetch(`/resources/${resourceId}`, {
            method: 'DELETE'
        });
    }

    // ==================== ASSIGNMENTS ====================

    /**
     * Get all assignments
     * @param {Object} filters - Optional filters (projectId, resourceId, etc.)
     * @returns {Promise<Array>}
     */
    async getAssignments(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/assignments?${queryParams}` : '/assignments';
        const data = await this.fetch(endpoint);
        return data.data?.assignments || data.assignments || [];
    }

    /**
     * Create assignment
     * @param {Object} assignmentData
     * @returns {Promise<Object>}
     */
    async createAssignment(assignmentData) {
        return await this.fetch('/assignments', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
    }

    /**
     * Update assignment
     * @param {string|number} assignmentId
     * @param {Object} assignmentData
     * @returns {Promise<Object>}
     */
    async updateAssignment(assignmentId, assignmentData) {
        return await this.fetch(`/assignments/${assignmentId}`, {
            method: 'PUT',
            body: JSON.stringify(assignmentData)
        });
    }

    /**
     * Delete assignment
     * @param {string|number} assignmentId
     * @returns {Promise<Object>}
     */
    async deleteAssignment(assignmentId) {
        return await this.fetch(`/assignments/${assignmentId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Delete all assignments for a project
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async deleteProjectAssignments(projectId) {
        return await this.fetch(`/assignments?projectId=${projectId}`, {
            method: 'DELETE'
        });
    }

    // ==================== CONCEPT TASKS ====================

    /**
     * Get concept tasks
     * @param {Object} filters - Optional filters (projectId, etc.)
     * @returns {Promise<Array>}
     */
    async getConceptTasks(filters = {}) {
        // Add cache-busting parameter
        const params = { ...filters, _: Date.now() };
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `/concept-tasks?${queryParams}`;
        const data = await this.fetch(endpoint);
        return data.data?.tasks || data.tasks || [];
    }

    /**
     * Create concept task
     * @param {Object} taskData
     * @returns {Promise<Object>}
     */
    async createConceptTask(taskData) {
        return await this.fetch('/concept-tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    /**
     * Update concept task
     * @param {string|number} taskId
     * @param {Object} taskData
     * @returns {Promise<Object>}
     */
    async updateConceptTask(taskId, taskData) {
        return await this.fetch(`/concept-tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    /**
     * Delete concept task
     * @param {string|number} taskId
     * @returns {Promise<Object>}
     */
    async deleteConceptTask(taskId) {
        return await this.fetch(`/concept-tasks/${taskId}`, {
            method: 'DELETE'
        });
    }

    // ==================== DOMAINS ====================

    /**
     * Get all domains
     * @returns {Promise<Array>}
     */
    async getDomains() {
        const data = await this.fetch('/domains');
        return data.data?.domains || data.domains || [];
    }

    // ==================== STATUSES ====================

    /**
     * Get all statuses
     * @returns {Promise<Array>}
     */
    async getStatuses() {
        const data = await this.fetch('/statuses');
        return data.data?.statuses || data.statuses || [];
    }

    // ==================== SKILLS ====================

    /**
     * Get all skills
     * @returns {Promise<Array>}
     */
    async getSkills() {
        const data = await this.fetch('/skills');
        return data.data?.skills || data.skills || [];
    }
}

// Create singleton instance
const apiService = new ApiService();

// Export singleton
export default apiService;
