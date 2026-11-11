const { test, expect } = require('../../support/workspace');
const { call, ok, json, orgPath, projectPath } = require('../../support/domain');
const config = require('../../tests.config');

test.describe('Organization administration', { tag: '@p2' }, () => {
    test('API key can access its organization and is refused after revocation', async ({ api, workspace: w }) => {
        const key = await json(await call(api, w, 'post', `${orgPath(w)}/api-keys`, { name: 'Disposable API key', durationInDays: 1 }));
        expect(key.apiKey).toMatch(/^gxsk-/);
        const endpoint = `${config.gendox.contextPath}${projectPath(w)}`;
        const usingKey = () => api.get(endpoint, { headers: { 'x-api-key': key.apiKey } });
        await ok(await usingKey());
        await ok(await call(api, w, 'delete', `${orgPath(w)}/api-keys/${key.id}`));
        expect((await usingKey()).ok()).toBe(false);
    });

    test('provider key CRUD masks list values and persists updates', async ({ api, workspace: w }) => {
        const providers = await json(await call(api, w, 'get', `${orgPath(w)}/ai-models/providers`));
        const provider = providers.find(p => p.name === 'OPEN_AI') || providers[0];
        const fake = 'e2e-test-only-no-provider-access-123456789';
        const created = await json(await call(api, w, 'post', `${orgPath(w)}/model-keys`, { aiModelProvider: provider, key: fake }));
        const list = await json(await call(api, w, 'get', `${orgPath(w)}/model-keys`));
        const listed = list.content.find(k => k.id === created.id);
        expect(listed.key).not.toBe(fake);
        expect(listed.key).toContain('*');
        await ok(await call(api, w, 'put', `${orgPath(w)}/model-keys/${created.id}`, { aiModelProvider: provider, key: `${fake}-updated` }));
        await ok(await call(api, w, 'delete', `${orgPath(w)}/model-keys/${created.id}`));
        expect((await json(await call(api, w, 'get', `${orgPath(w)}/model-keys`))).content.map(k => k.id)).not.toContain(created.id);
    });

    test('active subscription plan can be displayed for the organization', async ({ api, workspace: w }) => {
        const plan = await json(await call(api, w, 'get', `${orgPath(w)}/organization-plans`));
        expect(plan.subscriptionPlan).toBeTruthy();
        const plans = await json(await call(api, w, 'get', `${orgPath(w)}/subscription-plans`));
        expect(plans.content.length).toBeGreaterThan(0);
    });

    test('agent retrieval mode and generation settings survive a read', async ({ api, workspace: w }) => {
        const project = await json(await call(api, w, 'get', projectPath(w)));
        Object.assign(project.projectAgent, { advancedSearchMode: 'OFF', maxSearchLimit: 4, maxCompletionLimit: 2, maxToken: 650, temperature: 0.2, topP: 0.9, agentBehavior: 'Persist these settings' });
        await ok(await call(api, w, 'put', projectPath(w), project));
        const stored = await json(await call(api, w, 'get', projectPath(w)));
        expect(stored.projectAgent).toMatchObject({ advancedSearchMode: 'OFF', maxSearchLimit: 4, maxCompletionLimit: 2, maxToken: 650, temperature: 0.2, topP: 0.9, agentBehavior: 'Persist these settings' });
    });

    test('skills library and allowed tools can be read by an authenticated user', async ({ api, workspace: w }) => {
        const library = await json(await call(api, w, 'get', '/skills'));
        expect(Array.isArray(library)).toBe(true);
        const tools = await json(await call(api, w, 'get', '/skills/tools'));
        expect(tools.map(t => t.name)).toContain('advanced_search');
        const denied = await call(api, w, 'post', '/skills', { content: '---\nname: disposable-test\ndescription: Test\n---\nTest' });
        expect(denied.status()).toBe(404);
    });
});

test('custom agent skill can be added, read and removed without editing the global library', { tag: '@p2' }, async ({ api, workspace: w }) => {
    const project = await json(await call(api, w, 'get', projectPath(w)));
    const original = project.projectAgent.agentSkills || [];
    project.projectAgent.agentSkills = [...original, { name: 'e2e-custom-skill', description: 'Test instructions', content: '---\nname: e2e-custom-skill\ndescription: Test instructions\n---\nRespond concisely when asked about the fixture.' }];
    await ok(await call(api, w, 'put', projectPath(w), project));
    const stored = await json(await call(api, w, 'get', projectPath(w)));
    expect(stored.projectAgent.agentSkills.map(s => s.name)).toContain('e2e-custom-skill');
    stored.projectAgent.agentSkills = stored.projectAgent.agentSkills.filter(s => s.name !== 'e2e-custom-skill');
    await ok(await call(api, w, 'put', projectPath(w), stored));
    expect((await json(await call(api, w, 'get', projectPath(w)))).projectAgent.agentSkills.map(s => s.name)).not.toContain('e2e-custom-skill');
});

test.describe('Connector configuration', { tag: '@p2' }, () => {
    test.use({ workspaceOptions: { members: { testUser4: 'ROLE_READER' } } });
    test('configure, update and remove a disabled connector; reader responses omit its key', async ({ api, workspace: w }) => {
        const path = `${orgPath(w)}/connectors/WEB_SCRAPE_FIRECRAWL`;
        const created = await json(await call(api, w, 'put', path, { isActive: false, config: { apiKey: 'e2e-dummy-key-never-sent-to-provider' } }));
        expect(created.isActive).toBe(false);
        const reader = await json(await call(api, w, 'get', path, undefined, w.tokens.testUser4));
        expect(reader.config).not.toHaveProperty('apiKey');
        await ok(await call(api, w, 'put', path, { isActive: false, config: { apiKey: 'e2e-replacement-dummy-key' } }));
        await ok(await call(api, w, 'delete', path));
        expect((await json(await call(api, w, 'get', `${orgPath(w)}/connectors`))).map(c => c.connectorType)).not.toContain('WEB_SCRAPE_FIRECRAWL');
    });
});
