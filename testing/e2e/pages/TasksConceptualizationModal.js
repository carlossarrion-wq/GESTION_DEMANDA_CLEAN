/**
 * Tasks Conceptualization Modal Page Object
 * Represents the Tasks Conceptualization modal and its interactions
 */

const testData = require('../fixtures/testData');
const helpers = require('../utils/helpers');

class TasksConceptualizationModal {
  constructor(page) {
    this.page = page;
    this.selectors = testData.selectors;
  }

  /**
   * Check if modal is open
   * @returns {Promise<boolean>}
   */
  async isOpen() {
    const count = await this.page.locator(this.selectors.tasksModal).count();
    if (count === 0) return false;
    return await this.page.locator(this.selectors.tasksModal).isVisible();
  }

  /**
   * Get modal title
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.page.locator(this.selectors.tasksModalTitle).textContent();
  }

  /**
   * Click Create Task button
   */
  async clickCreateTask() {
    await this.page.click(this.selectors.createTaskButton);
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Close modal with X button
   */
  async closeWithX() {
    await this.page.click(this.selectors.tasksModalClose);
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Close modal with Close button
   */
  async closeWithButton() {
    await this.page.click(this.selectors.tasksModalCloseButton);
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Close modal with ESC key
   */
  async closeWithESC() {
    await this.page.keyboard.press('Escape');
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Get statistics
   * @returns {Promise<{totalTasks: number, totalHours: number}>}
   */
  async getStatistics() {
    return await helpers.getStatistics(this.page);
  }

  /**
   * Count tasks in table
   * @returns {Promise<number>}
   */
  async countTasks() {
    return await helpers.countTasksInTable(this.page);
  }

  /**
   * Check if task exists
   * @param {string} taskTitle 
   * @returns {Promise<boolean>}
   */
  async taskExists(taskTitle) {
    return await helpers.taskExistsInTable(this.page, taskTitle);
  }

  /**
   * Get task hours
   * @param {string} taskTitle 
   * @returns {Promise<number>}
   */
  async getTaskHours(taskTitle) {
    return await helpers.getTaskHours(this.page, taskTitle);
  }

  /**
   * Delete task
   * @param {string} taskTitle 
   * @param {boolean} confirm - Whether to confirm deletion
   */
  async deleteTask(taskTitle, confirm = true) {
    // Setup dialog handler
    helpers.setupDialogHandler(this.page, confirm);
    
    // Find and click delete icon for the task
    const taskRow = this.page.locator(this.selectors.taskRow(taskTitle));
    const deleteIcon = taskRow.locator(this.selectors.deleteIcon);
    await deleteIcon.click();
    
    // Wait for modal to refresh (if confirmed)
    if (confirm) {
      await this.page.waitForTimeout(testData.timeouts.medium);
      await helpers.waitForElement(this.page, this.selectors.tasksModal);
    }
  }

  /**
   * Get table headers
   * @returns {Promise<string[]>}
   */
  async getTableHeaders() {
    return await helpers.getTableHeaders(this.page);
  }

  /**
   * Check if table is empty
   * @returns {Promise<boolean>}
   */
  async isTableEmpty() {
    const count = await this.page.locator(this.selectors.emptyTableMessage).count();
    return count > 0;
  }

  /**
   * Get empty table message
   * @returns {Promise<string>}
   */
  async getEmptyTableMessage() {
    return await this.page.locator(this.selectors.emptyTableMessage).textContent();
  }

  /**
   * Check if Create Task button is visible
   * @returns {Promise<boolean>}
   */
  async isCreateTaskButtonVisible() {
    return await this.page.locator(this.selectors.createTaskButton).isVisible();
  }

  /**
   * Wait for modal to refresh after operation
   */
  async waitForRefresh() {
    await this.page.waitForTimeout(testData.timeouts.medium);
    await helpers.waitForElement(this.page, this.selectors.tasksModal);
  }

  /**
   * Get all task titles from table
   * @returns {Promise<string[]>}
   */
  async getAllTaskTitles() {
    const rows = this.page.locator(`${this.selectors.tasksTableBody} tr`);
    const count = await rows.count();
    
    if (count === 0) return [];
    
    // Check if empty message
    const emptyMessage = await this.page.locator(this.selectors.emptyTableMessage).count();
    if (emptyMessage > 0) return [];
    
    const titles = [];
    for (let i = 0; i < count; i++) {
      const titleCell = rows.nth(i).locator('td:nth-child(2)');
      const title = await titleCell.textContent();
      titles.push(title.trim());
    }
    
    return titles;
  }

  /**
   * Verify row background color
   * @param {string} taskTitle 
   * @returns {Promise<string>}
   */
  async getRowBackgroundColor(taskTitle) {
    const row = this.page.locator(this.selectors.taskRow(taskTitle));
    return await row.evaluate(el => window.getComputedStyle(el).backgroundColor);
  }
}

module.exports = TasksConceptualizationModal;
