const { test: setup, expect } = require('@playwright/test');
const config = require('../../tests.config');
const { login, sessionOf } = require('../../support/login');

// Runs before the ui project. Each user logs in once, and the browser tests
// start from the saved session instead of logging in again:
//
//   test.use({ storageState: sessionOf('testUser1') });
//
// With E2E_TOKEN_SOURCE=browser the API tests take their tokens from these sessions
// too, so the outsider logs in as well.
const names = ['testUser1', 'testUser2', 'testUser3', 'testUser4',
    ...(config.idp.tokenSource === 'browser' ? ['outsider'] : [])];
for (const name of names) {
    setup(`log in ${name}`, async ({ page }) => {
        const profile = await login(page, name);
        expect(profile.status()).toBe(200);
        await page.context().storageState({ path: sessionOf(name) });
    });
}
