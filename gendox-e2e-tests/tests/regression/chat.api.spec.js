const { test, expect, tokenFor } = require('../../support/workspace');
const { call, ok, json, upload, complete, messages, projectPath } = require('../../support/domain');

test.describe('Chat persistence and retrieval', { tag: '@p1' }, () => {
    test('follow-up stays in the same thread and both turns survive reload through the API', async ({ api, workspace: w }) => {
        await upload(api, w);
        const first = await complete(api, w, 'What is least squares?');
        const second = await complete(api, w, 'How do outliers affect that?', { threadId: first.threadId });
        expect(second.threadId).toBe(first.threadId);
        const stored = await messages(api, w, first.threadId);
        expect(stored.filter(m => m.role === 'user').map(m => m.value)).toEqual(['What is least squares?', 'How do outliers affect that?']);
        expect(stored.filter(m => m.role === 'assistant' && !m.toolCalls?.length)).toHaveLength(2);
        expect(stored.filter(m => m.role === 'tool').every(m => m.toolCallId)).toBe(true);
    });

    test('search OFF does not invoke tools and still persists an answer', async ({ api, workspace: w }) => {
        const project = await json(await call(api, w, 'get', projectPath(w)));
        project.projectAgent.advancedSearchMode = 'OFF';
        await ok(await call(api, w, 'put', projectPath(w), project));
        const answer = await complete(api, w, 'Say hello without a document search');
        const stored = await messages(api, w, answer.threadId);
        expect(stored.filter(m => m.role === 'tool')).toEqual([]);
        expect(stored.find(m => m.role === 'assistant').value).toContain('MOCK GEMINI RESPONSE');
    });

    test('rename and delete a persisted thread', async ({ api, workspace: w }) => {
        const answer = await complete(api, w, 'Thread to rename');
        const path = `/organizations/${w.organizationId}/threads/${answer.threadId}`;
        await ok(await call(api, w, 'put', path, { name: 'Renamed thread' }));
        expect((await json(await call(api, w, 'get', `/threads/${answer.threadId}`))).name).toBe('Renamed thread');
        const list = await json(await call(api, w, 'get', `/threads?projectIdIn=${w.projectId}&size=100`));
        expect(list.content.map(t => t.id)).toContain(answer.threadId);
        await ok(await call(api, w, 'delete', path));
        const after = await json(await call(api, w, 'get', `/threads?projectIdIn=${w.projectId}&size=100`));
        expect(after.content.map(t => t.id)).not.toContain(answer.threadId);
    });

    test('outsider cannot read a thread that its owner can read', async ({ api, workspace: w }) => {
        const answer = await complete(api, w, 'Private thread');
        const path = `/threads/${answer.threadId}/messages`;
        await ok(await call(api, w, 'get', path));
        expect((await call(api, w, 'get', path, undefined, await tokenFor(api, 'outsider'))).status()).toBe(404);
    });

    test('ALWAYS mode records tool results and links the answer to source metadata', async ({ api, workspace: w }) => {
        const doc = await upload(api, w);
        await ok(await require('../../page-objects/apis/embeddingsProject').getProjectEmbeddings(api, w.ownerToken, w.projectId));
        const answer = await complete(api, w, 'Find the least squares document');
        const rows = await messages(api, w, answer.threadId);
        const tool = rows.find(m => m.role === 'tool' && m.name === 'advanced_search');
        expect(tool).toBeTruthy();
        expect(JSON.parse(tool.value).sections.map(s => s.document_id)).toContain(doc.id);
        const final = rows.filter(m => m.role === 'assistant' && !m.toolCalls?.length).at(-1);
        const sources = await json(await call(api, w, 'get', `/threads/${answer.threadId}/message-metadata/${final.id}`));
        expect(sources.map(s => s.documentId)).toContain(doc.id);
    });
});
