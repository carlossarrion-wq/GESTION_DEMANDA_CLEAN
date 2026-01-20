/**
 * Jira Configuration Example
 * Copia este archivo a jiraConfig.js y completa con tus credenciales
 */

export const JIRA_CONFIG = {
    url: 'https://tu-instancia.atlassian.net',
    email: 'tu.email@ejemplo.com',
    apiToken: 'TU_API_TOKEN_AQUI',
    jqlQuery: "project = TU_PROYECTO AND status != Closed"
};
