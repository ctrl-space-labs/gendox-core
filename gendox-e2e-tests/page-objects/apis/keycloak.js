const fs = require('fs');
const config = require('../../tests.config');


const tokenEndpoint = () => `${config.idp.baseURL}/realms/${config.idp.keycloak.realm}/protocol/openid-connect/token`;

const login = async (request, clientId, username, password) => {

    const response = await request.post(tokenEndpoint(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: 'password',
            client_id: clientId,
            username: username,
            password: password,
            scope: 'openid email'
        }
    });
    return response;
};

const simpleUserLogin = async (request) => {

    return login(request, config.idp.keycloak.clientId, config.gendox.simpleUser.username, config.gendox.simpleUser.password);
}


/**
 * E2E_TOKEN_SOURCE=browser: for a realm whose clients do not allow the password grant.
 * The setup project logs the user in through the browser and saves the session, which
 * holds the frontend's OIDC user (oidc-client-ts, in localStorage). Its refresh token
 * gives a new access token, the way the frontend renews its own.
 */
const tokenFromBrowserSession = async (request, name) => {
    const { sessionOf } = require('../../support/login');
    const file = sessionOf(name);
    if (!fs.existsSync(file)) {
        throw new Error(`No browser session for ${name} in ${file}. With E2E_TOKEN_SOURCE=browser the setup project must run first.`);
    }
    const items = JSON.parse(fs.readFileSync(file, 'utf8')).origins.flatMap(origin => origin.localStorage);
    const item = items.find(entry => entry.name.startsWith('oidc.user:'));
    if (!item) throw new Error(`The browser session of ${name} holds no OIDC user.`);
    const clientId = item.name.slice(item.name.lastIndexOf(':') + 1);
    const response = await request.post(tokenEndpoint(), {
        form: { grant_type: 'refresh_token', client_id: clientId, refresh_token: JSON.parse(item.value).refresh_token },
    });
    if (!response.ok()) {
        throw new Error(`Refreshing the browser session of ${name} failed: ${response.status()} ${(await response.text()).slice(0, 300)}`);
    }
    return (await response.json()).access_token;
};


/**
 * Logs in a user from config.gendox.users and returns the access token.
 *
 * @param {Request} request - The Playwright request object.
 * @param {string} name - A key of config.gendox.users, e.g. testUser1.
 */
const tokenFor = async (request, name) => {

    if (config.idp.tokenSource === 'browser') return tokenFromBrowserSession(request, name);
    const user = config.gendox.users[name];
    const response = await login(request, config.idp.keycloak.clientId, user.username, user.password);
    if (!response.ok()) {
        throw new Error(`Login failed for ${user.username}: ${response.status()}`);
    }
    return (await response.json()).access_token;
}


module.exports = {
    login,
    simpleUserLogin,
    tokenFor
}
