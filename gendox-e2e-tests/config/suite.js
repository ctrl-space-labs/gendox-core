const path = require('path');
const { devices } = require('@playwright/test');
const frontend = require('./frontend');
const target = require('./target');
const models = require('./models');

/**
 * The suite's configuration for one environment. config/ephemeral.config.js and
 * config/deployed.config.js only say where the environment is and who logs in;
 * this file decides everything else from the target and the model tier.
 *
 *   environment.apiBaseURL, frontendURL, keycloakURL, realm, clientId
 *   environment.users      testUser1..testUser4 and outsider: { username, password }
 *   environment.streaming  the local mock streaming server, or undefined
 */
const buildConfig = (environment) => {
    const { apiBaseURL, frontendURL, keycloakURL, users, streaming } = environment;
    const deployed = target.deployed;
    const tokenSource = (process.env.E2E_TOKEN_SOURCE || 'password').toLowerCase();
    if (!['password', 'browser'].includes(tokenSource)) {
        throw new Error(`E2E_TOKEN_SOURCE=${tokenSource}: use password or browser`);
    }

    process.env.E2E_RUN_ID ||= require('crypto').randomUUID();
    const authDir = path.resolve(__dirname, '../.auth', process.env.E2E_RUN_ID);
    const browser = { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined };
    // With browser tokens, API tests take their tokens from the sessions the setup project saves.
    const apiDependencies = tokenSource === 'browser' ? ['setup'] : [];

    // One project per provider of the tier, so the providers run in parallel.
    const llmProjects = models.profilesFor(target.models).map(profile => ({
        name: `llm-${profile.provider}`,
        testMatch: 'llm/**/*.spec.js',
        dependencies: apiDependencies,
        // Real models answer slowly and not always alike: more time, and one more try.
        timeout: target.realModels ? 240_000 : 60_000,
        retries: target.realModels ? 1 : 0,
        use: { modelProfile: profile },
    }));

    return {
        testDir: './tests',
        // chat-streaming has its own config and mock server, example.spec.js is Playwright's sample.
        testIgnore: ['chat-streaming/**', 'example.spec.js'],
        // A deployed environment runs the smoke suite only: the rest of the suite relies
        // on seeded data and is not written to clean up after itself.
        ...(deployed ? { grep: /@smoke/ } : {}),
        // Every test that changes data works in its own organization (support/workspace.js),
        // so files and tests can all run at the same time. Fewer at once on a shared environment.
        fullyParallel: true,
        workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : (deployed ? 4 : 8),
        forbidOnly: !!process.env.CI,
        retries: 0,
        timeout: deployed ? 120_000 : 60_000,
        expect: { timeout: deployed ? 20_000 : 10_000 },
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
            actionTimeout: deployed ? 20_000 : 10_000,
            navigationTimeout: deployed ? 30_000 : 15_000,
        },
        projects: [
            // Logs each user in once and saves the session for the browser tests.
            // The deployed @smoke filter must not filter out the logins.
            { name: 'setup', testMatch: 'ui/auth.setup.js', grep: /.*/, use: browser },
            {
                name: 'api',
                testMatch: ['api-tests/**/*.spec.js', 'smoke/api.spec.js', 'regression/**/*.api.spec.js'],
                dependencies: apiDependencies,
            },
            {
                name: 'ui',
                workers: process.env.E2E_UI_WORKERS ? Number(process.env.E2E_UI_WORKERS) : (deployed ? 2 : 4),
                testMatch: frontend.version === 'v2'
                    ? ['v2/ui/**/*.spec.js', 'v2/smoke/**/*.spec.js', 'v2/regression/**/*.spec.js']
                    : ['ui/**/*.spec.js', 'smoke/ui.spec.js', 'regression/**/*.ui.spec.js']
                        .map(pattern => path.resolve(__dirname, '../tests', pattern)),
                dependencies: ['setup'],
                use: { ...browser, baseURL: frontendURL },
            },
            ...llmProjects,
            ...(streaming ? [{
                name: 'streaming-contract',
                testDir: path.resolve(__dirname, frontend.version === 'v2' ? '../tests/v2/streaming' : '../tests/chat-streaming'),
                testMatch: '**/*.spec.js',
                testIgnore: [],
                fullyParallel: false,
                workers: 1,
                use: { ...browser, baseURL: streaming.url },
            }] : []),
        ],
        ...(streaming ? { webServer: streaming.webServer } : {}),
        frontendURL,
        metadata: { frontend: frontend.version, target: target.target, models: target.models },
        authDir,
        gendox: {
            contextPath: '/gendox/api/v1',
            simpleUser: users.testUser1,
            adminUser: users.testUser2,
            users,
        },
        idp: {
            baseURL: keycloakURL,
            tokenSource,
            keycloak: {
                realm: environment.realm,
                clientId: environment.clientId,
            },
        },
    };
};

module.exports = { buildConfig };
