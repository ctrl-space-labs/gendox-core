const fs = require('fs');
const path = require('path');
const config = require('../tests.config');
const target = require('../config/target');
const models = require('../config/models');
const { expect, tokenFor } = require('./workspace');
const { call, json, projectPath, messages } = require('./domain');

/**
 * Helpers for the LLM tests (tests/llm). They run once per provider of the model tier,
 * with the provider's models on the agent (config/models.js).
 *
 * Real models do not answer alike twice, so the tests check what a model must do, not
 * what it says:
 *   - a canary document holds an invented fact, QUOKKA-4182, that no model can know;
 *     an answer that contains it came from the document;
 *   - the agent's instructions say it is under test and must follow the message exactly;
 *   - the stored messages show the tool call, its arguments and its results.
 * With the mock models the same tests check the structure only: the mock answers with
 * a fixed text.
 */
const canary = {
    file: path.resolve(__dirname, '../fixtures/llm/halvorsen-archive.txt'),
    title: 'halvorsen-archive',
    code: /QUOKKA[\s-]?4182/i,
};

const instructions = [
    'You are the agent of an automated end-to-end test of this application. A program, not a person, reads your answers.',
    'Follow the instructions in each message exactly. When a message asks for a fact from the documents, call the advanced_search tool first and answer from its results only.',
    'Give only what the message asks for, in the form it asks for: no greeting, no explanation, no formatting.',
].join(' ');

/**
 * Sets the agent up for a test: the test instructions, and how it searches. Real models
 * search when they decide to (AUTO), which is what the test checks; the mock searches
 * only when it must (ALWAYS).
 */
const prepareAgent = async (api, w) => {
    const project = await json(await call(api, w, 'get', projectPath(w)));
    const agent = project.projectAgent;
    agent.agentBehavior = instructions;
    agent.advancedSearchMode = target.realModels ? 'AUTO' : 'ALWAYS';
    if (agent.completionModel?.supportsSamplingParams) agent.temperature = 0;
    await json(await call(api, w, 'put', projectPath(w), project));
    const stored = await json(await call(api, w, 'get', projectPath(w)));
    expect(stored.projectAgent.agentBehavior).toBe(instructions);
    return stored.projectAgent;
};

/**
 * Counts a request to the models against the run's budget (E2E_MAX_LLM_REQUESTS), shared
 * by all workers through a file the global setup empties. A request is one chat message
 * or one task run, whatever number of model calls it causes.
 */
const spend = (what) => {
    const file = path.join(config.authDir, 'llm-requests');
    fs.appendFileSync(file, `${what}\n`);
    const used = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length;
    const budget = models.budgetFor(target.models);
    if (used > budget) {
        throw new Error(`Model request budget used up: ${used} of ${budget} (E2E_MAX_LLM_REQUESTS). Not sending: ${what}`);
    }
};

// A chat message, with a fresh token: a test on real models can outlive the first one.
const ask = async (api, w, value, extra = {}) => {
    spend(`chat: ${value.slice(0, 60)}`);
    const token = await tokenFor(api, w.owner);
    return json(await call(api, w, 'post', `/messages/completions?projectId=${w.projectId}`, { value, ...extra }, token));
};

const thread = async (api, w, threadId) => messages(api, { ...w, ownerToken: await tokenFor(api, w.owner) }, threadId);

// The last answer of the assistant that is not a tool call.
const finalAnswer = rows => rows.filter(m => m.role === 'assistant' && !m.toolCalls?.length).at(-1)?.value || '';

// The answer comes from the canary document; with the mock, the mock answered.
const expectFromCanary = (text) => {
    if (target.realModels) expect(text, 'the answer holds the fact from the document').toMatch(canary.code);
    else expect(text).toContain('MOCK GEMINI RESPONSE');
};

const waitForJob = async (api, w, id) => {
    let job;
    await expect.poll(async () => {
        const token = await tokenFor(api, w.owner);
        const jobs = await json(await call(api, w, 'get', `${projectPath(w)}/jobs?jobExecutionIdsIn=${id}`, undefined, token));
        job = jobs.content.find(j => j.jobExecutionId === id);
        return job?.status;
    }, { timeout: target.realModels ? 180_000 : 45_000, intervals: [500, 1000, 2000] }).toMatch(/COMPLETED|FAILED|STOPPED|ABANDONED/);
    expect(job.status, `Job ${id} finished: ${JSON.stringify(job)}`).toBe('COMPLETED');
};

module.exports = { canary, instructions, prepareAgent, spend, ask, thread, finalAnswer, expectFromCanary, waitForJob };
