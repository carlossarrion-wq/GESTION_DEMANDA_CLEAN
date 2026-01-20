/**
 * Create Task Modal Page Object
 * Represents the Create Task modal and its interactions
 */

const testData = require('../fixtures/testData');
const helpers = require('../utils/helpers');

class CreateTaskModal {
  constructor(page) {
    this.page = page;
    this.selectors = testData.selectors;
  }

  /**
   * Check if modal is open
   * @returns {Promise<boolean>}
   */
  async isOpen() {
    const count = await this.page.locator(this.selectors.createTaskModal).count();
    if (count === 0) return false;
    return await this.page.locator(this.selectors.createTaskModal).isVisible();
  }

  /**
   * Get modal title
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.page.locator(this.selectors.createTaskModalTitle).textContent();
  }

  /**
   * Fill task form
   * @param {Object} taskData 
   * @param {string} taskData.title
   * @param {string} taskData.description
   * @param {number} taskData.hours
   * @param {string} taskData.skill
   */
  async fillForm(taskData) {
    if (taskData.title !== undefined) {
      await helpers.fillField(this.page, this.selectors.taskTitleInput, taskData.title);
    }
    
    if (taskData.description !== undefined) {
      await helpers.fillField(this.page, this.selectors.taskDescriptionInput, taskData.description);
    }
    
    if (taskData.hours !== undefined) {
      await helpers.fillField(this.page, this.selectors.taskHoursInput, taskData.hours);
    }
    
    if (taskData.skill !== undefined) {
      await helpers.fillField(this.page, this.selectors.taskSkillInput, taskData.skill);
    }
  }

  /**
   * Click Save button
   */
  async clickSave() {
    await this.page.click(this.selectors.saveTaskButton);
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Click Cancel button
   */
  async clickCancel() {
    await this.page.click(this.selectors.cancelTaskButton);
    await helpers.waitForModalAnimation(this.page);
  }

  /**
   * Close modal with X button
   */
  async closeWithX() {
    await this.page.click(this.selectors.createTaskModalClose);
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
   * Create task (fill form and save)
   * @param {Object} taskData 
   */
  async createTask(taskData) {
    await this.fillForm(taskData);
    await this.clickSave();
  }

  /**
   * Check if field has validation error
   * @param {string} fieldSelector 
   * @returns {Promise<boolean>}
   */
  async hasValidationError(fieldSelector) {
    const field = this.page.locator(fieldSelector);
    const validity = await field.evaluate(el => el.validity.valid);
    return !validity;
  }

  /**
   * Get field value
   * @param {string} fieldSelector 
   * @returns {Promise<string>}
   */
  async getFieldValue(fieldSelector) {
    return await this.page.locator(fieldSelector).inputValue();
  }

  /**
   * Check if Save button is enabled
   * @returns {Promise<boolean>}
   */
  async isSaveButtonEnabled() {
    return await this.page.locator(this.selectors.saveTaskButton).isEnabled();
  }

  /**
   * Wait for modal to close
   */
  async waitForClose() {
    await this.page.waitForSelector(this.selectors.createTaskModal, { state: 'hidden' });
  }

  /**
   * Check if notification is visible
   * @param {string} type - 'error' or 'success'
   * @returns {Promise<boolean>}
   */
  async isNotificationVisible(type = 'error') {
    return await helpers.isNotificationVisible(this.page, type);
  }

  /**
   * Get notification message
   * @returns {Promise<string|null>}
   */
  async getNotificationMessage() {
    return await helpers.getNotificationMessage(this.page);
  }
}

module.exports = CreateTaskModal;
