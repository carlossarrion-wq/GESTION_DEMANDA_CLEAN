/**
 * Projects Page Object
 * Represents the Projects page and its interactions
 */

const testData = require('../fixtures/testData');
const helpers = require('../utils/helpers');

class ProjectsPage {
  constructor(page) {
    this.page = page;
    this.selectors = testData.selectors;
  }

  /**
   * Navigate to the application
   */
  async goto() {
    // Go to login page
    await this.page.goto('/login.html');
    
    // Fill login form
    await this.page.fill('#access-key', testData.auth.awsAccessKey);
    await this.page.fill('#secret-key', testData.auth.userTeam);
    
    // Click login button
    await this.page.click('#login-btn');
    
    // Wait for authentication and redirect
    await this.page.waitForURL('**/index-modular.html', { timeout: 30000 });
    
    // Wait for page to load completely
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Navigate to Projects tab
   */
  async navigateToProjectsTab() {
    await this.page.click(this.selectors.projectsTab);
    await helpers.waitForElement(this.page, this.selectors.projectsTable);
  }

  /**
   * Open Tasks Conceptualization modal for a project
   * @param {string} projectCode 
   */
  async openTasksModal(projectCode) {
    await this.navigateToProjectsTab();
    
    const tasksIcon = this.selectors.tasksIcon(projectCode);
    await helpers.waitForElement(this.page, tasksIcon);
    await this.page.click(tasksIcon);
    
    // Wait for modal to open
    await helpers.waitForElement(this.page, this.selectors.tasksModal);
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Check if project exists in table
   * @param {string} projectCode 
   * @returns {Promise<boolean>}
   */
  async projectExists(projectCode) {
    await this.navigateToProjectsTab();
    const count = await this.page.locator(this.selectors.projectRow(projectCode)).count();
    return count > 0;
  }

  /**
   * Get project row
   * @param {string} projectCode 
   */
  getProjectRow(projectCode) {
    return this.page.locator(this.selectors.projectRow(projectCode));
  }
}

module.exports = ProjectsPage;
