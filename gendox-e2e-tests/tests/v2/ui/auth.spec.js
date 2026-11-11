const { test, expect, tokenFor } = require('../../../support/workspace');
const { login, sessionOf } = require('../../../support/login');
const { inProject, apiResponse, expectOk } = require('../../../support/app');
const config = require('../../../tests.config');
const organizations = require('../../../page-objects/apis/organizations');

test.describe('V2 isolated authentication', () => {
    test.use({ workspaceOptions: { owner: 'testUser2' } });
    test('V2 sign in, sign out and protect a deep link', { tag: '@p1' }, async ({ page, workspace: w }) => {
        await expectOk(await login(page, 'testUser2'));
        await page.goto(inProject(w, 'user-profile'));
        await expect(page.getByRole('heading', { name: 'Test User2', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Sign out', exact: true }).click();
        await expect(page.locator('input[name=password]')).toBeVisible({ timeout: 20_000 });
        await page.goto(inProject(w, 'agent-home'));
        await expect(page.locator('input[name=password]')).toBeVisible();
    });
});

test('V2 invalid password shows the Keycloak validation error', { tag: '@p1' }, async ({ page }) => {
    await page.goto(config.frontendURL);
    await page.locator('input[name=username]').fill(config.gendox.users.testUser1.username);
    await page.locator('input[name=password]').fill('wrong-e2e-password');
    await page.locator('input[type=submit], button[type=submit]').first().click();
    await expect(page.getByText('Invalid username or password.', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(url => url.href.startsWith(config.idp.baseURL));
});

test.describe('V2 saved session', () => {
    test.use({ storageState: sessionOf('testUser1') });
    test('deep link and reload retain the selected agent', { tag: '@p1' }, async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'agent-settings'));
        await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${w.name} project`);
        await page.reload();
        await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${w.name} project`);
    });
});

test('V2 create an organization and its first agent in the browser', { tag: '@p1' }, async ({ page, api }) => {
    await expectOk(await login(page, 'outsider'));
    const name = `e2e workspace ${require('crypto').randomUUID().slice(0, 8)}`;
    await page.goto('/gendox/create-organization/');
    await page.getByRole('textbox', { name: 'Organization name', exact: true }).fill(name);
    const created = apiResponse(page, 'POST', /\/organizations$/);
    await page.getByRole('button', { name: 'Create organization', exact: true }).click();
    const response = await created;
    await expectOk(response);
    const organizationId = (await response.json()).id;
    const kept = { type: 'kept organization', description: `${name} (${organizationId})` };
    test.info().annotations.push(kept);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${name} agent`);
    await page.getByRole('button', { name: 'Create agent', exact: true }).click();
    await expect(page.getByRole('heading', { name: `${name} agent is ready`, exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Skip for now', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible();
    await expectOk(await organizations.deactivateOrganization(api, await tokenFor(api, 'outsider'), organizationId));
    test.info().annotations.splice(test.info().annotations.indexOf(kept), 1);
});
