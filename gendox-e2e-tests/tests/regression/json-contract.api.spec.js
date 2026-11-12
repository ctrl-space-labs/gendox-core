const { test, expect } = require('../../support/workspace');
const { call, ok, json, projectPath, taskPath, createTask, node, upload, complete, messages } = require('../../support/domain');

// Wire contracts shared by Jackson 2 and 3: assert JSON values, never mapper classes.
const isoInstant = value => {
    expect(typeof value).toBe('string');
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(Number.isNaN(Date.parse(value))).toBe(false);
};

test.describe('JSON API compatibility', { tag: '@json-contract' }, () => {
    test('project updates preserve camelCase, booleans, enums and ISO dates', async ({ api, workspace: w }) => {
        const project = await json(await call(api, w, 'get', projectPath(w)));
        project.description = 'Δοκιμή "JSON"\nsecond line';
        project.autoTraining = false;
        project.projectAgent.advancedSearchMode = 'OFF';
        project.futureClientField = { enabled: true };
        await ok(await call(api, w, 'put', projectPath(w), project));
        const stored = await json(await call(api, w, 'get', projectPath(w)));
        expect(stored).toMatchObject({ id: w.projectId, organizationId: w.organizationId,
            description: project.description, autoTraining: false, projectAgent: { advancedSearchMode: 'OFF' } });
        expect(stored).not.toHaveProperty('organization_id');
        expect(stored).not.toHaveProperty('futureClientField');
        expect(JSON.stringify(stored)).not.toContain('\"hibernateLazyInitializer\"');
        isoInstant(stored.createdAt);
        isoInstant(stored.updatedAt);
    });

    test('nested task JSON survives HTTP and JSONB round trips', async ({ api, workspace: w }) => {
        const task = await createTask(api, w);
        const value = { questionTitle: 'JSON contract', message: 'unicode Ω, quote " and newline\n',
            order: 1, answerFlagEnum: 'WARNING', insightConfig: { version: 1, answerMode: 'GENERATED_TEXT' },
            futureClientField: ['ignored'] };
        const created = await node(api, w, task.id, 'QUESTION', value);
        const read = await json(await call(api, w, 'get', `${projectPath(w)}/task-nodes?id=${created.id}`));
        expect(read.nodeValue).toMatchObject({ questionTitle: value.questionTitle, message: value.message,
            order: 1, answerFlagEnum: 'WARNING', insightConfig: value.insightConfig });
        expect(read.nodeValue).not.toHaveProperty('futureClientField');
        expect(read.nodeValue.answerValue).toBeNull();
        isoInstant(read.createdAt);
        await ok(await call(api, w, 'put', `${taskPath(w, task.id)}/task-nodes`, {
            id: created.id, taskId: task.id, nodeType: 'QUESTION', nodeValue: { ...value, message: null },
        }));
        const updated = await json(await call(api, w, 'get', `${projectPath(w)}/task-nodes?id=${created.id}`));
        // A null patch leaves the current message unchanged (the API merge contract).
        expect(updated.nodeValue.message).toBe(value.message);
        expect(updated.nodeValue.order).toBe(1);
    });

    test('null optional chat flags preserve their defaults', async ({ api, workspace: w }) => {
        const answer = await complete(api, w, 'Hello', { stream: null, clientToolResults: null, deepThinking: null });
        expect(typeof answer.threadId).toBe('string');
        const rows = await messages(api, w, answer.threadId);
        expect(rows.some(message => message.role === 'assistant' && message.value)).toBe(true);
    });

    test('tool-call JSON stays a JSON tree through persistence and a follow-up', async ({ api, workspace: w }) => {
        await upload(api, w);
        const answer = await complete(api, w, 'Find the least squares document');
        const rows = await messages(api, w, answer.threadId);
        const calling = rows.find(m => m.role === 'assistant' && m.toolCalls?.length);
        expect(Array.isArray(calling.toolCalls)).toBe(true);
        const tool = calling.toolCalls[0];
        expect(tool).toMatchObject({ type: 'function', function: { name: 'advanced_search' } });
        expect(typeof tool.function.arguments).toBe('string');
        const argumentsJson = JSON.parse(tool.function.arguments);
        expect(typeof argumentsJson).toBe('object');
        expect(typeof argumentsJson.search_query).toBe('string');
        isoInstant(calling.createdAt);
        await complete(api, w, 'What method does it describe?', { threadId: answer.threadId });
        const reloaded = await messages(api, w, answer.threadId);
        expect(reloaded.find(m => m.id === calling.id).toolCalls).toEqual(calling.toolCalls);
    });
});
