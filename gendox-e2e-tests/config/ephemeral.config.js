const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { devices } = require('@playwright/test');

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

const apiBaseURL = url('E2E_API_BASE_URL', 'EPH_API_PORT');
const frontendURL = url('E2E_FRONTEND_URL', 'EPH_FRONTEND_PORT');
const keycloakURL = process.env.E2E_KEYCLOAK_URL || `${url('E2E_KEYCLOAK_URL', 'EPH_KEYCLOAK_PORT')}/idp`;

process.env.E2E_RUN_ID ||= require('crypto').randomUUID();
const authDir = path.resolve(__dirname, '../.auth', process.env.E2E_RUN_ID);
const browser = { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined };

const ephemeralConfig = {
    testDir: './tests',
    // chat-streaming has its own config and mock server, example.spec.js is Playwright's sample.
    testIgnore: ['chat-streaming/**', 'example.spec.js'],
    // Every test that changes data works in its own organization (support/workspace.js),
    // so files and tests can all run at the same time.
    fullyParallel: true,
    workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 8,
    forbidOnly: !!process.env.CI,
    retries: 0,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    globalSetup: require.resolve('../support/global-setup.js'),
    // In a terminal: one line per test. For an agent or CI: dots, then the summary and
    // the failures from the history reporter, to keep the output short.
    reporter: [
        [process.stdout.isTTY ? 'list' : 'dot'],
        ['html', { open: 'never' }],
        ['./support/history-reporter.js'],
    ],
    use: {
        baseURL: apiBaseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        // Logs each seeded user in once and saves the session for the ui project.
        { name: 'setup', testMatch: 'ui/auth.setup.js', use: browser },
        { name: 'api', testMatch: ['api-tests/**/*.spec.js', 'smoke/api.spec.js'] },
        {
            name: 'ui',
            testMatch: ['ui/**/*.spec.js', 'smoke/ui.spec.js'],
            dependencies: ['setup'],
            use: { ...browser, baseURL: frontendURL },
        },
    ],
    frontendURL,
    authDir,
    gendox: {
        contextPath: '/gendox/api/v1',
        // Seeded by the test-data migrations and in the realm of the ephemeral stack.
        simpleUser: {
            username: 'testuser1@test.com',
            password: '123456789',
        },
        adminUser: {
            username: 'testuser2@test.com',
            password: '123456789',
        },
        // Their ids and seeded roles are listed in page-objects/apis/seed.js.
        users: {
            testUser1: { username: 'testuser1@test.com', password: '123456789' },
            testUser2: { username: 'testuser2@test.com', password: '123456789' },
            testUser3: { username: 'testuser3@test.com', password: '123456789' },
            testUser4: { username: 'testuser4@test.com', password: '123456789' },
            // In the realm, but in no seeded organization.
            outsider: { username: 'model-test@test.com', password: '123456789' },
        },
    },
    idp: {
        baseURL: keycloakURL,
        keycloak: {
            realm: process.env.E2E_REALM || 'gendox-idp-prod',
            clientId: process.env.E2E_CLIENT_ID || 'gendox-dev-test-client',
        },
    },
};

module.exports = ephemeralConfig;
