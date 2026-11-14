const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const target = require('./target');

/**
 * A deployed environment: E2E_TARGET=dev or prod. Where it is comes from the environment,
 * or from `.env.dev` / `.env.prod` in gendox-e2e-tests (ignored by git;
 * deployed.env.example lists the names). Variables already set win over the file, so CI
 * can pass them as secrets.
 *
 * The five users are dedicated test accounts of that environment, made by hand and used
 * for nothing else (config/accounts.js). The suite creates its own organizations with
 * them and removes what it made.
 */
const envFile = path.resolve(__dirname, `../.env.${target.target}`);
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false });
// After the file: the suite reads E2E_FRONTEND and the other settings when it loads.
const { buildConfig } = require('./suite');
const { accounts } = require('./accounts');

const required = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set for the ${target.target} target. ` +
            `Set it, or put it in gendox-e2e-tests/.env.${target.target} (see deployed.env.example).`);
    }
    return value;
};

module.exports = buildConfig({
    apiBaseURL: required('E2E_API_BASE_URL'),
    frontendURL: required('E2E_FRONTEND_URL'),
    // Including the path Keycloak is served under, e.g. https://auth.example.com/idp
    keycloakURL: required('E2E_KEYCLOAK_URL'),
    realm: process.env.E2E_REALM || 'gendox-idp-prod',
    clientId: required('E2E_CLIENT_ID'),
    // testUser1..testUser4, and outsider: a test account that is a member of nothing the suite makes.
    users: accounts(),
});
