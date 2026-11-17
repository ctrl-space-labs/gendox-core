const base = require('@playwright/test');
const config = require('../tests.config');
const target = require('../config/target');
const models = require('../config/models');
const keycloak = require('../page-objects/apis/keycloak');
const organizations = require('../page-objects/apis/organizations');
const organizationUsers = require('../page-objects/apis/organizationUsers');
const projects = require('../page-objects/apis/projects');
const projectUsers = require('../page-objects/apis/projectUsers');
const users = require('../page-objects/apis/users');
const seed = require('../page-objects/apis/seed');
const { setupRequest } = require('../page-objects/apis/fixtureSetup');
const { own, guardRequests, guardPage } = require('./guard');
const { purgeOrganization, purgeProject } = require('./cleanup');

/**
 * Isolation for tests that change data. Each test, or each file that follows one thing
 * through its life, works in an organization of its own: created through the API, owned
 * by a test user, with other test users added in the roles the test needs.
 *
 * That is what lets every test run at the same time, and lets data from earlier runs
 * stay in the database without affecting later ones. Seeded organizations and projects
 * are for reading only.
 *
 * Locally, a passing test deactivates its organization, and a failing one keeps it, so
 * the failure can be looked at in the application, and names it in the report. On a
 * deployed environment every test removes what it made (support/cleanup.js), also after
 * a failure, and the write guard (support/guard.js) keeps it inside its own organizations.
 *
 * Options:
 *   owner            test user who creates the organization (default testUser1)
 *   members          { testUser2: 'ROLE_EDITOR', testUser4: 'ROLE_READER' }
 *   project          false for no project (default: one project)
 *   projectMembers   members also added to the project (default: all of them)
 *   models           the project's models (default: the project's `modelProfile`, which
 *                    is the mock models except in the llm-* projects; config/models.js)
 *   organizationId   make only a project, in this existing organization, and remove only
 *                    that project afterwards (with real models: the subscribed organization)
 */

// One login per user and worker. Access tokens last five minutes.
const tokens = new Map();
const tokenFor = async (api, name) => {
    const cached = tokens.get(name);
    if (cached && Date.now() - cached.at < 3 * 60_000) return cached.token;
    const token = await keycloak.tokenFor(api, name);
    tokens.set(name, { token, at: Date.now() });
    return token;
};

// A user's id: seeded locally, read from the profile on a deployed environment.
const userIds = new Map();
const userIdOf = async (api, name) => {
    if (!target.deployed && seed[name]) return seed[name];
    if (!userIds.has(name)) {
        const response = await users.getUserProfile(api, await tokenFor(api, name));
        if (!response.ok()) throw new Error(`Reading the profile of ${name} failed: ${response.status()}`);
        userIds.set(name, (await response.json()).id);
    }
    return userIds.get(name);
};

const must = async (response, what) => {
    if (!response.ok()) {
        throw new Error(`${what} failed: ${response.status()} ${await response.text()}`);
    }
    return response;
};

/**
 * Waits until the user of this token can read the organization, or the project.
 *
 * The API keeps each user's profile, with its organizations and projects, in a cache.
 * The seeded users act in many tests at once, and right after a change a user can
 * still get the old profile. When that happens, ask the API to read it again.
 */
const ensureAccess = async (api, token, organizationId, projectId) => {
    const read = () => (projectId
        ? projects.getProjectById(api, token, organizationId, projectId)
        : organizations.getOrganizationById(api, token, organizationId));

    for (let attempt = 0; attempt < 30; attempt++) {
        if ((await read()).ok()) return;
        await users.clearProfileCache(api, token);
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
    }
    throw new Error(`No access to organization ${organizationId}${projectId ? `, project ${projectId}` : ''}`);
};

const uniqueName = (label) => {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `e2e ${label.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().slice(0, 40)} ${suffix}`;
};

// A project of its own in an organization the test does not own (target.subscribedOrganizationId).
const projectWorkspace = async (api, label, options) => {
    const owner = options.owner || 'testUser1';
    const ownerToken = await tokenFor(api, owner);
    const name = uniqueName(label);
    const organizationId = options.organizationId;
    own(organizationId);
    await ensureAccess(api, ownerToken, organizationId);
    const workspace = { name, organizationId, projectId: null, owner, ownerToken, tokens: { [owner]: ownerToken }, sharedOrganization: true };
    try {
        workspace.projectId = await projects.createProjectWithModels(api, ownerToken, organizationId, `${name} project`,
            (id) => { own(id); workspace.projectId = id; return ensureAccess(api, ownerToken, organizationId, id); }, options.models || models.mock);
    } catch (error) {
        if (workspace.projectId) await removeWorkspace(api, workspace).catch(() => {});
        throw error;
    }
    return workspace;
};

const createWorkspace = async (api, label, options = {}) => {
    api = guardRequests(api);
    if (options.organizationId) return projectWorkspace(api, label, options);
    const owner = options.owner || 'testUser1';
    const members = options.members || {};
    const ownerToken = await tokenFor(api, owner);
    const name = uniqueName(label);

    // Creating organizations at the same moment sometimes fails with a server error
    // in the API's DID key setup. That part of the API is due to be removed, so the
    // tests retry instead of treating it as a failure.
    let created;
    for (let attempt = 0; attempt < 4; attempt++) {
        created = await organizations.createOrganization(api, ownerToken, { name, displayName: name });
        if (created.status() < 500) break;
        await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
    }
    const organization = await (await must(created, 'Creating the organization')).json();
    own(organization.id);

    try {
        return await fillWorkspace(api, organization, name, owner, ownerToken, members, options);
    } catch (error) {
        // Nothing to look at in a half-built organization, so it is not kept.
        await removeWorkspace(api, { organizationId: organization.id, owner, ownerToken }).catch(() => {});
        throw error;
    }
};

const fillWorkspace = async (api, organization, name, owner, ownerToken, members, options) => {
    await ensureAccess(api, ownerToken, organization.id);

    const workspaceTokens = { [owner]: ownerToken };
    for (const [member, role] of Object.entries(members)) {
        const memberId = await userIdOf(api, member);
        await must(await setupRequest(api, ownerToken, () => organizationUsers.addOrganizationUser(api, ownerToken, organization.id, memberId, role)),
            `Adding ${member} to the organization`);
        workspaceTokens[member] = await tokenFor(api, member);
        await ensureAccess(api, workspaceTokens[member], organization.id);
    }

    let projectId = null;
    if (options.project !== false) {
        projectId = await projects.createProjectWithModels(api, ownerToken, organization.id, `${name} project`,
            (id) => { own(id); return ensureAccess(api, ownerToken, organization.id, id); }, options.models || models.mock);
        for (const member of options.projectMembers || Object.keys(members)) {
            const memberId = await userIdOf(api, member);
            await must(await setupRequest(api, ownerToken, () => projectUsers.addProjectMember(api, ownerToken, organization.id, projectId, memberId)),
                `Adding ${member} to the project`);
            await ensureAccess(api, workspaceTokens[member], organization.id, projectId);
        }
    }

    return { name, organizationId: organization.id, projectId, owner, ownerToken, tokens: workspaceTokens };
};

// Returns the cleanup steps that failed; an empty list when all went well.
const removeWorkspace = async (api, workspace) => {
    api = guardRequests(api);
    // A long test can outlive the token it started with.
    const token = workspace.owner ? await tokenFor(api, workspace.owner) : workspace.ownerToken;
    // Never the organization the test only borrowed: only its own project, always emptied.
    if (workspace.sharedOrganization) return purgeProject(api, token, workspace.organizationId, workspace.projectId);
    if (target.purge) return purgeOrganization(api, token, workspace.organizationId);
    const response = await organizations.deactivateOrganization(api, token, workspace.organizationId);
    return response.ok() ? [] : [`deactivating the organization: ${response.status()}`];
};

const keptNote = (workspace) => ({
    type: 'kept organization',
    description: `${workspace.name} (${workspace.organizationId})`,
});

// After the test: clean up, or keep a failed test's organization when the target allows it.
const finish = async (api, workspace, testInfo, failed) => {
    // A project in a borrowed organization is removed even after a failure.
    if (failed && target.keepFailed && !workspace.sharedOrganization) {
        testInfo.annotations.push(keptNote(workspace));
        return;
    }
    const left = await removeWorkspace(api, workspace);
    if (left.length) {
        testInfo.annotations.push({ type: 'cleanup incomplete', description: `${workspace.name} (${workspace.organizationId}): ${left.join('; ')}` });
        console.warn(`[cleanup] ${workspace.organizationId}: ${left.join('; ')}`);
    }
};

const test = base.test.extend({
    // The models of the workspace's project. The llm-* projects set it (config/suite.js).
    modelProfile: [null, { option: true }],

    // Requests to the API, also from browser tests whose base URL is the frontend.
    api: async ({ playwright }, use) => {
        const api = await playwright.request.newContext({ baseURL: config.use.baseURL, timeout: 30_000 });
        await use(guardRequests(api));
        await api.dispose();
    },

    // The browser's changes to the API pass the write guard too.
    page: async ({ page }, use) => {
        const refused = await guardPage(page);
        await use(page);
        if (refused.length) throw new Error(refused.join('\n'));
    },

    // Set with test.use({ workspaceOptions: { ... } }).
    workspaceOptions: [{}, { option: true }],

    // An organization for this one test.
    workspace: async ({ api, workspaceOptions, modelProfile }, use, testInfo) => {
        const options = { models: modelProfile || undefined, ...workspaceOptions };
        // Real models need a subscription: their project goes into the subscribed organization.
        if (modelProfile && target.realModels && !options.organizationId) {
            if (!target.subscribedOrganizationId) {
                throw new Error(`E2E_MODELS=${target.models} on ${target.target} needs E2E_LLM_ORGANIZATION_ID: an organization ` +
                    'with a subscription that includes these models, administered by test user 1.');
            }
            options.organizationId = target.subscribedOrganizationId;
        }
        const workspace = await createWorkspace(api, testInfo.title, options);
        await use(workspace);
        await finish(api, workspace, testInfo, testInfo.status !== testInfo.expectedStatus);
    },
});

/**
 * One organization for all tests of a file, for files whose tests build on each other.
 * Call it inside the describe block; the returned object is filled in before the tests.
 * A worker that runs only part of the file gets an organization of its own.
 */
const sharedWorkspace = (label, options = {}) => {
    const workspace = {};
    let api;
    let failedTest = null;

    test.beforeAll(async ({ playwright }) => {
        api = guardRequests(await playwright.request.newContext({ baseURL: config.use.baseURL, timeout: 30_000 }));
        Object.assign(workspace, await createWorkspace(api, label, options));
    });

    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus && workspace.organizationId) {
            failedTest = testInfo;
            if (target.keepFailed) testInfo.annotations.push(keptNote(workspace));
        }
    });

    test.afterAll(async ({}, testInfo) => {
        if (workspace.organizationId && !(failedTest && target.keepFailed)) {
            await finish(api, workspace, failedTest || testInfo, false);
        }
        await api?.dispose();
    });

    return workspace;
};

module.exports = { test, expect: base.expect, sharedWorkspace, createWorkspace, removeWorkspace, ensureAccess, tokenFor, userIdOf };
