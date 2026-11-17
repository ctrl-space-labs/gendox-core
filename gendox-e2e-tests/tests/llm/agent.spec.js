const { test, expect } = require('../../support/workspace');
const { call, ok, json, taskPath, upload, createTask, node } = require('../../support/domain');
const { canary, prepareAgent, spend, ask, thread, finalAnswer, expectFromCanary, waitForJob } = require('../../support/llm');
const embeddingsProject = require('../../page-objects/apis/embeddingsProject');
const target = require('../../config/target');

/**
 * The contract between the application and a model provider: embeddings, a tool the
 * model chooses to call, the tool history sent back on a follow-up, and a task run in
 * the background. Each runs once per provider of the tier, in the llm-<provider> project.
 *
 *   E2E_MODELS=mock    the mock models: structure only, free (the default, also locally)
 *   E2E_MODELS=small   a cheap model of every provider
 *   E2E_MODELS=large   each provider's flagship
 */
test.describe('LLM contract', { tag: ['@smoke', '@llm'] }, () => {
    test('chat: the model searches the documents, answers from them, and keeps the thread', async ({ api, workspace: w }) => {
        const document = await upload(api, w, canary.file);
        await ok(await embeddingsProject.getProjectEmbeddings(api, w.ownerToken, w.projectId));
        await prepareAgent(api, w);

        const first = await ask(api, w, 'Search the documents for the archive access code of the Halvorsen project. Reply with the code only.');
        const rows = await thread(api, w, first.threadId);
        const search = rows.find(m => m.role === 'tool' && m.name === 'advanced_search');
        expect(search, 'the model called advanced_search').toBeTruthy();
        const toolCall = rows.flatMap(m => m.toolCalls || []).find(c => c.function?.name === 'advanced_search' || c.name === 'advanced_search');
        expect(toolCall, 'the tool call is stored with the assistant message').toBeTruthy();
        expect(JSON.parse(search.value).sections.map(s => s.document_id), 'the search found the canary document').toContain(document.id);
        expectFromCanary(finalAnswer(rows));

        // The follow-up sends the stored tool call and its result back to the provider:
        // the part of an adapter that breaks most quietly.
        const second = await ask(api, w, 'Repeat the code from your previous answer in lower case letters. Reply with the code only.', { threadId: first.threadId });
        expect(second.threadId).toBe(first.threadId);
        const after = await thread(api, w, first.threadId);
        expect(after.filter(m => m.role === 'user')).toHaveLength(2);
        const answer = finalAnswer(after);
        if (target.realModels) expect(answer, 'the model followed the instruction to use lower case').toMatch(/quokka[\s-]?4182/);
        else expect(answer).toContain('MOCK GEMINI RESPONSE');
    });

    test('Document Insights: a task answers a question about a document in the background', async ({ api, workspace: w }) => {
        const document = await upload(api, w, canary.file);
        await prepareAgent(api, w);
        const task = await createTask(api, w, 'DOCUMENT_INSIGHTS', 'LLM contract insights');
        const documentNode = await node(api, w, task.id, 'DOCUMENT', { documentMetadata: { documentTitle: document.title } }, { documentId: document.id });
        const question = await node(api, w, task.id, 'QUESTION', {
            questionTitle: 'Access code',
            message: 'What is the archive access code of the Halvorsen project? Answer with the code only.',
            order: 1,
            insightConfig: { version: 1, answerMode: 'GENERATED_TEXT' },
        });
        const selection = { documentNodeIds: [documentNode.id], questionNodeIds: [question.id] };

        spend('task: Document Insights');
        const job = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/execute`, { ...selection, reGenerateExistingAnswers: false }));
        await waitForJob(api, w, job);
        const answers = await json(await call(api, w, 'post', `${taskPath(w, task.id)}/answers/batch`, selection));
        // A job whose model calls failed still completes, with no answer: this is where it shows.
        expect(answers.content.length, 'the completed job stored an answer (none: its model calls failed, see the API log)').toBeGreaterThan(0);
        expectFromCanary(JSON.stringify(answers.content));
    });
});
