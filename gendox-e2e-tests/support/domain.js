const config = require('../tests.config');
const { expect } = require('./workspace');
const documents = require('../page-objects/apis/documents');
const { textFile } = require('./app');

// Responses include their HTTP method, route and body on failure. Never log Authorization.
const call = async (api, workspace, method, path, data, token = workspace.ownerToken) => {
    const response = await api[method](`${config.gendox.contextPath}${path}`, {
        headers: { Authorization: `Bearer ${token}` }, ...(data === undefined ? {} : { data }),
    });
    return response;
};
const ok = async response => {
    expect(response.ok(), `${response.status()} ${response.url()}: ${(await response.text()).slice(0, 1000)}`).toBeTruthy();
    return response;
};
const json = async response => (await ok(response)).json();
const orgPath = w => `/organizations/${w.organizationId}`;
const projectPath = w => `${orgPath(w)}/projects/${w.projectId}`;
const taskPath = (w, taskId = '') => `${projectPath(w)}/tasks${taskId ? `/${taskId}` : ''}`;
const upload = async (api, w, file = textFile, split = true) => {
    await ok(await documents.uploadDocument(api, w.ownerToken, w.organizationId, w.projectId, file));
    const listing = await json(await call(api, w, 'get', `${projectPath(w)}/documents`));
    const document = listing.content.find(d => d.title === require('path').parse(file).name) || listing.content[0];
    expect(document.id).toBeTruthy();
    if (split) await ok(await documents.splitDocumentSections(api, w.ownerToken, w.organizationId, w.projectId));
    return document;
};
const createTask = async (api, w, type = 'DOCUMENT_INSIGHTS', title = 'Regression task') => {
    const project = await json(await call(api, w, 'get', projectPath(w)));
    return json(await call(api, w, 'post', taskPath(w), {
        projectId: w.projectId, type, title, description: 'Independent regression fixture',
        completionModel: project.projectAgent.completionModel, maxToken: 700, temperature: 0.1, topP: 1,
        usePageText: true, usePrintedPage: false,
    }));
};
const node = (api, w, taskId, nodeType, nodeValue, extra = {}) =>
    call(api, w, 'post', `${projectPath(w)}/task-nodes`, { taskId, nodeType, nodeValue, ...extra }).then(json);
const messages = (api, w, threadId) => call(api, w, 'get', `/threads/${threadId}/messages?size=100&sort=createdAt,asc`).then(json).then(r => r.content);
const complete = (api, w, value, extra = {}) => call(api, w, 'post', `/messages/completions?projectId=${w.projectId}`, { value, ...extra }).then(json);
module.exports = { call, ok, json, orgPath, projectPath, taskPath, upload, createTask, node, messages, complete };
