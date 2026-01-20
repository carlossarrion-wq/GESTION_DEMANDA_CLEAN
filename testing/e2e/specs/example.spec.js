/**
 * Example Test - Simple smoke test
 * Tests basic functionality of opening the Tasks Conceptualization modal
 */

const { test, expect } = require('@playwright/test');
const ProjectsPage = require('../pages/ProjectsPage');
const TasksConceptualizationModal = require('../pages/TasksConceptualizationModal');
const CreateTaskModal = require('../pages/CreateTaskModal');
const testData = require('../fixtures/testData');

test.describe('Tareas Conceptualización - Smoke Test', () => {
  let projectsPage;
  let tasksModal;
  let createTaskModal;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    tasksModal = new TasksConceptualizationModal(page);
    createTaskModal = new CreateTaskModal(page);
    
    // Navigate to application
    await projectsPage.goto();
  });

  test('TC-001: Should open Tasks Conceptualization modal', async ({ page }) => {
    // Navigate to Projects tab
    await projectsPage.navigateToProjectsTab();
    
    // Wait for projects to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of projects page
    await page.screenshot({ path: 'test-results/screenshots/01-projects-page.png', fullPage: true });
    
    // Get first project code from table
    const firstProjectRow = await page.locator('#projects-table-body tr').first();
    const projectCodeCell = await firstProjectRow.locator('td:first-child').textContent();
    const projectCode = projectCodeCell.trim();
    
    console.log('Found project:', projectCode);
    
    // Open tasks modal for first project
    await projectsPage.openTasksModal(projectCode);
    
    // Verify modal is open
    const isOpen = await tasksModal.isOpen();
    expect(isOpen).toBeTruthy();
    
    // Take screenshot of modal
    await page.screenshot({ path: 'test-results/screenshots/02-tasks-modal-open.png', fullPage: true });
    
    // Verify modal title contains "Tareas Conceptualización"
    const title = await tasksModal.getTitle();
    expect(title).toContain('Tareas Conceptualización');
    expect(title).toContain(projectCode);
    
    // Verify statistics are visible
    const stats = await tasksModal.getStatistics();
    expect(stats.totalTasks).toBeGreaterThanOrEqual(0);
    expect(stats.totalHours).toBeGreaterThanOrEqual(0);
    
    console.log('Statistics:', stats);
    
    // Verify table headers
    const headers = await tasksModal.getTableHeaders();
    expect(headers).toContain('ID');
    expect(headers).toContain('Título');
    expect(headers).toContain('Descripción');
    expect(headers).toContain('Horas');
    expect(headers).toContain('Acciones');
    expect(headers).not.toContain('Recurso Asignado');
    
    // Verify Create Task button is visible
    const isCreateButtonVisible = await tasksModal.isCreateTaskButtonVisible();
    expect(isCreateButtonVisible).toBeTruthy();
  });

  test('TC-002: Should open Create Task modal', async ({ page }) => {
    // Navigate to Projects tab
    await projectsPage.navigateToProjectsTab();
    await page.waitForTimeout(2000);
    
    // Get first project
    const firstProjectRow = await page.locator('#projects-table-body tr').first();
    const projectCodeCell = await firstProjectRow.locator('td:first-child').textContent();
    const projectCode = projectCodeCell.trim();
    
    // Open tasks modal
    await projectsPage.openTasksModal(projectCode);
    
    // Click Create Task button
    await tasksModal.clickCreateTask();
    
    // Verify Create Task modal is open
    const isOpen = await createTaskModal.isOpen();
    expect(isOpen).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/03-create-task-modal.png', fullPage: true });
    
    // Verify modal title
    const title = await createTaskModal.getTitle();
    expect(title).toContain('Crear Nueva Tarea');
    
    // Close modal with Cancel
    await createTaskModal.clickCancel();
    
    // Verify modal is closed
    await page.waitForTimeout(500);
    const isClosed = !(await createTaskModal.isOpen());
    expect(isClosed).toBeTruthy();
  });

  test('TC-003: Should create a task successfully', async ({ page }) => {
    // Navigate to Projects tab
    await projectsPage.navigateToProjectsTab();
    await page.waitForTimeout(2000);
    
    // Get first project
    const firstProjectRow = await page.locator('#projects-table-body tr').first();
    const projectCodeCell = await firstProjectRow.locator('td:first-child').textContent();
    const projectCode = projectCodeCell.trim();
    
    // Open tasks modal
    await projectsPage.openTasksModal(projectCode);
    
    // Get initial statistics
    const initialStats = await tasksModal.getStatistics();
    console.log('Initial stats:', initialStats);
    
    // Click Create Task
    await tasksModal.clickCreateTask();
    
    // Fill form with unique task data
    const uniqueTitle = `Test Task ${Date.now()}`;
    const taskData = {
      title: uniqueTitle,
      description: 'Automated test task',
      hours: 5,
      skill: 'Testing'
    };
    
    await createTaskModal.fillForm(taskData);
    
    // Take screenshot before saving
    await page.screenshot({ path: 'test-results/screenshots/04-create-task-filled.png', fullPage: true });
    
    // Save task
    await createTaskModal.clickSave();
    
    // Wait for modal to refresh
    await page.waitForTimeout(3000);
    
    // Verify task was created
    const taskExists = await tasksModal.taskExists(uniqueTitle);
    expect(taskExists).toBeTruthy();
    
    // Verify statistics updated
    const newStats = await tasksModal.getStatistics();
    console.log('New stats:', newStats);
    expect(newStats.totalTasks).toBe(initialStats.totalTasks + 1);
    expect(newStats.totalHours).toBeCloseTo(initialStats.totalHours + taskData.hours, 1);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/screenshots/05-task-created.png', fullPage: true });
    
    console.log('✓ Task created successfully:', uniqueTitle);
  });
});
