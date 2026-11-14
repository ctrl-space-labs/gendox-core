const config = require('../tests.config');
const organizations = require('../page-objects/apis/organizations');
const projects = require('../page-objects/apis/projects');
const { own } = require('./guard');

/**
 * Removes what a test made, through the application's own delete APIs. Used on deployed
 * environments, whose database is not thrown away (config/target.js, `purge`).
 *
 * What the APIs delete, per project:
 *   tasks        with their questions, document links and answers
 *   documents    with their sections, embeddings and the message links to them
 * and per organization:
 *   API keys     revoked
 * What stays, because no API deletes it:
 *   chat threads are deactivated, their messages remain
 *   organizations and projects are deactivated and renamed DEACTIVATED, their
 *   memberships removed
 *   audit logs, usage records, and the uploaded files in storage
 *
 * Each function returns the steps that failed, and deactivates in any case.
 */
const session = (api, token) => {
    const failed = [];
    const send = (method, path) => api[method](`${config.gendox.contextPath}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const list = async (path) => {
        const response = await send('get', path);
        if (!response.ok()) throw new Error(`GET ${path} answered ${response.status()}`);
        const body = await response.json();
        return Array.isArray(body) ? body : (body.content || []);
    };
    const remove = async (path) => {
        const response = await send('delete', path);
        if (!response.ok() && response.status() !== 404) throw new Error(`DELETE ${path} answered ${response.status()}`);
    };
    const attempt = async (what, operation) => {
        try {
            await operation();
        } catch (error) {
            failed.push(`${what}: ${error.message.split('\n')[0]}`);
        }
    };
    return { failed, list, remove, attempt };
};

// Empties a project: its tasks, chat threads and documents.
const emptyProject = async ({ list, remove, attempt }, organizationId, projectId) => {
    own(projectId);
    const projectPath = `/organizations/${organizationId}/projects/${projectId}`;
    // Tasks first: their document nodes refer to the documents.
    await attempt(`tasks of ${projectId}`, async () => {
        for (const task of await list(`${projectPath}/tasks?size=100`)) await remove(`${projectPath}/tasks/${task.id}`);
    });
    await attempt(`chat threads of ${projectId}`, async () => {
        for (const thread of await list(`/threads?projectIdIn=${projectId}&size=100`)) {
            await remove(`/organizations/${organizationId}/threads/${thread.id}`);
        }
    });
    await attempt(`documents of ${projectId}`, async () => {
        // Pages of documents until none are left; a bound in case one cannot be deleted.
        for (let page = 0; page < 20; page++) {
            const ids = (await list(`${projectPath}/documents?size=50`)).map(document => document.id);
            if (ids.length === 0) return;
            await remove(`${projectPath}/documents?documentIds=${ids.join(',')}`);
        }
        throw new Error('documents remain after 20 rounds');
    });
};

// A test's project in an organization it does not own: empty it, then deactivate it.
const purgeProject = async (api, token, organizationId, projectId) => {
    const steps = session(api, token);
    await emptyProject(steps, organizationId, projectId);
    await steps.attempt('deactivating the project', async () => {
        const response = await projects.deactivateProject(api, token, organizationId, projectId);
        if (!response.ok()) throw new Error(`answered ${response.status()}`);
    });
    return steps.failed;
};

// A test's own organization: every project in it, also those made in the browser, then
// its API keys, then the organization itself.
const purgeOrganization = async (api, token, organizationId) => {
    const steps = session(api, token);
    own(organizationId);
    let found = [];
    await steps.attempt('listing projects', async () => {
        found = (await steps.list(`/organizations/${organizationId}/projects?size=100`)).filter(project => project.active !== false);
    });
    for (const project of found) await emptyProject(steps, organizationId, project.id);
    await steps.attempt('API keys', async () => {
        // Revoking a revoked key changes nothing.
        for (const key of await steps.list(`/organizations/${organizationId}/api-keys`)) {
            await steps.remove(`/organizations/${organizationId}/api-keys/${key.id}`);
        }
    });
    await steps.attempt('deactivating the organization', async () => {
        const response = await organizations.deactivateOrganization(api, token, organizationId);
        if (!response.ok()) throw new Error(`answered ${response.status()}`);
    });
    return steps.failed;
};

module.exports = { purgeOrganization, purgeProject };
