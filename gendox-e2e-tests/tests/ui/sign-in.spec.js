const { test, expect } = require('@playwright/test');
const { login } = require('../../support/login');
const config = require('../../tests.config');

// The whole path through a real stack: the frontend reads its runtime config, sends the
// browser to Keycloak, comes back with a token, and the API accepts that token. It logs
// in by itself instead of using a saved session, because it also logs out.
test('sign in and out', { tag: '@p1' }, async ({ page }) => {
    const profile = await login(page, 'testUser2');
    expect(profile.status()).toBe(200);
    await expect(page.getByRole('main').getByRole('heading', { level: 4 })).toBeVisible();

    await page.getByRole('banner').getByRole('img').click();
    await expect(page.getByRole('menu').getByText('Test User2')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    // The frontend login page immediately redirects again. Wait for the final password form.
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(url => url.href.startsWith(config.idp.baseURL));
    await page.goto(`${config.frontendURL}/gendox/home/`);
    await expect(page.locator('input[name="password"]')).toBeVisible();
});
