/**
 * Test Helper Functions
 * Utility functions for Playwright tests
 */

const testData = require('../fixtures/testData');

/**
 * Setup authentication in sessionStorage
 * @param {import('@playwright/test').Page} page 
 */
async function setupAuth(page) {
  await page.evaluate((auth) => {
    sessionStorage.setItem('aws_access_key', auth.awsAccessKey);
    sessionStorage.setItem('user_team', auth.userTeam);
  }, testData.auth);
}

/**
 * Wait for modal animation to complete
 * @param {import('@playwright/test').Page} page 
 */
async function waitForModalAnimation(page) {
  await page.waitForTimeout(testData.timeouts.modalAnimation);
}

/**
 * Wait for API response
 * @param {import('@playwright/test').Page} page 
 * @param {string} endpoint - API endpoint to wait for
 */
async function waitForApiResponse(page, endpoint) {
  await page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === 200,
    { timeout: testData.timeouts.apiResponse }
  );
}

/**
 * Get current statistics from the modal
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<{totalTasks: number, totalHours: number}>}
 */
async function getStatistics(page) {
  const totalTasksText = await page.locator(testData.selectors.totalTasksStat).textContent();
  const totalHoursText = await page.locator(testData.selectors.totalHoursStat).textContent();
  
  return {
    totalTasks: parseInt(totalTasksText.trim()),
    totalHours: parseFloat(totalHoursText.trim())
  };
}

/**
 * Count tasks in the table
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<number>}
 */
async function countTasksInTable(page) {
  const rows = await page.locator(`${testData.selectors.tasksTableBody} tr`).count();
  
  // Check if it's the empty message row
  const emptyMessage = await page.locator(testData.selectors.emptyTableMessage).count();
  if (emptyMessage > 0) {
    return 0;
  }
  
  return rows;
}

/**
 * Check if task exists in table
 * @param {import('@playwright/test').Page} page 
 * @param {string} taskTitle 
 * @returns {Promise<boolean>}
 */
async function taskExistsInTable(page, taskTitle) {
  const count = await page.locator(testData.selectors.taskRow(taskTitle)).count();
  return count > 0;
}

/**
 * Get task hours from table
 * @param {import('@playwright/test').Page} page 
 * @param {string} taskTitle 
 * @returns {Promise<number>}
 */
async function getTaskHours(page, taskTitle) {
  const row = page.locator(testData.selectors.taskRow(taskTitle));
  const hoursCell = row.locator('td:nth-child(4)');
  const hoursText = await hoursCell.textContent();
  return parseFloat(hoursText.trim());
}

/**
 * Handle browser dialog (confirm/alert)
 * @param {import('@playwright/test').Page} page 
 * @param {boolean} accept - Whether to accept or dismiss the dialog
 */
function setupDialogHandler(page, accept = true) {
  page.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    if (accept) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
}

/**
 * Take screenshot with timestamp
 * @param {import('@playwright/test').Page} page 
 * @param {string} name 
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Wait for element to be visible and stable
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 */
async function waitForElement(page, selector) {
  await page.waitForSelector(selector, { state: 'visible' });
  await page.waitForTimeout(100); // Small delay for stability
}

/**
 * Fill form field with validation
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 * @param {string|number} value 
 */
async function fillField(page, selector, value) {
  await page.fill(selector, ''); // Clear first
  await page.fill(selector, String(value));
  await page.waitForTimeout(100); // Small delay for validation
}

/**
 * Click and wait for navigation/response
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 */
async function clickAndWait(page, selector) {
  await page.click(selector);
  await waitForModalAnimation(page);
}

/**
 * Get table column headers
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<string[]>}
 */
async function getTableHeaders(page) {
  const headers = await page.locator(testData.selectors.tasksTableHeaders).allTextContents();
  return headers.map(h => h.trim());
}

/**
 * Check if notification is visible
 * @param {import('@playwright/test').Page} page 
 * @param {string} type - 'error' or 'success'
 * @returns {Promise<boolean>}
 */
async function isNotificationVisible(page, type = 'error') {
  const selector = type === 'error' 
    ? testData.selectors.notificationError 
    : testData.selectors.notificationSuccess;
  
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Get notification message
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<string|null>}
 */
async function getNotificationMessage(page) {
  const notification = page.locator(testData.selectors.notification);
  const count = await notification.count();
  
  if (count === 0) {
    return null;
  }
  
  return await notification.textContent();
}

/**
 * Clear all tasks from a project (cleanup helper)
 * @param {import('@playwright/test').Page} page 
 */
async function clearAllTasks(page) {
  const taskCount = await countTasksInTable(page);
  
  for (let i = 0; i < taskCount; i++) {
    // Always delete the first task (since table updates after each deletion)
    const deleteButton = page.locator(testData.selectors.deleteIcon).first();
    
    // Setup dialog handler to accept deletion
    setupDialogHandler(page, true);
    
    await deleteButton.click();
    
    // Wait for modal to refresh
    await page.waitForTimeout(testData.timeouts.medium);
    
    // Wait for modal to reopen
    await waitForElement(page, testData.selectors.tasksModal);
  }
}

/**
 * Verify modal is closed
 * @param {import('@playwright/test').Page} page 
 * @param {string} modalSelector 
 * @returns {Promise<boolean>}
 */
async function isModalClosed(page, modalSelector) {
  const count = await page.locator(modalSelector).count();
  if (count === 0) return true;
  
  const isVisible = await page.locator(modalSelector).isVisible();
  return !isVisible;
}

/**
 * Get current month and year
 * @returns {{month: number, year: number}}
 */
function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // JavaScript months are 0-indexed
    year: now.getFullYear()
  };
}

/**
 * Format hours for display (1 decimal)
 * @param {number} hours 
 * @returns {string}
 */
function formatHours(hours) {
  return hours.toFixed(1);
}

/**
 * Generate unique task title
 * @param {string} prefix 
 * @returns {string}
 */
function generateUniqueTaskTitle(prefix = 'Test Task') {
  const timestamp = Date.now();
  return `${prefix} ${timestamp}`;
}

module.exports = {
  setupAuth,
  waitForModalAnimation,
  waitForApiResponse,
  getStatistics,
  countTasksInTable,
  taskExistsInTable,
  getTaskHours,
  setupDialogHandler,
  takeScreenshot,
  waitForElement,
  fillField,
  clickAndWait,
  getTableHeaders,
  isNotificationVisible,
  getNotificationMessage,
  clearAllTasks,
  isModalClosed,
  getCurrentMonthYear,
  formatHours,
  generateUniqueTaskTitle
};
