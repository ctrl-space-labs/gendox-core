const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, projectSettingsLoaded, textFile } = require('../../support/app');
const documents = require('../../page-objects/apis/documents');

test.use({ storageState: sessionOf('testUser1') });

// Not a smoke test: training is a background job the API picks up on a schedule.
// FIXME, never run: how long the background job takes here is not measured yet.
test.fixme('training: the Training button splits the uploaded documents into sections', async ({ page, api, workspace }) => {
    test.setTimeout(240_000);
    await documents.uploadDocument(api, workspace.ownerToken, workspace.organizationId, workspace.projectId, textFile);

    await page.goto(inProject(workspace, 'project-settings'));
    await projectSettingsLoaded(page);
    await page.getByRole('button', { name: /training manually/i }).click();
    await expect(page.getByText('Training triggered successfully!')).toBeVisible();

    await page.goto(inProject(workspace, 'home'));
    await page.getByRole('link', { name: 'least-squares' }).click();
    await expect(page.getByRole('heading', { name: 'least-squares Document' })).toBeVisible();
    await expect(async () => {
        await page.reload();
        await expect(page.getByRole('main').getByText(/least squares/i).first()).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 200_000, intervals: [3000] });
});
