// Effort Tracking Component - Esfuerzo Incurrido vs. Planificado

import { API_CONFIG } from '../config/data.js';
import { formatNumber, getDomainText } from '../utils/helpers.js';

/**
 * Load and populate the Effort Tracking table
 */
export async function initializeEffortTrackingTable() {
    const tbody = document.getElementById('effort-tracking-table-body');
    if (!tbody) return;
    
    try {
        // Load data from API
        const { projects, assignments, conceptHoursMap } = await loadEffortData();
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter out ABSENCES projects
        const filteredProjects = projects.filter(p => !p.code.startsWith('ABSENCES'));
        
        // Calculate metrics for each project
        const projectMetrics = filteredProjects.map(project => {
            // Get all assignments for this project
            const projectAssignments = assignments.filter(a => a.projectId === project.id);
            
            // Calculate ITD (Inception To Date) - hours from start until today
            const itd = projectAssignments
                .filter(a => {
                    const assignmentDate = new Date(a.year, a.month - 1, 1);
                    return assignmentDate <= today;
                })
                .reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
            
            // Calculate ETC (Estimate To Complete) - hours from tomorrow onwards
            const etc = projectAssignments
                .filter(a => {
                    const assignmentDate = new Date(a.year, a.month - 1, 1);
                    return assignmentDate > today;
                })
                .reduce((sum, a) => sum + (parseFloat(a.hours) || 0), 0);
            
            // Calculate EAC (Estimate At Completion) - ITD + ETC
            const eac = itd + etc;
            
            // Get initial estimate from concept tasks (sum of hours from concept-tasks table)
            const initialEstimate = conceptHoursMap.get(project.id) || 0;
            
            // Calculate deviation
            const deviationHours = initialEstimate - eac;
            const deviationPercent = initialEstimate > 0 
                ? ((deviationHours / initialEstimate) * 100).toFixed(1)
                : 0;
            
            return {
                project,
                initialEstimate,
                itd,
                etc,
                eac,
                deviationHours,
                deviationPercent
            };
        });
        
        // Sort by project code numeric ID in descending order (e.g., NC-767 -> 767)
        projectMetrics.sort((a, b) => {
            // Extract numeric part from project code (e.g., "NC-767" -> 767)
            const getNumericId = (code) => {
                const match = code.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            };
            
            const numA = getNumericId(a.project.code);
            const numB = getNumericId(b.project.code);
            
            // Sort in descending order (higher numbers first)
            return numB - numA;
        });
        
        // Populate table
        tbody.innerHTML = projectMetrics.map(metric => {
            const { project, initialEstimate, itd, etc, eac, deviationHours, deviationPercent } = metric;
            
            // Determine deviation color
            let deviationClass = '';
            if (deviationPercent < -10) {
                deviationClass = 'style="color: #dc2626; font-weight: 600;"'; // Red for over budget
            } else if (deviationPercent > 10) {
                deviationClass = 'style="color: #16a34a; font-weight: 600;"'; // Green for under budget
            }
            
            // Truncate title if too long
            const displayTitle = project.title.length > 40 
                ? project.title.substring(0, 37) + '...' 
                : project.title;
            
            return `
                <tr>
                    <td style="text-align: left;">
                        <strong>${project.code}</strong> - ${displayTitle}
                    </td>
                    <td style="text-align: center;">
                        ${project.type || 'Proyecto'}
                    </td>
                    <td style="text-align: left;">${getDomainText(project.domain)}</td>
                    <td style="text-align: center;">${formatNumber(initialEstimate)}</td>
                    <td style="text-align: center;">${formatNumber(itd)}</td>
                    <td style="text-align: center;">${formatNumber(etc)}</td>
                    <td style="text-align: center; font-weight: 600;">${formatNumber(eac)}</td>
                    <td style="text-align: center;" ${deviationClass}>${formatNumber(deviationHours)}</td>
                    <td style="text-align: center;" ${deviationClass}>${deviationPercent}%</td>
                </tr>
            `;
        }).join('');
        
        console.log('Effort Tracking table populated with', projectMetrics.length, 'projects');
        
    } catch (error) {
        console.error('Error initializing Effort Tracking table:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #718096;">
                    Error al cargar los datos de seguimiento de esfuerzo
                </td>
            </tr>
        `;
    }
}

/**
 * Load effort data from API
 */
async function loadEffortData() {
    const awsAccessKey = sessionStorage.getItem('aws_access_key');
    const userTeam = sessionStorage.getItem('user_team');
    
    if (!awsAccessKey || !userTeam) {
        console.warn('No authentication for effort tracking');
        return { projects: [], assignments: [], conceptHoursMap: new Map() };
    }
    
    try {
        const [projectsRes, assignmentsRes, conceptTasksRes] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/projects`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            }),
            fetch(`${API_CONFIG.BASE_URL}/assignments`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            }),
            fetch(`${API_CONFIG.BASE_URL}/concept-tasks`, {
                headers: {
                    'Authorization': awsAccessKey,
                    'x-user-team': userTeam
                }
            })
        ]);
        
        if (!projectsRes.ok || !assignmentsRes.ok || !conceptTasksRes.ok) {
            throw new Error('Error loading effort data');
        }
        
        const projectsData = await projectsRes.json();
        const assignmentsData = await assignmentsRes.json();
        const conceptTasksData = await conceptTasksRes.json();
        
        const projects = projectsData.data?.projects || projectsData.projects || [];
        const allAssignments = assignmentsData.data?.assignments || assignmentsData.assignments || [];
        const conceptTasks = conceptTasksData.data?.tasks || conceptTasksData.tasks || [];
        
        // Filter projects by team
        const teamProjects = projects.filter(p => p.team === userTeam);
        
        // Filter assignments by team projects
        const projectIds = new Set(teamProjects.map(p => p.id));
        const assignments = allAssignments.filter(a => projectIds.has(a.projectId));
        
        // Calculate concept hours map (sum of hours from concept tasks per project)
        const conceptHoursMap = new Map();
        conceptTasks.forEach(task => {
            const projectId = task.projectId;
            if (!projectId || !projectIds.has(projectId)) return;
            
            const hours = parseFloat(task.hours) || 0;
            
            if (!conceptHoursMap.has(projectId)) {
                conceptHoursMap.set(projectId, 0);
            }
            
            conceptHoursMap.set(projectId, conceptHoursMap.get(projectId) + hours);
        });
        
        console.log(`Effort Tracking: Loaded ${teamProjects.length} projects, ${assignments.length} assignments, and ${conceptTasks.length} concept tasks for team "${userTeam}"`);
        
        return { projects: teamProjects, assignments, conceptHoursMap };
        
    } catch (error) {
        console.error('Error loading effort data:', error);
        return { projects: [], assignments: [], conceptHoursMap: new Map() };
    }
}
