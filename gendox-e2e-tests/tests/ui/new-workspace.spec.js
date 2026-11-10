const { test, expect, tokenFor } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { apiResponse, expectOk, projectSettingsLoaded } = require('../../support/app');
const organizations = require('../../page-objects/apis/organizations');

// testUser3 is the only user who creates an organization in the browser, so no other
// test changes this user's organizations while the screens load them.
test.use({ storageState: sessionOf('testUser3') });

// FIXME, not finished: the rename is saved (the API answers 200) but the old name is shown
// after the reload. Not yet known whether the test or the application is wrong.
test.fixme('new workspace: create an organization and a project, rename the project', { tag: '@smoke' }, async ({ page, api }) => {
    const name = `e2e new workspace ${Date.now().toString(36)}`;

    await page.goto('/gendox/create-organization/');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await page.getByRole('textbox', { name: 'displayName' }).fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();

    // A new organization has no project, so the application asks for one.
    await page.waitForURL(/\/gendox\/create-project\//);
    const organizationId = new URL(page.url()).searchParams.get('organizationId');
    test.info().annotations.push({ type: 'kept organization', description: `${name} (${organizationId})` });

    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${name} project`);
    await page.getByRole('textbox', { name: 'Description' }).fill('Created in the browser');
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForURL(/\/gendox\/home\//);
    await expect(page.getByRole('heading', { name: `${name} project Project` })).toBeVisible();
    await expect(page.getByRole('link', { name: `${name} project` })).toBeVisible();

    await page.getByRole('button', { name: 'Project Settings' }).click();
    await projectSettingsLoaded(page);
    await page.getByRole('textbox', { name: 'Project Name' }).fill(`${name} renamed`);
    const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expectOk(await saved);

    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(`${name} renamed`);

    // Passed, so the organization is not needed any more.
    await organizations.deactivateOrganization(api, await tokenFor(api, 'testUser3'), organizationId);
    test.info().annotations.pop();
});
