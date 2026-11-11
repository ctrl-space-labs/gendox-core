const { test: setup, expect } = require('@playwright/test');
const { login, sessionOf } = require('../../support/login');

// Runs before the ui project. Each seeded user logs in once, and the browser tests
// start from the saved session instead of logging in again:
//
//   test.use({ storageState: sessionOf('testUser1') });
for (const name of ['testUser1', 'testUser2', 'testUser3', 'testUser4']) {
    setup(`log in ${name}`, async ({ page }) => {
        const profile = await login(page, name);
        expect(profile.status()).toBe(200);
        await page.context().storageState({ path: sessionOf(name) });
    });
}
