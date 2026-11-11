const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk } = require('../../support/app');
const { createTask } = require('../../support/domain');

test.use({ storageState: sessionOf('testUser1') });
test.describe('Task browser management', { tag: '@p2' }, () => {
    test('edit a task title and reload the task list', async ({ page, api, workspace: w }) => {
        await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Task before edit');
        await page.goto(inProject(w, 'home'));
        const row = page.getByRole('row', { name: /Task before edit/ });
        const edit = page.getByRole('menuitem', { name: /Edit/ });
        await expect(async () => {
            if (!await edit.isVisible()) await row.getByRole('button', { name: 'task actions' }).click();
            await expect(edit).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 5000 });
        await edit.click();
        await page.getByRole('textbox', { name: 'Task Title' }).fill('Task after edit');
        const saved = apiResponse(page, 'PUT', /\/tasks\/[^/]+$/);
        await page.getByRole('button', { name: /Save|Update/, exact: false }).last().click();
        await expectOk(await saved);
        await page.reload();
        await expect(page.getByRole('row', { name: /Task after edit/ })).toBeVisible();
    });

    test('cancel task deletion leaves the task available', async ({ page, api, workspace: w }) => {
        await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Keep this task');
        await page.goto(inProject(w, 'home'));
        const menuItem = page.getByRole('menuitem', { name: 'Delete Task' });
        await expect(async () => {
            if (!await menuItem.isVisible()) await page.getByRole('row', { name: /Keep this task/ }).getByRole('button', { name: 'task actions' }).click();
            await expect(menuItem).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 5000 });
        await menuItem.click();
        const dialog = page.getByRole('dialog', { name: 'Confirm Task Deletion' });
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('row', { name: /Keep this task/ })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('row', { name: /Keep this task/ })).toBeVisible();
    });
});
