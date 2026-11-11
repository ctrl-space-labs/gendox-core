const path = require('path');
const config = require('../tests.config');

/**
 * Logs a seeded user in through the frontend and Keycloak, the way a person does,
 * and waits until the application has loaded the user's profile.
 */
const login = async (page, name) => {
    const user = config.gendox.users[name];
    const profile = page.waitForResponse(
        response => response.url().endsWith(`${config.gendox.contextPath}/profile`) && response.request().method() === 'GET'
    );

    await page.goto(config.frontendURL);
    await page.waitForURL(url => url.href.startsWith(config.idp.baseURL));
    await page.locator('input[name="username"]').fill(user.username);
    await page.locator('input[name="password"]').fill(user.password);
    await page.locator('input[type="submit"], button[type="submit"]').first().click();

    const response = await profile;
    await page.waitForURL(url => url.href.startsWith(config.frontendURL) && url.pathname.startsWith('/gendox/'));
    return response;
};

// Where the setup project saves each user's session, for test.use({ storageState }).
const sessionOf = (name) => path.join(config.authDir, `${name}.json`);

module.exports = { login, sessionOf };
