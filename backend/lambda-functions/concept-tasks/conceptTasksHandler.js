"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../lib/response");
const errors_1 = require("../lib/errors");
const validators_1 = require("../lib/validators");
const handler = async (event) => {
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const taskId = pathParameters.id;
    try {
        if (method === 'OPTIONS') {
            return (0, response_1.optionsResponse)();
        }
        switch (method) {
            case 'GET':
                if (taskId) {
                    return await getConceptTaskById(taskId);
                }
                else {
                    return await listConceptTasks(event.queryStringParameters || {});
                }
            case 'POST':
                return await createConceptTask(event.body);
            case 'PUT':
                if (!taskId) {
                    return (0, response_1.errorResponse)('Task ID is required for update', 400);
                }
                return await updateConceptTask(taskId, event.body);
            case 'DELETE':
                if (!taskId) {
                    return (0, response_1.errorResponse)('Task ID is required for delete', 400);
                }
                return await deleteConceptTask(taskId);
            default:
                return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        console.error('Error in conceptTasksHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};
exports.handler = handler;
async function listConceptTasks(queryParams) {
    const { projectId } = queryParams;
    const allTasks = await prisma_1.prisma.conceptTask.findMany({
        where: projectId ? { projectId } : undefined,
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                    type: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const validTasks = allTasks.filter(task => task.project !== null);
    return (0, response_1.successResponse)({
        tasks: validTasks,
        count: validTasks.length,
    });
}
async function getConceptTaskById(taskId) {
    try {
        (0, validators_1.validateUUID)(taskId, 'taskId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const task = await prisma_1.prisma.conceptTask.findUnique({
        where: { id: taskId },
        include: {
            project: true,
        },
    });
    if (!task) {
        throw new errors_1.NotFoundError('ConceptTask', taskId);
    }
    return (0, response_1.successResponse)(task);
}
async function createConceptTask(body) {
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    if (!data.projectId) {
        return (0, response_1.errorResponse)('projectId is required', 400);
    }
    if (!data.title) {
        return (0, response_1.errorResponse)('title is required', 400);
    }
    if (!data.hours || data.hours <= 0) {
        return (0, response_1.errorResponse)('hours must be greater than 0', 400);
    }
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: data.projectId },
    });
    if (!project) {
        return (0, response_1.errorResponse)(`Project with ID '${data.projectId}' not found`, 404);
    }
    const task = await prisma_1.prisma.conceptTask.create({
        data: {
            projectId: data.projectId,
            title: data.title,
            description: data.description || null,
            hours: data.hours,
            skillName: data.skillName || null,
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                },
            },
        },
    });
    return (0, response_1.createdResponse)(task);
}
async function updateConceptTask(taskId, body) {
    try {
        (0, validators_1.validateUUID)(taskId, 'taskId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    const existingTask = await prisma_1.prisma.conceptTask.findUnique({
        where: { id: taskId },
    });
    if (!existingTask) {
        throw new errors_1.NotFoundError('ConceptTask', taskId);
    }
    const updatedTask = await prisma_1.prisma.conceptTask.update({
        where: { id: taskId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.hours && { hours: data.hours }),
            ...(data.skillName !== undefined && { skillName: data.skillName }),
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                },
            },
        },
    });
    return (0, response_1.successResponse)(updatedTask);
}
async function deleteConceptTask(taskId) {
    try {
        (0, validators_1.validateUUID)(taskId, 'taskId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const existingTask = await prisma_1.prisma.conceptTask.findUnique({
        where: { id: taskId },
    });
    if (!existingTask) {
        throw new errors_1.NotFoundError('ConceptTask', taskId);
    }
    await prisma_1.prisma.conceptTask.delete({
        where: { id: taskId },
    });
    return (0, response_1.noContentResponse)();
}
//# sourceMappingURL=conceptTasksHandler.js.map