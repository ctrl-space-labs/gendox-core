const { test, expect, ensureAccess } = require('../../support/workspace');
const { call, ok, json, orgPath, projectPath } = require('../../support/domain');
const organizations = require('../../page-objects/apis/organizations');
const { own } = require('../../support/guard');

// Custom and local models: an organization's servers (providers with their own endpoint and key) and the models
// on them. Nothing here needs the server to answer: a test run reports a server that does not as a failed result.
const ENDPOINT = 'https://example.com/v1';
const servers = w => `${orgPath(w)}/ai-models/providers`;
const models = w => `${orgPath(w)}/ai-models`;
const addServer = (api, w, name, baseUrl = ENDPOINT) => call(api, w, 'post', servers(w), { name, baseUrl }).then(json);
const model = (name, type, serverId, apiType) => ({
    name, model: `${name}-id`, aiModelProvider: { id: serverId }, aiModelType: { name: type }, apiType: apiType ? { name: apiType } : null,
});

test.describe('Custom and local models', { tag: '@p2' }, () => {
    test('a server with its key and models; a new endpoint moves them, and a server goes only without models', async ({ api, workspace: w }) => {
        const s = await addServer(api, w, `Server ${w.name}`);
        expect(s).toMatchObject({ organizationId: w.organizationId, baseUrl: ENDPOINT });
        await json(await call(api, w, 'post', `${orgPath(w)}/model-keys`, { aiModelProvider: { name: s.name }, key: 'key-of-the-test-server' }));

        const chat = await json(await call(api, w, 'post', models(w), model(`chat ${w.name}`, 'COMPLETION_MODEL', s.id)));
        const embedder = await json(await call(api, w, 'post', models(w), model(`embedder ${w.name}`, 'SEMANTIC_SEARCH_MODEL', s.id)));
        const reranker = await json(await call(api, w, 'post', models(w), model(`reranker ${w.name}`, 'RERANK_MODEL', s.id)));
        expect([chat.url, embedder.url, reranker.url]).toEqual([`${ENDPOINT}/chat/completions`, `${ENDPOINT}/embeddings`, `${ENDPOINT}/rerank`]);
        expect(reranker.apiType.name).toBe('COHERE_API');

        // the project's models include them, for its agents to pick
        const usable = await json(await call(api, w, 'get', `${projectPath(w)}/ai-models`));
        expect(usable.map(m => m.id)).toEqual(expect.arrayContaining([chat.id, embedder.id, reranker.id]));

        await json(await call(api, w, 'put', `${servers(w)}/${s.id}`, { name: s.name, baseUrl: 'https://example.org/v2/' }));
        const moved = await json(await call(api, w, 'get', models(w)));
        expect(moved.find(m => m.id === chat.id).url).toBe('https://example.org/v2/chat/completions');

        expect((await call(api, w, 'delete', `${servers(w)}/${s.id}`)).status()).toBe(409);
        for (const m of [chat, embedder, reranker]) await ok(await call(api, w, 'delete', `${models(w)}/${m.id}`));
        await ok(await call(api, w, 'delete', `${servers(w)}/${s.id}`));
        const keys = (await json(await call(api, w, 'get', `${orgPath(w)}/model-keys`))).content;
        expect(keys.some(k => k.aiModelProvider?.id === s.id)).toBe(false);
    });

    test('a test run calls the model and saves nothing', async ({ api, workspace: w }) => {
        const s = await addServer(api, w, `Tested ${w.name}`);
        const result = await json(await call(api, w, 'post', `${orgPath(w)}/ai-model-tests`, model('probe', 'COMPLETION_MODEL', s.id)));
        // example.com is no model server: the run reports that, it does not fail
        expect(result.ok).toBe(false);
        expect(result.message).toBeTruthy();
        expect(await json(await call(api, w, 'get', models(w)))).toEqual([]);
    });

    test('names, endpoints, types and API formats are checked', async ({ api, workspace: w }) => {
        const s = await addServer(api, w, `Checked ${w.name}`);
        const status = async (method, path, body) => (await call(api, w, method, path, body)).status();

        expect(await status('post', servers(w), { name: s.name, baseUrl: ENDPOINT })).toBe(409);
        expect(await status('post', servers(w), { name: 'OPEN_AI', baseUrl: ENDPOINT })).toBe(409);
        expect(await status('post', servers(w), { name: 'Query', baseUrl: `${ENDPOINT}?key=x` })).toBe(400);
        expect(await status('post', servers(w), { name: 'Ftp', baseUrl: 'ftp://example.com/v1' })).toBe(400);

        expect(await status('post', models(w), model('m', 'MODERATION_MODEL', s.id))).toBe(400);
        expect(await status('post', models(w), model('m', 'SEMANTIC_SEARCH_MODEL', s.id, 'ANTHROPIC_AI_API'))).toBe(400);
        expect(await status('post', models(w), model('m', 'COMPLETION_MODEL', null))).toBe(400);
        await json(await call(api, w, 'post', models(w), model(`taken ${w.name}`, 'COMPLETION_MODEL', s.id)));
        expect(await status('post', models(w), model(`taken ${w.name}`, 'COMPLETION_MODEL', s.id))).toBe(409);
        const gendoxModel = (await json(await call(api, w, 'get', `${projectPath(w)}/ai-models`))).find(m => !m.organizationId);
        expect(await status('post', models(w), { ...model('x', 'COMPLETION_MODEL', s.id), name: gendoxModel.name })).toBe(409);
    });

    test.describe('ROLE_EDITOR', () => {
        test.use({ workspaceOptions: { members: { testUser3: 'ROLE_EDITOR' } } });
        test('an editor can neither add a server nor run a test, which the admin can', async ({ api, workspace: w }) => {
            const asEditor = (path, body) => call(api, w, 'post', path, body, w.tokens.testUser3);
            expect((await asEditor(servers(w), { name: `Editor ${w.name}`, baseUrl: ENDPOINT })).status()).toBe(404);
            const s = await addServer(api, w, `Editor ${w.name}`);
            expect((await asEditor(`${orgPath(w)}/ai-model-tests`, model('probe', 'COMPLETION_MODEL', s.id))).status()).toBe(404);
            await ok(await call(api, w, 'post', `${orgPath(w)}/ai-model-tests`, model('probe', 'COMPLETION_MODEL', s.id)));
        });
    });

    test('another organization neither sees nor uses a server', async ({ api, workspace: w }) => {
        const s = await addServer(api, w, `Private ${w.name}`);
        const name = `${w.name} other`;
        const other = await json(await organizations.createOrganization(api, w.ownerToken, { name, displayName: name }));
        own(other.id);
        try {
            await ensureAccess(api, w.ownerToken, other.id);
            const theirs = `/organizations/${other.id}`;
            expect((await json(await call(api, w, 'get', `${theirs}/ai-models/providers`))).some(p => p.id === s.id)).toBe(false);
            expect((await call(api, w, 'post', `${theirs}/ai-models`, model('borrowed', 'COMPLETION_MODEL', s.id))).status()).toBe(404);
            expect((await call(api, w, 'post', `${theirs}/ai-model-tests`, model('borrowed', 'COMPLETION_MODEL', s.id))).status()).toBe(404);
            expect((await call(api, w, 'post', `${theirs}/model-keys`, { aiModelProvider: { name: s.name }, key: 'k'.repeat(20) })).status()).toBe(404);
            expect((await call(api, w, 'put', `${theirs}/ai-models/providers/${s.id}`, { name: 'Taken over', baseUrl: ENDPOINT })).status()).toBe(404);
        } finally {
            await organizations.deactivateOrganization(api, w.ownerToken, other.id);
        }
    });
});
