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


module.exports = {
    login,
    simpleUserLogin
}


