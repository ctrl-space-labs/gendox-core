const base = require('@playwright/test');
const config = require('../tests.config');
const keycloak = require('../page-objects/apis/keycloak');
const organizations = require('../page-objects/apis/organizations');
const organizationUsers = require('../page-objects/apis/organizationUsers');
const projects = require('../page-objects/apis/projects');
const projectUsers = require('../page-objects/apis/projectUsers');
const users = require('../page-objects/apis/users');
const seed = require('../page-objects/apis/seed');
const { setupRequest } = require('../page-objects/apis/fixtureSetup');

/**
 * Isolation for tests that change data. Each test, or each file that follows one thing
 * through its life, works in an organization of its own: created through the API, owned
 * by a seeded user, with other seeded users added in the roles the test needs.
 *
 * That is what lets every test run at the same time, and lets data from earlier runs
 * stay in the database without affecting later ones. Seeded organizations and projects
 * are for reading only.
 *
 * A passing test deactivates its organization. A failing one keeps it, so the failure
 * can be looked at in the application, and names it in the report.
 *
 * Options:
 *   owner            seeded user who creates the organization (default testUser1)
 *   members          { testUser2: 'ROLE_EDITOR', testUser4: 'ROLE_READER' }
 *   project          false for no project (default: one project on the mock models)
 *   projectMembers   members also added to the project (default: all of them)
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

const createWorkspace = async (api, label, options = {}) => {
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

    try {
        return await fillWorkspace(api, organization, name, owner, ownerToken, members, options);
    } catch (error) {
        // Nothing to look at in a half-built organization, so it is not kept.
        await organizations.deactivateOrganization(api, ownerToken, organization.id).catch(() => {});
        throw error;
    }
};

const fillWorkspace = async (api, organization, name, owner, ownerToken, members, options) => {
    await ensureAccess(api, ownerToken, organization.id);

    const workspaceTokens = { [owner]: ownerToken };
    for (const [member, role] of Object.entries(members)) {
        await must(await setupRequest(api, ownerToken, () => organizationUsers.addOrganizationUser(api, ownerToken, organization.id, seed[member], role)),
            `Adding ${member} to the organization`);
        workspaceTokens[member] = await tokenFor(api, member);
        await ensureAccess(api, workspaceTokens[member], organization.id);
    }

    let projectId = null;
    if (options.project !== false) {
        projectId = await projects.createProjectWithMockModels(api, ownerToken, organization.id, `${name} project`,
            (id) => ensureAccess(api, ownerToken, organization.id, id));
        for (const member of options.projectMembers || Object.keys(members)) {
            await must(await setupRequest(api, ownerToken, () => projectUsers.addProjectMember(api, ownerToken, organization.id, projectId, seed[member])),
                `Adding ${member} to the project`);
            await ensureAccess(api, workspaceTokens[member], organization.id, projectId);
        }
    }

    return { name, organizationId: organization.id, projectId, owner, ownerToken, tokens: workspaceTokens };
};

const removeWorkspace = async (api, workspace) => {
    await organizations.deactivateOrganization(api, workspace.ownerToken, workspace.organizationId);
};

const keptNote = (workspace) => ({
    type: 'kept organization',
    description: `${workspace.name} (${workspace.organizationId})`,
});

const test = base.test.extend({
    // Requests to the API, also from browser tests whose base URL is the frontend.
    api: async ({ playwright }, use) => {
        const api = await playwright.request.newContext({ baseURL: config.use.baseURL, timeout: 30_000 });
        await use(api);
        await api.dispose();
    },

    // Set with test.use({ workspaceOptions: { ... } }).
    workspaceOptions: [{}, { option: true }],

    // An organization for this one test.
    workspace: async ({ api, workspaceOptions }, use, testInfo) => {
        const workspace = await createWorkspace(api, testInfo.title, workspaceOptions);
        await use(workspace);
        if (testInfo.status === testInfo.expectedStatus) {
            await removeWorkspace(api, workspace);
        } else {
            testInfo.annotations.push(keptNote(workspace));
        }
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
    let failed = false;

    test.beforeAll(async ({ playwright }) => {
        api = await playwright.request.newContext({ baseURL: config.use.baseURL, timeout: 30_000 });
        Object.assign(workspace, await createWorkspace(api, label, options));
    });

    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus && workspace.organizationId) {
            failed = true;
            testInfo.annotations.push(keptNote(workspace));
        }
    });

    test.afterAll(async () => {
        if (!failed && workspace.organizationId) {
            await removeWorkspace(api, workspace);
        }
        await api?.dispose();
    });

    return workspace;
};

module.exports = { test, expect: base.expect, sharedWorkspace, createWorkspace, removeWorkspace, ensureAccess, tokenFor };
