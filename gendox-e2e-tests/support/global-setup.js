const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');

const newestIn = (dir) => {
    let newest = 0;
    if (!fs.existsSync(dir)) return newest;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        newest = Math.max(newest, entry.isDirectory() ? newestIn(full) : fs.statSync(full).mtimeMs);
    }
    return newest;
};

const mtime = (file) => (fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0);

const newestJar = () => {
    const target = path.join(repoRoot, 'gendox-core-api/target');
    if (!fs.existsSync(target)) return 0;
    return Math.max(0, ...fs.readdirSync(target)
        .filter(name => /^gendox-core-api-.*\.jar$/.test(name))
        .map(name => mtime(path.join(target, name))));
};

/**
 * Creates one organization, alone, and deactivates it. The API sets up its DID key
 * library on first use, and when the first uses arrive together that setup breaks
 * until the API restarts. The tests create their organizations in parallel, so the
 * first one has to come before them.
 */
const warmUp = async (apiBaseURL) => {
    const testsConfig = require('../tests.config');
    const user = testsConfig.gendox.users.testUser1;
    const api = `${apiBaseURL}${testsConfig.gendox.contextPath}`;

    const login = await fetch(`${testsConfig.idp.baseURL}/realms/${testsConfig.idp.keycloak.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'password',
            client_id: testsConfig.idp.keycloak.clientId,
            username: user.username,
            password: user.password,
            scope: 'openid email',
        }),
    });
    if (!login.ok) {
        throw new Error(`Login of ${user.username} failed with ${login.status}. Is Keycloak up? ` +
            'In gendox-compose-scripts/ephemeral run: docker compose up -d --wait');
    }
    const headers = {
        Authorization: `Bearer ${(await login.json()).access_token}`,
        'Content-Type': 'application/json',
    };

    const created = await fetch(`${api}/organizations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'e2e warm-up', displayName: 'e2e warm-up' }),
    });
    if (!created.ok) {
        throw new Error(`Creating an organization failed with ${created.status}: ${await created.text()}\n` +
            'If it mentions a DID resolver, restart the API: docker compose restart api');
    }
    const organization = await created.json();
    await fetch(`${api}/organizations/${organization.id}/deactivate`, { method: 'PUT', headers });
};

/**
 * Runs once before the tests. It stops early, with the command to run, when the
 * environment does not answer, and warns when the running code is older than the
 * sources. It never builds anything itself.
 */
module.exports = async (config) => {
    // Only the ephemeral configuration has an api project.
    const apiBaseURL = config.projects.find(project => project.name === 'api')?.use.baseURL;
    if (!apiBaseURL) return;

    const health = `${apiBaseURL}/gendox/api/v1/actuator/health`;
    const healthy = await fetch(health).then(response => response.ok).catch(() => false);
    if (!healthy) {
        throw new Error(
            `The API does not answer at ${health}.\n` +
            'In gendox-compose-scripts/ephemeral run: docker compose up -d --wait'
        );
    }

    await warmUp(apiBaseURL);

    const warnings = [];
    const apiDir = path.join(repoRoot, 'gendox-core-api');
    const backendSources = Math.max(newestIn(path.join(apiDir, 'src/main')), mtime(path.join(apiDir, 'pom.xml')));
    if (backendSources > newestJar()) {
        warnings.push('Backend sources are newer than the jar. In gendox-core-api: mvn -q package -DskipTests, ' +
            'then in gendox-compose-scripts/ephemeral: docker compose restart api && docker compose up -d --wait');
    }

    const frontendDir = path.join(repoRoot, 'gendox-frontend-v2');
    const frontendSources = Math.max(
        newestIn(path.join(frontendDir, 'src')),
        newestIn(path.join(frontendDir, 'public')),
        mtime(path.join(frontendDir, 'package.json')),
    );
    if (frontendSources > mtime(path.join(frontendDir, 'out/index.html'))) {
        warnings.push('Frontend sources are newer than the build. In gendox-frontend-v2: yarn build');
    }

    for (const warning of warnings) {
        console.warn(`[stale build] ${warning}`);
    }
};
