/**
 * The test accounts of a deployed environment. They are made once by hand in the
 * environment's Keycloak realm and used for nothing else; the suite only logs in with them.
 *
 * Their emails follow E2E_ACCOUNT_EMAIL, where {name} becomes user1..user4 or outsider
 * (default e2e-smoke-{name}@example.com). All five share the password E2E_ACCOUNT_PASSWORD,
 * which CI passes as a secret. E2E_USER1_EMAIL / E2E_USER1_PASSWORD … E2E_OUTSIDER_EMAIL /
 * E2E_OUTSIDER_PASSWORD name an account differently.
 *
 * The global setup checks that every account can log in before any test runs
 * (support/preflight.js).
 */
const names = { testUser1: 'user1', testUser2: 'user2', testUser3: 'user3', testUser4: 'user4', outsider: 'outsider' };

const accountFor = (key) => {
    const name = names[key];
    const prefix = key === 'outsider' ? 'E2E_OUTSIDER' : `E2E_USER${name.slice(-1)}`;
    const pattern = process.env.E2E_ACCOUNT_EMAIL || 'e2e-smoke-{name}@example.com';
    const username = process.env[`${prefix}_EMAIL`] || pattern.replace('{name}', name);
    const password = process.env[`${prefix}_PASSWORD`] || process.env.E2E_ACCOUNT_PASSWORD;
    if (!password) {
        throw new Error(`No password for the test account ${username}. Set E2E_ACCOUNT_PASSWORD ` +
            `(in CI: the E2E_ACCOUNT_PASSWORD secret), or ${prefix}_PASSWORD.`);
    }
    return { username, password };
};

const accounts = () => Object.fromEntries(Object.keys(names).map(key => [key, accountFor(key)]));

module.exports = { accounts };
