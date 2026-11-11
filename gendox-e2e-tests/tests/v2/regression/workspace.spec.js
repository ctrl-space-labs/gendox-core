const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { inProject, apiResponse, expectOk } = require('../../../support/app');
const { field, section } = require('../../../support/v2/app');
const { call, json, projectPath, createTask } = require('../../../support/domain');

test.use({ storageState: sessionOf('testUser1') });
test.describe('V2 workspace persistence', { tag: '@p1' }, () => {
    test('description and automatic processing survive reload', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'agent-settings'));
        const description = page.getByRole('textbox', { name: 'Description', exact: true });
        await expect(description).toHaveValue('Created by the tests');
        await description.fill('V2 saved description');
        const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expectOk(await saved);
        const toggle = page.getByRole('switch', { name: 'Process new documents automatically', exact: true });
        const checked = await toggle.getAttribute('aria-checked');
        const toggled = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
        await toggle.click();
        await expectOk(await toggled);
        await page.reload();
        await expect(description).toHaveValue('V2 saved description');
        await expect(toggle).toHaveAttribute('aria-checked', checked === 'true' ? 'false' : 'true');
    });

    test('agent rename persists in the API and browser', async ({ page, api, workspace: w }) => {
        await page.goto(inProject(w, 'agent-settings'));
        const name = `${w.name} renamed`;
        await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${w.name} project`);
        await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
        const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expectOk(await saved);
        expect((await json(await call(api, w, 'get', projectPath(w)))).name).toBe(name);
        await page.reload();
        await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(name);
    });

    test('organization address and phone persist', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'organization-settings'));
        await expect(field(page, 'Legal name')).toHaveValue(w.name);
        await field(page, 'Address').fill('Test fixture address');
        await field(page, 'Phone').fill('2100000000');
        const saved = apiResponse(page, 'PUT', /\/organizations\/[^/]+$/);
        await section(page, 'Invoice details').getByRole('button', { name: 'Save', exact: true }).click();
        await expectOk(await saved);
        await page.reload();
        await expect(field(page, 'Address')).toHaveValue('Test fixture address');
        await expect(field(page, 'Phone')).toHaveValue('2100000000');
    });

    test('guard corrects stale selected IDs on a valid deep link', { tag: '@p2' }, async ({ page, workspace: w }) => {
        await page.addInitScript(() => {
            localStorage.setItem('selectedOrganizationId', '00000000-0000-0000-0000-000000000000');
            localStorage.setItem('selectedProjectId', '00000000-0000-0000-0000-000000000000');
        });
        await page.goto(inProject(w, 'agent-settings'));
        await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${w.name} project`);
        expect(new URL(page.url()).searchParams.get('organizationId')).toBe(w.organizationId);
        expect(new URL(page.url()).searchParams.get('projectId')).toBe(w.projectId);
    });

    test('narrow viewport keeps knowledge upload usable', { tag: '@p2' }, async ({ page, workspace: w }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(inProject(w, 'knowledge'));
        await page.getByRole('button', { name: 'Upload files', exact: true }).first().click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('heading', { name: 'Upload files', exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
        await expect(dialog).toHaveCount(0);
    });
});

test.describe('V2 task management', { tag: '@p2' }, () => {
    test('edit task name and reload the list', async ({ page, api, workspace: w }) => {
        await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Task before edit');
        await page.goto(inProject(w, 'tasks'));
        await page.getByRole('row', { name: /Task before edit/ }).getByRole('button', { name: 'More', exact: true }).click();
        await page.getByRole('button', { name: 'Edit', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Task after edit');
        const saved = apiResponse(page, 'PUT', /\/tasks\/[^/]+$/);
        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await expectOk(await saved);
        await page.reload();
        await expect(page.getByRole('row', { name: /Task after edit/ })).toBeVisible();
    });

    test('cancel task deletion leaves the task available', async ({ page, api, workspace: w }) => {
        await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Keep this task');
        await page.goto(inProject(w, 'tasks'));
        await page.getByRole('row', { name: /Keep this task/ }).getByRole('button', { name: 'More', exact: true }).click();
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
        await page.reload();
        await expect(page.getByRole('row', { name: /Keep this task/ })).toBeVisible();
    });
});
