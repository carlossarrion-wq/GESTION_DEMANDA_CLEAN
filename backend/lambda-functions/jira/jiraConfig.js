/**
 * Jira Configuration Manager
 * Manages team-specific Jira configurations
 */

/**
 * Get Jira configuration for a specific team
 * @param {string} team - Team name (e.g., 'gadea', 'team2')
 * @returns {Object} Jira configuration
 */
function getJiraConfigForTeam(team) {
    if (!team) {
        throw new Error('Team is required');
    }
    
    const teamUpper = team.toUpperCase();
    
    // Common credentials
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;
    
    if (!email || !apiToken) {
        throw new Error('Jira credentials not configured. Please set JIRA_EMAIL and JIRA_API_TOKEN in environment variables.');
    }
    
    // Team-specific URL
    const url = process.env[`JIRA_URL_${teamUpper}`];
    
    if (!url) {
        throw new Error(`Jira URL not configured for team '${team}'. Please set JIRA_URL_${teamUpper} in environment variables.`);
    }
    
    // Team-specific default JQL (optional)
    const defaultJql = process.env[`JIRA_JQL_${teamUpper}`] || `project = '${teamUpper}' AND status != 'Closed'`;
    
    // Create Basic Auth token
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    return {
        url,
        email,
        apiToken,
        defaultJql,
        auth,
        team
    };
}

/**
 * Get list of configured teams
 * @returns {Array<string>} List of team names
 */
function getConfiguredTeams() {
    const teams = [];
    
    // Look for JIRA_URL_* environment variables
    Object.keys(process.env).forEach(key => {
        if (key.startsWith('JIRA_URL_')) {
            const team = key.replace('JIRA_URL_', '').toLowerCase();
            teams.push(team);
        }
    });
    
    return teams;
}

module.exports = {
    getJiraConfigForTeam,
    getConfiguredTeams
};
