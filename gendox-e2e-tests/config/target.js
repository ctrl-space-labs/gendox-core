/**
 * Where the suite runs and which models its LLM tests use. Two settings, read from the
 * environment, that every other part of the configuration follows:
 *
 *   E2E_TARGET   local (default): this checkout's ephemeral environment
 *                dev, prod: a deployed environment, see config/deployed.config.js
 *   E2E_MODELS   mock (default): the mock models, no key and no cost
 *                small: a cheap model of every provider, large: each provider's flagship
 *
 * The tests themselves do not change between targets. What changes is how much they
 * may wait, how many run at once, and what they leave behind.
 */
const flag = name => /^(1|true|yes)$/i.test(process.env[name] || '');

// ENV_NAME=DEV selected the old, incomplete dev configuration; it now means the dev target.
const target = (process.env.E2E_TARGET || (process.env.ENV_NAME === 'DEV' ? 'dev' : 'local')).toLowerCase();
if (!['local', 'dev', 'prod'].includes(target)) {
    throw new Error(`E2E_TARGET=${target}: use local, dev or prod`);
}
const models = (process.env.E2E_MODELS || 'mock').toLowerCase();
if (!['mock', 'small', 'large'].includes(models)) {
    throw new Error(`E2E_MODELS=${models}: use mock, small or large`);
}
const deployed = target !== 'local';

module.exports = {
    target,
    deployed,
    models,
    realModels: models !== 'mock',
    // A deployed database is not thrown away. Each test removes what it made through the
    // application's own delete APIs, then deactivates its organization. Locally a test only
    // deactivates it; E2E_PURGE=1 runs the deployed cleanup against the local stack.
    purge: deployed || flag('E2E_PURGE'),
    // Locally a failed test keeps its organization for inspection. On a deployed environment
    // it is cleaned up like any other, unless E2E_KEEP_FAILED=1.
    keepFailed: deployed ? flag('E2E_KEEP_FAILED') : true,
    // On a deployed environment every change the suite sends must name an organization or
    // project it created in this run (support/guard.js). E2E_WRITE_GUARD=1 turns it on locally.
    writeGuard: deployed || flag('E2E_WRITE_GUARD'),
    // Models above the free tier need a subscription, and subscriptions belong to an
    // organization. With real models, the LLM tests make their projects in this one
    // organization, which test user 1 administers, and remove them afterwards. Locally it
    // is the seeded organization 1, which has a Pro plan.
    subscribedOrganizationId: process.env.E2E_LLM_ORGANIZATION_ID
        || (deployed ? null : require('../page-objects/apis/seed').organization1),
};
