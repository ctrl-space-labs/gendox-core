const { test, expect } = require('../../support/workspace');
const { call, ok, json, projectPath, taskPath, createTask, node, upload } = require('../../support/domain');

test.describe('Task lifecycle', { tag: '@p2' }, () => {
    for (const type of ['DOCUMENT_INSIGHTS', 'DOCUMENT_DIGITIZATION', 'EARTH_OBSERVATION', 'DEEP_RESEARCH']) {
        test(`${type}: create, rename, duplicate and remove`, async ({ api, workspace: w }) => {
            const task = await createTask(api, w, type, `Original ${type}`);
            expect(task.taskType.name).toBe(type);
            await ok(await call(api, w, 'put', taskPath(w, task.id), { id: task.id, projectId: w.projectId, type, title: `Renamed ${type}`, description: 'Updated description' }));
            const stored = await json(await call(api, w, 'get', taskPath(w, task.id)));
            expect(stored).toMatchObject({ title: `Renamed ${type}`, description: 'Updated description' });
            const copy = await json(await call(api, w, 'post', `${taskPath(w)}/duplicate`, { taskId: task.id, newTitle: `Copy ${type}`, newDescription: 'Duplicated', keepQuestions: false, keepDocuments: false }));
            expect(copy.id).not.toBe(task.id);
            const listed = await json(await call(api, w, 'get', `${taskPath(w)}?size=100`));
            expect(listed.content.map(t => t.id)).toContain(copy.id);
            await ok(await call(api, w, 'delete', taskPath(w, copy.id)));
            expect((await json(await call(api, w, 'get', taskPath(w)))).content.map(t => t.id)).not.toContain(copy.id);
        });
    }

    test('task filtering and pagination return only matching tasks', async ({ api, workspace: w }) => {
        await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Alpha task');
        const target = await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Beta target');
        const filtered = await json(await call(api, w, 'get', `${taskPath(w)}?taskNameContains=Beta&size=1`));
        expect(filtered.content.map(t => t.id)).toEqual([target.id]);
    });

    test('questions, document nodes and duplication preserve task configuration', { tag: '@p1' }, async ({ api, workspace: w }) => {
        const doc = await upload(api, w);
        const task = await createTask(api, w);
        const question = await node(api, w, task.id, 'QUESTION', { questionTitle: 'Method', message: 'Describe least squares', order: 1, insightConfig: { version: 1, answerMode: 'GENERATED_TEXT' } });
        const document = await node(api, w, task.id, 'DOCUMENT', { documentMetadata: { documentTitle: doc.title } }, { documentId: doc.id });
        const listed = await json(await call(api, w, 'get', `${taskPath(w, task.id)}/task-nodes`));
        expect(listed.content.map(n => n.id)).toEqual(expect.arrayContaining([question.id, document.id]));
        const copy = await json(await call(api, w, 'post', `${taskPath(w)}/duplicate`, { taskId: task.id, newTitle: 'With questions and documents', keepQuestions: true, keepDocuments: true }));
        const nodes = await json(await call(api, w, 'get', `${taskPath(w, copy.id)}/task-nodes`));
        expect(nodes.content.filter(n => n.nodeType.name === 'QUESTION')).toHaveLength(1);
        expect(nodes.content.filter(n => n.nodeType.name === 'DOCUMENT')).toHaveLength(1);
        expect(nodes.content.map(n => n.id)).not.toContain(question.id);
    });

    test('question edits persist and removal refreshes the task', { tag: '@p1' }, async ({ api, workspace: w }) => {
        const task = await createTask(api, w);
        const first = await node(api, w, task.id, 'QUESTION', { questionTitle: 'First', message: 'First question', order: 1 });
        const second = await node(api, w, task.id, 'QUESTION', { questionTitle: 'Second', message: 'Second question', order: 2 });
        await ok(await call(api, w, 'put', `${taskPath(w, task.id)}/task-nodes`, { id: first.id, taskId: task.id, nodeType: 'QUESTION', nodeValue: { questionTitle: 'Edited', message: 'Edited question', order: 1 } }));
        const edited = await json(await call(api, w, 'get', `${projectPath(w)}/task-nodes?id=${first.id}`));
        expect(edited.nodeValue).toMatchObject({ questionTitle: 'Edited', message: 'Edited question' });
        await ok(await call(api, w, 'delete', `${projectPath(w)}/task-nodes/${second.id}`));
        const remaining = await json(await call(api, w, 'get', `${taskPath(w, task.id)}/task-nodes`));
        expect(remaining.content.map(n => n.id)).toEqual([first.id]);
    });
});
