const { test, expect, tokenFor } = require('../../support/workspace');
const { call, ok, json, upload, complete, messages, projectPath } = require('../../support/domain');
const { textFile } = require('../../support/app');
const config = require('../../tests.config');
const fs = require('fs');

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
        const hit = JSON.parse(tool.value).sections.find(s => s.document_id === doc.id);
        expect(hit.file).toMatch(new RegExp(`^\\./knowledge/least-squares.* \\| lines=\\d+-\\d+ .*UUID=${doc.id}$`));
        expect(hit.section_text).toMatch(/^\d+ \| /);
        const final = rows.filter(m => m.role === 'assistant' && !m.toolCalls?.length).at(-1);
        const sources = await json(await call(api, w, 'get', `/threads/${answer.threadId}/message-metadata/${final.id}`));
        expect(sources.map(s => s.documentId)).toContain(doc.id);
    });

    test('an attached file is listed for the agent, not inlined, in its turn and the next', async ({ api, workspace: w }) => {
        const text = fs.readFileSync(textFile, 'utf8');
        const attached = await json(await api.post(`${config.gendox.contextPath}${projectPath(w)}/documents/upload-single?messageAttachment=true`, {
            headers: { Authorization: `Bearer ${w.ownerToken}` },
            multipart: { file: { name: 'least-squares.txt', mimeType: 'text/plain', buffer: Buffer.from(text) } },
        }));
        const first = await complete(api, w, 'What is in the file?', { documentInstanceIds: [attached.id] });
        // attached again: still one line
        await complete(api, w, 'And its last line?', { threadId: first.threadId, documentInstanceIds: [attached.id] });
        // In ALWAYS mode the mock model searches with the message it was given, so its searches show the prompt.
        const prompts = (await messages(api, w, first.threadId)).flatMap(m => m.toolCalls || [])
            .map(toolCall => JSON.parse(toolCall.function.arguments).search_query);
        expect(prompts).toHaveLength(2);
        for (const prompt of prompts) {
            expect(prompt.match(/\.\/uploads\/least-squares/g)).toHaveLength(1);
            expect(prompt).toContain(`UUID=${attached.id}`);
            expect(prompt).not.toContain(text.trim().split('\n').at(-1));
        }
    });
});

test.describe('Chat uploads', { tag: '@p1' }, () => {
    test.use({ workspaceOptions: { members: { testUser2: 'ROLE_EDITOR' } } });

    test('an upload is attached by its uploader in any thread, and not by another member', async ({ api, workspace: w }) => {
        const attached = await json(await api.post(`${config.gendox.contextPath}${projectPath(w)}/documents/upload-single?messageAttachment=true`, {
            headers: { Authorization: `Bearer ${w.ownerToken}` },
            multipart: { file: { name: 'mine.txt', mimeType: 'text/plain', buffer: Buffer.from('my notes') } },
        }));
        const path = `/messages/completions?projectId=${w.projectId}`;
        await ok(await call(api, w, 'post', path, { value: 'First thread', documentInstanceIds: [attached.id] }));
        await ok(await call(api, w, 'post', path, { value: 'Another thread', documentInstanceIds: [attached.id] }));
        const other = await call(api, w, 'post', path, { value: 'Not mine', documentInstanceIds: [attached.id] }, w.tokens.testUser2);
        expect(other.status()).toBe(403);
        expect((await other.json()).errorCode).toBe('DOCUMENT_NOT_IN_PROJECT');
    });
});
