const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk, projectSettingsLoaded } = require('../../support/app');
const { call, json, projectPath } = require('../../support/domain');

test.use({ storageState: sessionOf('testUser1') });
test.describe('Workspace browser regression', { tag: '@p1' }, () => {
    test('project description and auto-training changes survive reload', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'project-settings'));
        await projectSettingsLoaded(page);
        const toggle = page.getByRole('checkbox', { name: /auto.training/i });
        const checked = await toggle.isChecked();
        await toggle.setChecked(!checked);
        await page.getByRole('textbox', { name: 'Project Description' }).fill('Saved regression description');
        const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expectOk(await saved);
        await page.reload();
        await expect(page.getByRole('textbox', { name: 'Project Description' })).toHaveValue('Saved regression description');
        await expect(toggle).toBeChecked({ checked: !checked });
    });

    test('project rename persists in API and browser', async ({ page, api, workspace: w }) => {
        await page.goto(inProject(w, 'project-settings'));
        await projectSettingsLoaded(page);
        const name = `${w.name} renamed`;
        await page.getByRole('textbox', { name: 'Project Name' }).fill(name);
        const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
        await page.getByRole('button', { name: 'Save Changes' }).click();
        const response = await saved;
        await expectOk(response);
        expect(response.request().postDataJSON().name).toBe(name);
        expect((await json(await call(api, w, 'get', projectPath(w)))).name).toBe(name);
        await page.reload();
        await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(name);
    });

    test('organization address and phone survive its automatic save reload', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'organization-settings'));
        await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue(w.name);
        await page.getByRole('textbox', { name: 'Address' }).fill('Test fixture address');
        await page.getByRole('textbox', { name: /Phone/ }).fill('2100000000');
        const saved = apiResponse(page, 'PUT', /\/organizations\/[^/]+$/);
        const reloaded = page.waitForEvent('framenavigated', frame => frame === page.mainFrame());
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expectOk(await saved);
        await reloaded;
        await expect(page.getByRole('textbox', { name: 'Address' })).toHaveValue('Test fixture address');
        await expect(page.getByRole('textbox', { name: /Phone/ })).toHaveValue('2100000000');
    });

    test('invalid selected organization is corrected by the guard', { tag: '@p2' }, async ({ page, workspace: w }) => {
        await page.addInitScript(() => {
            localStorage.setItem('selectedOrganizationId', '00000000-0000-0000-0000-000000000000');
            localStorage.setItem('selectedProjectId', '00000000-0000-0000-0000-000000000000');
        });
        await page.goto(inProject(w, 'home'));
        await expect(page.getByRole('heading', { name: `${w.name} project Project`, exact: true })).toBeVisible();
        expect(new URL(page.url()).searchParams.get('organizationId')).toBe(w.organizationId);
    });

    test('narrow viewport keeps document upload and project navigation usable', { tag: '@p2' }, async ({ page, workspace: w }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(inProject(w, 'home'));
        await expect(page.getByRole('heading', { name: `${w.name} project Project`, exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'UPLOAD DOCUMENT' }).click();
        await expect(page.getByText('Maximum file size')).toBeVisible();
        await page.getByRole('button', { name: 'close', exact: true }).click();
        await expect(page.getByText('Maximum file size')).not.toBeVisible();
    });
});
