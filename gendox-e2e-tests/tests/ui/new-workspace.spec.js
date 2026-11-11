const { test, expect, tokenFor } = require('../../support/workspace');
const { login } = require('../../support/login');
const { apiResponse, expectOk } = require('../../support/app');
const organizations = require('../../page-objects/apis/organizations');

// This identity creates no other workspaces in the suite, avoiding shared profile refresh races.
test('new workspace: create organization and project through the browser', { tag: '@p1' }, async ({ page, api }) => {
    await expectOk(await login(page, 'outsider'));
    const name = `e2e workspace ${require('crypto').randomUUID().slice(0, 8)}`;
    await page.goto('/gendox/create-organization/');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await page.getByRole('textbox', { name: 'displayName' }).fill(name);
    const created = apiResponse(page, 'POST', /\/organizations$/);
    await page.getByRole('button', { name: 'Submit' }).click();
    const response = await created;
    await expectOk(response);
    const organizationId = (await response.json()).id;
    const kept = { type: 'kept organization', description: `${name} (${organizationId})` };
    test.info().annotations.push(kept);
    await page.waitForURL(/\/gendox\/create-project\//);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${name} project`);
    await page.getByRole('textbox', { name: 'Description' }).fill('Created in the browser');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('heading', { name: `${name} project Project` })).toBeVisible();
    await expect(page.getByRole('link', { name: `${name} project`, exact: true })).toBeVisible();
    await organizations.deactivateOrganization(api, await tokenFor(api, 'outsider'), organizationId);
    test.info().annotations.splice(test.info().annotations.indexOf(kept), 1);
});
