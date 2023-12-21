

/**
 * Define Dev environment specific configuration.
 */
const devConfig = {
    use: {
        baseURL: process.env.BASE_URL || 'https://gendox.ctrlspace.dev',
    },
    gendox: {
        contextPath: '/gendox/api/v1',
        simpleUser: {
            username: process.env.SIMPLE_USER_USERNAME,
            password: process.env.SIMPLE_USER_PASSWORD
        },
        adminUser: {
            username: process.env.ADMIN_USER_USERNAME,
            password: process.env.ADMIN_USER_PASSWORD
        }
    },
    idp: {
        baseURL: process.env.IDP_BASE_URL || 'https://dev.gendox.ctrlspace.dev/idp',
        keycloak: {
            realm: process.env.KEYCLOAK_REALM || 'gendox-idp-dev',
            clientId: process.env.KEYCLOAK_CLIENT_ID || 'gendox-public-client'
        },
    }
}


module.exports = devConfig;