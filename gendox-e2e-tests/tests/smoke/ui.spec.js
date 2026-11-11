const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk, projectSettingsLoaded } = require('../../support/app');
const projects = require('../../page-objects/apis/projects');

test.use({ storageState: sessionOf('testUser1') });

test.describe('Browser smoke', { tag: '@smoke' }, () => {
    test('organization settings: a display name survives a reload', async ({ page, workspace }) => {
        await page.goto(inProject(workspace, 'organization-settings'));
        const name = page.getByRole('textbox', { name: 'Display Name' });
        await expect(name).toHaveValue(workspace.name);
        await name.fill(`${workspace.name} renamed`);
        const saved = apiResponse(page, 'PUT', /\/organizations\/[^/]+$/);
        // Saving reloads the page itself. Observe that navigation instead of racing a second reload.
        const reloaded = page.waitForEvent('framenavigated', frame => frame === page.mainFrame());
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expectOk(await saved);
        await reloaded;
        await expect(name).toHaveValue(`${workspace.name} renamed`);
    });

    test('API keys: create a named key and find it after a reload', async ({ page, workspace }) => {
        await page.goto(inProject(workspace, 'organization-settings'));
        await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue(workspace.name);
        await page.getByRole('tab', { name: 'ADVANCED SETTINGS' }).click();
        await page.getByRole('button', { name: 'Create a key' }).click();
        const dialog = page.getByRole('dialog', { name: 'Create a key' });
        await dialog.getByRole('textbox', { name: 'Name' }).fill('smoke key');
        await dialog.getByRole('button', { name: 'Create', exact: true }).click();
        await expect(page.getByRole('main').getByText('smoke key', { exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue(workspace.name);
        await page.getByRole('tab', { name: 'ADVANCED SETTINGS' }).click();
        await expect(page.getByRole('main').getByText('smoke key', { exact: true })).toBeVisible();
    });

    test('tasks: create Document Insights and open the saved task', async ({ page, workspace }) => {
        await page.goto(inProject(workspace, 'home'));
        await page.getByRole('button', { name: 'Create new task' }).click();
        await page.getByRole('radio', { name: /Get insights/ }).check();
        await page.getByRole('textbox', { name: 'Task Title' }).fill('Smoke insights');
        const created = apiResponse(page, 'POST', /\/tasks$/);
        await page.getByRole('button', { name: 'Create', exact: true }).click();
        await expectOk(await created);
        await page.getByRole('row', { name: /Smoke insights/ }).getByText('Smoke insights').click();
        await expect(page.getByRole('heading', { name: 'Smoke insights', exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Smoke insights', exact: true })).toBeVisible();
    });

    test.describe('project creation', () => {
        test.use({ storageState: sessionOf('testUser3'), workspaceOptions: { owner: 'testUser3', project: false } });
        test('create a project in a private organization and reach its home', async ({ page, api, workspace }) => {
            const name = `${workspace.name} project`;
            await page.goto(`/gendox/create-project/?organizationId=${workspace.organizationId}`);
            await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
            await page.getByRole('textbox', { name: 'Description' }).fill('Created by smoke');
            const created = apiResponse(page, 'POST', /\/projects$/);
            await page.getByRole('button', { name: 'Submit' }).click();
            const response = await created;
            await expectOk(response);
            const project = await response.json();
            await expect(page.getByRole('heading', { name: `${name} Project`, exact: true })).toBeVisible();
            await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
            const stored = await projects.getProjectById(api, workspace.ownerToken, workspace.organizationId, project.id);
            await expectOk(stored);
            expect(await stored.json()).toMatchObject({ name, description: 'Created by smoke' });
        });
    });

    test.describe('reader access', () => {
        test.use({ storageState: sessionOf('testUser4'), workspaceOptions: { members: { testUser4: 'ROLE_READER' } } });
        test('a reader opens a project but cannot persist a settings change', async ({ page, workspace }) => {
            await page.goto(inProject(workspace, 'project-settings'));
            await projectSettingsLoaded(page);
            await page.getByRole('textbox', { name: 'Project Description' }).fill('Reader change');
            const refused = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
            await page.getByRole('button', { name: 'Save Changes' }).click();
            expect((await refused).status()).toBe(404);
            await page.reload();
            await expect(page.getByRole('textbox', { name: 'Project Description' })).toHaveValue('Created by the tests');
        });
    });
});
