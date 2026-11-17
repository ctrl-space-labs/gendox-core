const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const frontend = require('./frontend');
const { buildConfig } = require('./suite');

/**
 * The default configuration: this checkout's ephemeral environment, see
 * gendox-compose-scripts/ephemeral. Its ports are read from the .env beside the
 * compose file, so there is nothing to pass in. E2E_* variables override them, to
 * point the tests at an environment started some other way.
 */
const stackEnvFile = path.resolve(__dirname, '../../gendox-compose-scripts/ephemeral/.env');
const stack = fs.existsSync(stackEnvFile) ? dotenv.parse(fs.readFileSync(stackEnvFile)) : {};

const url = (override, port) => {
    if (process.env[override]) return process.env[override];
    if (!stack[port]) {
        throw new Error(
            `No ephemeral environment for this checkout: ${port} is not in ${stackEnvFile}.\n` +
            'In gendox-compose-scripts/ephemeral run: ./init-env.sh && docker compose up -d --wait'
        );
    }
    return `http://localhost:${stack[port]}`;
};

const streamingPort = frontend.version === 'v2' ? Number(process.env.E2E_STREAMING_PORT || (Number(stack.EPH_FRONTEND_PORT || 3100) + 32000)) : 3520;
if (frontend.version === 'v2') process.env.E2E_STREAMING_PORT = String(streamingPort);
const streamingURL = `http://127.0.0.1:${streamingPort}`;

module.exports = buildConfig({
    apiBaseURL: url('E2E_API_BASE_URL', 'EPH_API_PORT'),
    frontendURL: url('E2E_FRONTEND_URL', 'EPH_FRONTEND_PORT'),
    keycloakURL: process.env.E2E_KEYCLOAK_URL || `${url('E2E_KEYCLOAK_URL', 'EPH_KEYCLOAK_PORT')}/idp`,
    realm: process.env.E2E_REALM || 'gendox-idp-prod',
    clientId: process.env.E2E_CLIENT_ID || 'gendox-dev-test-client',
    // Seeded by the test-data migrations and in the realm of the ephemeral stack.
    // Their ids and seeded roles are listed in page-objects/apis/seed.js.
    users: {
        testUser1: { username: 'testuser1@test.com', password: '123456789' },
        testUser2: { username: 'testuser2@test.com', password: '123456789' },
        testUser3: { username: 'testuser3@test.com', password: '123456789' },
        testUser4: { username: 'testuser4@test.com', password: '123456789' },
        // In the realm, but in no seeded organization.
        outsider: { username: 'model-test@test.com', password: '123456789' },
    },
    streaming: {
        url: streamingURL,
        webServer: {
            command: frontend.version === 'v2' ? 'node fixtures/v2/chat-streaming-server.cjs' : 'node fixtures/chat-streaming-server.cjs',
            url: `${streamingURL}/__state`,
            reuseExistingServer: false,
        },
    },
});
