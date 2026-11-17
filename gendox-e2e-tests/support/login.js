const path = require('path');
const config = require('../tests.config');

/**
 * Logs a seeded user in through the frontend and Keycloak, the way a person does,
 * and waits until the application has loaded the user's profile.
 */
const login = async (page, name) => {
    const user = config.gendox.users[name];
    await page.goto(config.frontendURL);
    await page.waitForURL(url => url.href.startsWith(config.idp.baseURL));
    await page.locator('input[name="username"]').fill(user.username);
    const password = page.locator('input[name="password"]');
    const submit = page.locator('input[type="submit"], button[type="submit"]').first();
    // Keycloak may show both fields together, or ask for the username before the password.
    if (!await password.isVisible()) {
        await submit.click();
    }
    await password.fill(user.password);

    const [response] = await Promise.all([
        page.waitForResponse(
            response => response.url().endsWith(`${config.gendox.contextPath}/profile`) && response.request().method() === 'GET'
        ),
        submit.click(),
    ]);
    await page.waitForURL(url => url.href.startsWith(config.frontendURL) && url.pathname.startsWith('/gendox/'));
    return response;
};

// Where the setup project saves each user's session, for test.use({ storageState }).
const sessionOf = (name) => path.join(config.authDir, `${name}.json`);

module.exports = { login, sessionOf };
