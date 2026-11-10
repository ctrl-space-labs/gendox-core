const { test, expect, createWorkspace, removeWorkspace } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, projectSettingsLoaded, textFile } = require('../../support/app');
const documents = require('../../page-objects/apis/documents');

test.use({
    storageState: sessionOf('testUser1'),
    workspaceOptions: { members: { testUser4: 'ROLE_READER' } },
});

// Members are added through the API: the application adds them by email invitation,
// and this environment has no mail server.
test('members and roles: a reader is listed, can read, cannot change, cannot enter another organization', { tag: '@smoke' }, async ({ page, browser, api, workspace }) => {
    await documents.uploadDocument(api, workspace.ownerToken, workspace.organizationId, workspace.projectId, textFile);

    // The owner sees the reader in both member lists.
    await page.goto(inProject(workspace, 'organization-settings'));
    await page.getByRole('tab', { name: 'MEMBERS' }).click();
    await expect(page.getByRole('row', { name: /testuser4@test\.com Read Only/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /testuser1@test\.com Owner/ })).toBeVisible();

    await page.goto(inProject(workspace, 'project-settings'));
    await projectSettingsLoaded(page);
    await page.getByRole('tab', { name: 'MEMBERS' }).click();
    await expect(page.getByRole('row', { name: /testuser4@test\.com Read Only/ })).toBeVisible();

    // The reader, in a browser session of their own.
    const context = await browser.newContext({ storageState: sessionOf('testUser4') });
    const reader = await context.newPage();
    try {
        await reader.goto(inProject(workspace, 'home'));
        await expect(reader.getByRole('link', { name: 'least-squares' })).toBeVisible();

        await reader.goto(inProject(workspace, 'project-settings'));
        await projectSettingsLoaded(reader);
        await reader.getByRole('textbox', { name: 'Project Description' }).fill('Changed by a reader');
        const refused = apiResponse(reader, 'PUT', /\/projects\/[^/]+$/);
        await reader.getByRole('button', { name: 'Save Changes' }).click();
        // Access denied is answered as not found, so it does not reveal what exists.
        expect((await refused).status()).toBe(404);
        await reader.reload();
        await expect(reader.getByRole('textbox', { name: 'Project Description' })).toHaveValue('Created by the tests');

        // An organization the reader is not a member of.
        const foreign = await createWorkspace(api, 'members foreign', { owner: 'testUser2' });
        await reader.goto(inProject(foreign, 'home'));
        await reader.waitForURL(/\/404\//);
        await removeWorkspace(api, foreign);
    } finally {
        await context.close();
    }
});
