"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;

const { query } = require("./lib/db");
const response_1 = require("./lib/response");
const validators_1 = require("./lib/validators");
const errors_1 = require("./lib/errors");

function getWorkingDaysInMonth(year, month) {
    let workingDays = 0;
    const date = new Date(year, month - 1, 1);
    
    while (date.getMonth() === month - 1) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
        date.setDate(date.getDate() + 1);
    }
    
    return workingDays;
}

const handler = async (event) => {
    console.log('Capacity Handler - Event:', JSON.stringify(event, null, 2));
    
    if (event.httpMethod === 'OPTIONS') {
        return (0, response_1.optionsResponse)();
    }
    
    try {
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const path = event.path || '';
        const id = pathParameters.id;
        const userTeam = event.headers['x-user-team'] || event.headers['X-User-Team'];
        
        switch (method) {
            case 'GET':
                if (path.includes('/overview')) {
                    if (!userTeam) {
                        return (0, response_1.errorResponse)('x-user-team header is required', 400);
                    }
                    return await getCapacityOverview(userTeam, event.queryStringParameters || {});
                }
                if (id) {
                    return await getCapacityById(id);
                }
                return await listCapacity(event.queryStringParameters || {});
            case 'PUT':
                return await upsertCapacity(event.body);
            default:
                return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        }
    } catch (error) {
        const errorResult = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(errorResult.message, errorResult.statusCode, errorResult.details);
    }
};

exports.handler = handler;

const getCapacityOverview = async (userTeam, queryParams) => {
    const year = queryParams.year ? parseInt(queryParams.year) : new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Get resources with their skills, capacities, and assignments
    const sql = `
        SELECT 
            r.id,
            r.code,
            r.name,
            r.email,
            r.default_capacity,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'skillName', rs.skill_name,
                        'proficiency', rs.proficiency
                    )
                ) FILTER (WHERE rs.skill_name IS NOT NULL),
                '[]'
            ) as skills,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'month', c.month,
                        'year', c.year,
                        'totalHours', c.total_hours
                    )
                ) FILTER (WHERE c.id IS NOT NULL AND c.year = $1),
                '[]'
            ) as capacities,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', a.id,
                        'projectId', a.project_id,
                        'projectCode', p.code,
                        'projectTitle', p.title,
                        'projectType', p.type,
                        'skillName', a.skill_name,
                        'team', a.team,
                        'hours', a.hours,
                        'month', a.month,
                        'year', a.year,
                        'date', a.date
                    )
                ) FILTER (WHERE a.id IS NOT NULL),
                '[]'
            ) as assignments
        FROM resources r
        LEFT JOIN resource_skills rs ON r.id = rs.resource_id
        LEFT JOIN capacity c ON r.id = c.resource_id
        LEFT JOIN assignments a ON r.id = a.resource_id 
            AND (a.year = $1 OR (a.date >= $2 AND a.date <= $3))
        LEFT JOIN projects p ON a.project_id = p.id
        WHERE r.team = $4 AND r.active = true
        GROUP BY r.id
        ORDER BY r.name ASC
    `;
    
    const result = await query(sql, [
        year,
        `${year}-01-01`,
        `${year}-12-31T23:59:59`,
        userTeam
    ]);
    
    const resources = result.rows;
    
    const resourcesWithMetrics = resources.map((resource) => {
        // Group assignments by month
        const assignmentsByMonth = {};
        
        resource.assignments.forEach((assignment) => {
            let month;
            let assignmentYear;
            
            if (assignment.date) {
                const assignmentDate = new Date(assignment.date);
                month = assignmentDate.getUTCMonth() + 1;
                assignmentYear = assignmentDate.getUTCFullYear();
            } else if (assignment.month && assignment.year) {
                month = assignment.month;
                assignmentYear = assignment.year;
            } else {
                return;
            }
            
            if (assignmentYear !== year) {
                return;
            }
            
            if (!assignmentsByMonth[month]) {
                assignmentsByMonth[month] = [];
            }
            
            assignmentsByMonth[month].push({
                projectId: assignment.projectId,
                projectCode: assignment.projectCode,
                projectTitle: assignment.projectTitle,
                projectType: assignment.projectType,
                skillName: assignment.skillName,
                team: assignment.team,
                hours: Number(assignment.hours)
            });
        });
        
        // Calculate monthly data
        const monthlyData = [];
        
        for (let month = 1; month <= 12; month++) {
            const assignments = assignmentsByMonth[month] || [];
            const dailyBaseHours = resource.default_capacity / 20;
            const workingDays = getWorkingDaysInMonth(year, month);
            const baseHours = dailyBaseHours * workingDays;
            
            const absences = assignments.filter((a) => 
                a.projectCode && a.projectCode.startsWith('ABSENCES')
            );
            const normalAssignments = assignments.filter((a) => 
                !a.projectCode || !a.projectCode.startsWith('ABSENCES')
            );
            
            const absenceHours = absences.reduce((sum, a) => sum + a.hours, 0);
            const committedHours = normalAssignments.reduce((sum, a) => sum + a.hours, 0);
            const totalHours = Math.max(0, baseHours - absenceHours);
            const availableHours = Math.max(0, totalHours - committedHours);
            const utilizationRate = totalHours > 0 ? (committedHours / totalHours) * 100 : 0;
            
            monthlyData.push({
                month,
                totalHours: Math.round(totalHours),
                committedHours,
                availableHours: Math.round(availableHours),
                utilizationRate: Math.round(utilizationRate),
                assignments: assignments
            });
        }
        
        // Calculate average utilization for future months (including current month)
        const futureMonths = monthlyData.filter(m => m.month >= currentMonth);
        const avgUtilization = futureMonths.length > 0
            ? Math.round(futureMonths.reduce((sum, m) => sum + m.utilizationRate, 0) / futureMonths.length)
            : 0;
        // Check if resource has ANY assignment in the year (not just future)
        const hasFutureAssignment = monthlyData.some(m => m.committedHours > 0);
        
        return {
            id: resource.id,
            code: resource.code,
            name: resource.name,
            email: resource.email,
            defaultCapacity: resource.default_capacity,
            skills: resource.skills.map((s) => ({
                name: s.skillName,
                proficiency: s.proficiency
            })),
            monthlyData,
            avgUtilization,
            hasFutureAssignment
        };
    });
    
    // Calculate KPIs
    const totalResources = resourcesWithMetrics.length;
    const resourcesWithAssignment = resourcesWithMetrics.filter(r => r.hasFutureAssignment).length;
    const resourcesWithoutAssignment = totalResources - resourcesWithAssignment;
    
    const currentMonthUtilization = resourcesWithMetrics.length > 0
        ? Math.round(resourcesWithMetrics.reduce((sum, r) => {
            const currentMonthData = r.monthlyData.find(m => m.month === currentMonth);
            return sum + (currentMonthData?.utilizationRate || 0);
        }, 0) / resourcesWithMetrics.length)
        : 0;
    
    const futureUtilization = resourcesWithMetrics.length > 0
        ? Math.round(resourcesWithMetrics.reduce((sum, r) => {
            const futureMonths = r.monthlyData.filter(m => m.month > currentMonth);
            const avgFuture = futureMonths.length > 0
                ? futureMonths.reduce((s, m) => s + m.utilizationRate, 0) / futureMonths.length
                : 0;
            return sum + avgFuture;
        }, 0) / resourcesWithMetrics.length)
        : 0;
    
    // Monthly aggregated data
    const monthlyAggregated = [];
    for (let month = 1; month <= 12; month++) {
        const totalCommitted = resourcesWithMetrics.reduce((sum, r) => {
            const monthData = r.monthlyData.find(m => m.month === month);
            return sum + (monthData?.committedHours || 0);
        }, 0);
        
        const totalAvailable = resourcesWithMetrics.reduce((sum, r) => {
            const monthData = r.monthlyData.find(m => m.month === month);
            return sum + (monthData?.availableHours || 0);
        }, 0);
        
        monthlyAggregated.push({
            month,
            committedHours: totalCommitted,
            availableHours: totalAvailable
        });
    }
    
    // Skills availability
    const skillsAvailability = {};
    resourcesWithMetrics.forEach((resource) => {
        const skillCount = resource.skills.length;
        if (skillCount === 0) return;
        
        resource.skills.forEach((skill) => {
            if (!skillsAvailability[skill.name]) {
                skillsAvailability[skill.name] = { current: 0, future: 0 };
            }
            
            const currentMonthData = resource.monthlyData.find((m) => m.month === currentMonth);
            if (currentMonthData) {
                skillsAvailability[skill.name].current += currentMonthData.availableHours / skillCount;
            }
            
            const futureMonths = resource.monthlyData.filter((m) => m.month > currentMonth);
            const futureAvailable = futureMonths.reduce((sum, m) => sum + m.availableHours, 0);
            skillsAvailability[skill.name].future += futureAvailable / skillCount;
        });
    });
    
    const skillOrder = ['Project Management', 'Análisis', 'Diseño', 'Construcción', 'QA', 'General'];
    const skillsData = skillOrder
        .filter(skillName => skillsAvailability[skillName])
        .map(skillName => ({
            skill: skillName,
            currentMonth: Math.round(skillsAvailability[skillName].current),
            futureMonths: Math.round(skillsAvailability[skillName].future)
        }));
    
    return (0, response_1.successResponse)({
        year,
        currentMonth,
        kpis: {
            totalResources,
            resourcesWithAssignment,
            resourcesWithoutAssignment,
            avgUtilization: {
                current: currentMonthUtilization,
                future: futureUtilization
            }
        },
        charts: {
            monthlyComparison: monthlyAggregated,
            skillsAvailability: skillsData
        },
        resources: resourcesWithMetrics
    });
};

const listCapacity = async (queryParams) => {
    const { resourceId, month, year, page, limit } = queryParams;
    const pagination = (0, validators_1.validatePaginationParams)(page, limit);
    
    let sql = `
        SELECT 
            c.*,
            json_build_object(
                'id', r.id,
                'code', r.code,
                'name', r.name,
                'active', r.active
            ) as resource
        FROM capacity c
        LEFT JOIN resources r ON c.resource_id = r.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (resourceId) {
        try {
            (0, validators_1.validateUUID)(resourceId, 'resourceId');
        } catch (error) {
            throw error;
        }
        sql += ` AND c.resource_id = $${paramIndex++}`;
        params.push(resourceId);
    }
    
    if (month) {
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return (0, response_1.errorResponse)('Month must be between 1 and 12', 400);
        }
        sql += ` AND c.month = $${paramIndex++}`;
        params.push(monthNum);
    }
    
    if (year) {
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
            return (0, response_1.errorResponse)('Year must be between 2000 and 2100', 400);
        }
        sql += ` AND c.year = $${paramIndex++}`;
        params.push(yearNum);
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/LEFT JOIN.*WHERE/, 'WHERE');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    sql += `
        ORDER BY c.year DESC, c.month DESC, r.name ASC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(pagination.limit, (pagination.page - 1) * pagination.limit);
    
    const result = await query(sql, params);
    
    // Calculate metrics for each capacity
    const capacitiesWithMetrics = await Promise.all(result.rows.map(async (capacity) => {
        const assignedResult = await query(
            `SELECT COALESCE(SUM(hours), 0) as total_hours
             FROM assignments
             WHERE resource_id = $1 AND month = $2 AND year = $3`,
            [capacity.resource_id, capacity.month, capacity.year]
        );
        
        const totalHours = Number(capacity.total_hours);
        const assigned = Number(assignedResult.rows[0].total_hours);
        
        return {
            ...capacity,
            totalHours,
            assignedHours: assigned,
            availableHours: totalHours - assigned,
            utilizationPercentage: totalHours > 0
                ? Math.round((assigned / totalHours) * 100)
                : 0,
        };
    }));
    
    return (0, response_1.successResponse)({
        capacities: capacitiesWithMetrics,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
        },
    });
};

const getCapacityById = async (id) => {
    try {
        (0, validators_1.validateUUID)(id, 'id');
    } catch (error) {
        throw error;
    }
    
    const sql = `
        SELECT 
            c.*,
            json_build_object(
                'id', r.id,
                'code', r.code,
                'name', r.name,
                'email', r.email,
                'active', r.active
            ) as resource
        FROM capacity c
        LEFT JOIN resources r ON c.resource_id = r.id
        WHERE c.id = $1
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
        throw new errors_1.NotFoundError('Capacity', id);
    }
    
    const capacity = result.rows[0];
    
    // Get assignments for this capacity
    const assignmentsSql = `
        SELECT 
            a.id,
            a.skill_name,
            a.hours,
            json_build_object(
                'id', p.id,
                'code', p.code,
                'title', p.title
            ) as project
        FROM assignments a
        LEFT JOIN projects p ON a.project_id = p.id
        WHERE a.resource_id = $1 AND a.month = $2 AND a.year = $3
    `;
    
    const assignmentsResult = await query(assignmentsSql, [
        capacity.resource_id,
        capacity.month,
        capacity.year
    ]);
    
    const assignments = assignmentsResult.rows;
    const assignedHours = assignments.reduce((sum, a) => sum + Number(a.hours), 0);
    const totalHours = Number(capacity.total_hours);
    const availableHours = totalHours - assignedHours;
    const utilizationPercentage = totalHours > 0
        ? Math.round((assignedHours / totalHours) * 100)
        : 0;
    
    return (0, response_1.successResponse)({
        ...capacity,
        totalHours,
        assignedHours,
        availableHours,
        utilizationPercentage,
        assignments: assignments.map((a) => ({
            id: a.id,
            project: a.project,
            skillName: a.skill_name,
            hours: Number(a.hours),
        })),
    });
};

const upsertCapacity = async (body) => {
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    
    const data = JSON.parse(body);
    
    try {
        (0, validators_1.validateCapacityData)(data);
        (0, validators_1.validateUUID)(data.resourceId, 'resourceId');
    } catch (error) {
        throw error;
    }
    
    // Check if resource exists and is active
    const resourceResult = await query(
        'SELECT id, active FROM resources WHERE id = $1',
        [data.resourceId]
    );
    
    if (resourceResult.rows.length === 0) {
        throw new errors_1.NotFoundError('Resource', data.resourceId);
    }
    
    if (!resourceResult.rows[0].active) {
        throw new errors_1.BusinessRuleError(
            'Cannot set capacity for inactive resource',
            'INACTIVE_RESOURCE'
        );
    }
    
    // Check assigned hours
    const assignedResult = await query(
        `SELECT COALESCE(SUM(hours), 0) as total_hours
         FROM assignments
         WHERE resource_id = $1 AND month = $2 AND year = $3`,
        [data.resourceId, data.month, data.year]
    );
    
    const totalAssignedHours = Number(assignedResult.rows[0].total_hours);
    
    if (data.totalHours < totalAssignedHours) {
        throw new errors_1.BusinessRuleError(
            `Cannot set capacity to ${data.totalHours} hours. Resource already has ${totalAssignedHours} hours assigned for ${data.month}/${data.year}`,
            'CAPACITY_BELOW_ASSIGNED'
        );
    }
    
    // Upsert capacity
    const upsertSql = `
        INSERT INTO capacity (resource_id, month, year, total_hours)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (resource_id, month, year)
        DO UPDATE SET total_hours = $4
        RETURNING *
    `;
    
    const upsertResult = await query(upsertSql, [
        data.resourceId,
        data.month,
        data.year,
        data.totalHours
    ]);
    
    const capacity = upsertResult.rows[0];
    
    // Get resource info
    const resourceInfoResult = await query(
        'SELECT id, code, name FROM resources WHERE id = $1',
        [data.resourceId]
    );
    
    const totalHours = Number(capacity.total_hours);
    
    return (0, response_1.successResponse)({
        ...capacity,
        resource: resourceInfoResult.rows[0],
        totalHours,
        assignedHours: totalAssignedHours,
        availableHours: totalHours - totalAssignedHours,
        utilizationPercentage: totalHours > 0
            ? Math.round((totalAssignedHours / totalHours) * 100)
            : 0,
    }, 200);
};
