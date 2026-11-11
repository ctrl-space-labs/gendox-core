const path = require('path');
const { test, expect } = require('../../support/workspace');
const { call, ok, json, projectPath, taskPath, upload, createTask, node } = require('../../support/domain');

const waitForJob = async (api, w, id) => {
    let job;
    await expect.poll(async () => {
        const jobs = await json(await call(api, w, 'get', `${projectPath(w)}/jobs?jobExecutionIdsIn=${id}`));
        job = jobs.content.find(j => j.jobExecutionId === id);
        return job?.status;
    }, { timeout: 180_000, intervals: [500, 1000, 2000] }).toMatch(/COMPLETED|FAILED|STOPPED|ABANDONED/);
    expect(job.status, `Job ${id} finished: ${JSON.stringify(job)}`).toBe('COMPLETED');
};

test.describe('Scheduled task generation', { tag: '@background' }, () => {
    test('Document Insights generates an answer and exports it as CSV', { tag: '@p1' }, async ({ api, workspace: w }) => {
        test.setTimeout(240_000);
        const doc = await upload(api, w);
        const task = await createTask(api, w);
        const document = await node(api, w, task.id, 'DOCUMENT', { documentMetadata: { documentTitle: doc.title } }, { documentId: doc.id });
        const question = await node(api, w, task.id, 'QUESTION', { questionTitle: 'Method', message: 'Describe least squares', order: 1, insightConfig: { version: 1, answerMode: 'GENERATED_TEXT' } });
        const id = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/execute`, { documentNodeIds: [document.id], questionNodeIds: [question.id], reGenerateExistingAnswers: false }));
        await waitForJob(api, w, id);
        const answers = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/answers/batch`, { documentNodeIds: [document.id], questionNodeIds: [question.id] }));
        expect(answers.content.length).toBeGreaterThan(0);
        expect(JSON.stringify(answers.content)).toContain('MOCK GEMINI RESPONSE');
        const csv = await ok(await call(api, w, 'get', `${taskPath(w, task.id)}/insights/export-csv`));
        expect(await csv.text()).toContain('MOCK GEMINI RESPONSE');
        const again = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/execute`, { documentNodeIds: [document.id], questionNodeIds: [question.id], reGenerateExistingAnswers: true }));
        await waitForJob(api, w, again);
        const regenerated = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/answers/batch`, { documentNodeIds: [document.id], questionNodeIds: [question.id] }));
        expect(regenerated.content.length).toBe(answers.content.length);
    });

    test('Document Digitization processes a PDF with the mock model and exports the output', { tag: '@p2' }, async ({ api, workspace: w }) => {
        test.setTimeout(240_000);
        const doc = await upload(api, w, path.resolve(__dirname, '../../fixtures/formats/sample.pdf'));
        const task = await createTask(api, w, 'DOCUMENT_DIGITIZATION');
        const document = await node(api, w, task.id, 'DOCUMENT', { documentMetadata: { documentTitle: doc.title } }, { documentId: doc.id });
        const id = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/execute`, { documentNodeIds: [document.id], pageFrom: 1, pageTo: 1, reGenerateExistingAnswers: false }));
        await waitForJob(api, w, id);
        const csv = await ok(await call(api, w, 'get', `${taskPath(w, task.id)}/documents/${document.id}/digitization/export-csv`));
        expect(await csv.text()).toContain('MOCK GEMINI RESPONSE');
    });

    test('invalid job selection is rejected before a background job starts', { tag: '@p1' }, async ({ api, workspace: w }) => {
        const response = await call(api, w, 'get', `${projectPath(w)}/splitting/training?jobName=DOES_NOT_EXIST&projectId=${w.projectId}`);
        expect(response.status()).toBe(400);
        expect((await response.json()).errorCode).toBe('INVALID_JOB_NAME');
    });
});
