/**
 * Checks, before any test runs on a deployed environment, that what was set up there by
 * hand is in place, and says what to fix when it is not. It changes nothing.
 *
 *   checkAccounts                 the five test accounts can log in (config/accounts.js)
 *   checkSubscribedOrganization   with real models: test user 1 can use the organization
 *                                 E2E_LLM_ORGANIZATION_ID, and it is on an active paid plan
 */
const tokenEndpoint = (idp) => `${idp.baseURL}/realms/${idp.keycloak.realm}/protocol/openid-connect/token`;

const passwordLogin = (idp, account) => fetch(tokenEndpoint(idp), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
        grant_type: 'password', client_id: idp.keycloak.clientId,
        username: account.username, password: account.password, scope: 'openid email',
    }),
});

const checkAccounts = async (testsConfig) => {
    const { idp, gendox } = testsConfig;
    // A client that refuses the password grant cannot check logins (E2E_TOKEN_SOURCE=browser):
    // the setup project's browser logins show it then.
    if (idp.tokenSource === 'browser') return;
    const failed = [];
    for (const [name, account] of Object.entries(gendox.users)) {
        const response = await passwordLogin(idp, account);
        if (!response.ok) failed.push(`${account.username} (${name}): ${response.status} ${(await response.text()).slice(0, 120)}`);
    }
    if (failed.length) {
        throw new Error('These test accounts cannot log in:\n  ' + failed.join('\n  ') + '\n' +
            `Create them in the realm ${idp.keycloak.realm}, enabled, email verified, no required actions, ` +
            'with the password E2E_ACCOUNT_PASSWORD (gendox-e2e-tests/AGENTS.md, "Deployed environments").');
    }
};

const checkSubscribedOrganization = async (testsConfig) => {
    const organizationId = process.env.E2E_LLM_ORGANIZATION_ID;
    if (!organizationId) {
        throw new Error(`E2E_MODELS=${process.env.E2E_MODELS} needs E2E_LLM_ORGANIZATION_ID: an organization on a plan ` +
            'that includes these models, administered by test user 1. Create it by hand and add its id to the configuration.');
    }
    const { idp, gendox } = testsConfig;
    const api = `${testsConfig.use.baseURL}${gendox.contextPath}`;
    const owner = gendox.users.testUser1;
    const login = await passwordLogin(idp, owner);
    if (!login.ok) return; // checkAccounts has said why.
    const headers = { Authorization: `Bearer ${(await login.json()).access_token}` };
    await fetch(`${api}/profile/caches`, { method: 'DELETE', headers });

    const organization = await fetch(`${api}/organizations/${organizationId}`, { headers });
    if (!organization.ok) {
        throw new Error(`Test user 1 (${owner.username}) cannot open the organization E2E_LLM_ORGANIZATION_ID=${organizationId}: ` +
            `${organization.status}. Add the account to it as an administrator.`);
    }
    const plan = await fetch(`${api}/organizations/${organizationId}/organization-plans`, { headers });
    const current = plan.ok ? await plan.json() : null;
    const sku = current?.subscriptionPlan?.sku;
    const active = current?.status === 'ACTIVE' && (!current.endDate || new Date(current.endDate) > new Date());
    if (!active || !sku || /free/i.test(sku)) {
        throw new Error(`The organization ${organizationId} has no active paid plan (${sku || 'free'}${sku && !active ? ', not active' : ''}). ` +
            'Real models above the free tier need one: give it a plan that includes them.');
    }
    const daysLeft = current.endDate ? Math.floor((new Date(current.endDate) - Date.now()) / 86_400_000) : null;
    if (daysLeft !== null && daysLeft < 14) {
        console.warn(`[e2e] The plan ${sku} of the LLM tests' organization ends in ${daysLeft} days.`);
    }
};

module.exports = { checkAccounts, checkSubscribedOrganization };
