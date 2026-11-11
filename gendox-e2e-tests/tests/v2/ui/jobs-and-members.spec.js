const { test, expect, createWorkspace, removeWorkspace } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { inProject, apiResponse, expectOk, textFile } = require('../../../support/app');
const { call, ok, json, projectPath, upload, createTask } = require('../../../support/domain');

test.use({ storageState: sessionOf('testUser1') });

test('V2 Document Insights selects documents, adds a question and generates a saved answer', { tag: ['@p1', '@background'] }, async ({ page, api, workspace: w }) => {
    test.setTimeout(240_000);
    await upload(api, w);
    const task = await createTask(api, w, 'DOCUMENT_INSIGHTS', 'Browser insights');
    await page.goto(inProject(w, 'tasks/document-insights') + `&taskId=${task.id}`);
    await expect(page.getByRole('heading', { name: 'Browser insights', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Add documents', exact: true }).first().click();
    const picker = page.getByRole('dialog');
    await picker.getByRole('checkbox', { name: 'Pick least-squares', exact: true }).check();
    await picker.getByRole('button', { name: 'Add 1 document', exact: true }).click();
    await expect(picker).toHaveCount(0);
    await page.getByRole('button', { name: 'Add questions', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Column name', exact: true }).fill('Description');
    await page.getByRole('combobox', { name: 'Answer as', exact: true }).selectOption('GENERATED_TEXT');
    await page.getByRole('textbox', { name: 'Question', exact: true }).fill('What is least squares?');
    await page.getByRole('button', { name: 'Add question', exact: true }).click();
    const generate = page.getByRole('button', { name: 'Generate missing', exact: true });
    await expect(generate).toBeEnabled();
    await generate.click();
    const started = apiResponse(page, 'POST', /\/execute$/);
    await page.getByRole('dialog').getByRole('button', { name: 'Generate', exact: true }).click();
    await expectOk(await started);
    await expect(page.getByText('Mock insight', { exact: true }).first()).toBeVisible({ timeout: 180_000 });
    await page.reload();
    await page.getByText('Mock insight', { exact: true }).first().click();
    await expect(page.getByText(/MOCK GEMINI RESPONSE: deterministic document insight/).first()).toBeVisible();
});

test('V2 Process now indexes uploaded knowledge for answers', { tag: ['@p1', '@background'] }, async ({ page, api, workspace: w }) => {
    test.setTimeout(240_000);
    // The browser's create-agent wizard enables processing by default. The API-only
    // workspace fixture leaves it null; the training job selects enabled projects.
    const project = await json(await call(api, w, 'get', projectPath(w)));
    await ok(await call(api, w, 'put', projectPath(w), { ...project, autoTraining: true }));
    const doc = await upload(api, w, textFile, false);
    expect(await json(await call(api, w, 'get', `/documents/${doc.id}/sections`))).toEqual([]);
    await page.goto(inProject(w, 'agent-settings'));
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${w.name} project`);
    const started = apiResponse(page, 'GET', /\/splitting\/training$/);
    await page.getByRole('button', { name: 'Process now', exact: true }).click();
    await expectOk(await started);
    await expect(page.getByText('Processing started. Documents will be ready in a few minutes.', { exact: true })).toBeVisible();
    await expect.poll(async () => {
        const found = await json(await call(api, w, 'post', `/messages/search?projectId=${w.projectId}&size=10`, { value: 'least squares' }));
        return found.map(s => s.documentInstanceDTO?.id);
    }, { timeout: 180_000, intervals: [1000, 2000, 3000] }).toContain(doc.id);
    await page.goto(inProject(w, 'document-instance') + `&documentId=${doc.id}`);
    await expect(page.getByRole('heading', { name: 'least-squares', exact: true })).toBeVisible();
    await expect(page.getByText(/least squares/i).first()).toBeVisible();
});

test.describe('V2 members and roles', () => {
    test.use({ workspaceOptions: { members: { testUser4: 'ROLE_READER' } } });
    test('reader appears in member lists, reads knowledge and cannot edit or enter another organization', { tag: '@p1' }, async ({ page, browser, api, workspace: w }) => {
        await upload(api, w);
        await page.goto(inProject(w, 'organization-members'));
        await expect(page.getByRole('row', { name: /testuser4@test\.com/ }).getByText('Reader', { exact: true })).toBeVisible();
        await expect(page.getByRole('row', { name: /testuser1@test\.com/ }).getByText('Owner', { exact: true })).toBeVisible();
        await page.goto(inProject(w, 'agent-members'));
        await expect(page.getByRole('row', { name: /testuser4@test\.com/ }).getByText('Reader', { exact: true })).toBeVisible();
        const context = await browser.newContext({ storageState: sessionOf('testUser4') });
        const reader = await context.newPage();
        try {
            await reader.goto(inProject(w, 'knowledge'));
            await expect(reader.getByRole('row', { name: /least-squares/ })).toBeVisible();
            await reader.goto(inProject(w, 'agent-settings'));
            await expect(reader.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue('Created by the tests');
            await expect(reader.getByRole('textbox', { name: 'Description', exact: true })).toBeDisabled();
            const foreign = await createWorkspace(api, 'v2 members foreign', { owner: 'testUser2' });
            const note = { type: 'kept organization', description: `${foreign.name} (${foreign.organizationId})` };
            test.info().annotations.push(note);
            await reader.goto(inProject(foreign, 'agent-settings'));
            await expect(reader).toHaveURL(/\/404\/?$/);
            await removeWorkspace(api, foreign);
            test.info().annotations.splice(test.info().annotations.indexOf(note), 1);
        } finally {
            await context.close();
        }
    });
});
