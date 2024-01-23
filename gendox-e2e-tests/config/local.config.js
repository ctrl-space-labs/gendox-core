/**
 * Define Local environment specific configuration.
 */
const localConfig = {

    use: {
        baseURL: 'http://localhost:8080',
    },
    gendox: {
        contextPath: '/gendox/api/v1',
        simpleUser: {
            username: 'testuser1@test.com',
            password: 'MCfikYOrlvlZnJ0'
        },
        adminUser: {
            username: 'admin-user@test.com',
            password: '123456789'
        }
    },
    idp: {
        baseURL: 'https://dev.gendox.ctrlspace.dev/idp',
        keycloak: {
            realm: 'gendox-idp-dev',
            clientId: 'gendox-public-client'
        },
    }
}

module.exports = localConfig;