const config = require('../../tests.config');
const playwrightConfig = require('../../playwright.config');


const login = async (request, clientId, username, password) => {

    const response = await request.post(`${config.idp.baseURL}/realms/${config.idp.keycloak.realm}/protocol/openid-connect/token`, {
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
 * Logs in a user from config.gendox.users and returns the access token.
 *
 * @param {Request} request - The Playwright request object.
 * @param {string} name - A key of config.gendox.users, e.g. testUser1.
 */
const tokenFor = async (request, name) => {

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


