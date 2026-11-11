const { test, expect } = require('../../support/workspace');
const { sessionOf, login } = require('../../support/login');
const config = require('../../tests.config');
const { inProject } = require('../../support/app');

test.describe('Authentication browser regression', { tag: '@p1' }, () => {
    test('invalid password stays at Keycloak and shows a validation error', async ({ page }) => {
        await page.goto(config.frontendURL);
        await page.locator('input[name="username"]').fill(config.gendox.users.testUser2.username);
        await page.locator('input[name="password"]').fill('this-is-not-a-valid-password');
        await page.locator('input[type="submit"],button[type="submit"]').first().click();
        await expect(page.getByText(/invalid username or password/i)).toBeVisible();
        await expect(page).toHaveURL(url => url.href.startsWith(config.idp.baseURL));
    });
    test.describe('saved session', () => {
        test.use({ storageState: sessionOf('testUser1') });
        test('protected deep link and reload retain the selected project', async ({ page, workspace: w }) => {
            await page.goto(inProject(w, 'project-settings'));
            await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(`${w.name} project`);
            await page.reload();
            await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(`${w.name} project`);
            await expect(page).toHaveURL(/project-settings/);
        });
    });
});
