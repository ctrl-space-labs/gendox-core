const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk, textFile } = require('../../support/app');
const documents = require('../../page-objects/apis/documents');

test.use({ storageState: sessionOf('testUser1') });

// FIXME, not finished: written up to the "Select Project Documents" dialog of the task.
// Adding the document and a question, and running the task, are still to do.
test.fixme('organization settings and insights: rename, create an API key, run a Document Insights task', async ({ page, api, workspace }) => {
    await documents.uploadDocument(api, workspace.ownerToken, workspace.organizationId, workspace.projectId, textFile);
    await documents.splitDocumentSections(api, workspace.ownerToken, workspace.organizationId, workspace.projectId);

    // General: the display name.
    await page.goto(inProject(workspace, 'organization-settings'));
    await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue(workspace.name);
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Renamed in the browser');
    const saved = apiResponse(page, 'PUT', /\/organizations\/[^/]+$/);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expectOk(await saved);
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue('Renamed in the browser');
    await expect(page.getByRole('textbox', { name: 'Subscription Plan Name' })).toHaveValue('Free Plan');

    // Advanced: an API key.
    await page.getByRole('tab', { name: 'ADVANCED SETTINGS' }).click();
    await page.getByRole('button', { name: 'Create a key' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create a key' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('e2e key');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByRole('main').getByText('e2e key')).toBeVisible();

    // A Document Insights task.
    await page.goto(inProject(workspace, 'home'));
    await page.getByRole('button', { name: 'Create new task' }).click();
    await page.getByRole('radio', { name: /Get insights/ }).check();
    await page.getByRole('textbox', { name: 'Task Title' }).fill('Insights by a test');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('row', { name: /Insights by a test/ }).getByText('Insights by a test').click();
    await expect(page.getByRole('heading', { name: 'Insights by a test' })).toBeVisible();

    await page.getByRole('button', { name: 'Add Document' }).click();
    await expect(page.getByText('TODO after add document')).toBeVisible({ timeout: 3000 });
});
