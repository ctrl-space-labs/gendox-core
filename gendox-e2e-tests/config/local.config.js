/**
 * Define Local environment specific configuration.
 */
const localConfig = {

    use: {
        baseURL: 'http://localhost:8080/gendox/api/v1',
    },
    gendox: {
        simpleUser: {
            username: 'simple-user@test.com',
            password: '123456789'
        },
        adminUser: {
            username: 'admin-user@test.com',
            password: '123456789'
        }
    },
    idp: {
        baseURL: 'https://localhost:8443/idp',
        keycloak: {
            realm: 'gendox-idp-local',
            clientId: 'gendox-public-client'
        },
    }
}

module.exports = localConfig;