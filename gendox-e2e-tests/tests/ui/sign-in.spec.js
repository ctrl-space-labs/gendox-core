const { test, expect } = require('@playwright/test');
const { login } = require('../../support/login');
const config = require('../../tests.config');

// The whole path through a real stack: the frontend reads its runtime config, sends the
// browser to Keycloak, comes back with a token, and the API accepts that token. It logs
// in by itself instead of using a saved session, because it also logs out.
// FIXME, unreliable: the log in part works (the setup project uses the same steps), but
// after logout the next navigation often races with Keycloak's redirects. See NOTES.md.
test.fixme('sign in and out', { tag: '@smoke' }, async ({ page }) => {
    const profile = await login(page, 'testUser2');
    expect(profile.status()).toBe(200);
    await expect(page.getByRole('main').getByRole('heading', { level: 4 })).toBeVisible();

    await page.getByRole('banner').getByRole('img').click();
    await expect(page.getByRole('menu').getByText('Test User2')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    // Keycloak ends the session and sends the browser back to the login page. Wait for
    // that chain of redirects to finish before navigating again.
    await page.waitForURL(url => url.href.startsWith(config.frontendURL) && url.pathname.startsWith('/login'));
    await page.waitForLoadState('load');

    // The session is over: the application asks for the password again.
    await page.goto(`${config.frontendURL}/gendox/home/`);
    await page.waitForURL(url => url.href.startsWith(config.idp.baseURL));
    await expect(page.locator('input[name="username"]')).toBeVisible();
});
