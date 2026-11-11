const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { inProject, apiResponse, expectOk, textFile } = require('../../../support/app');
const { field, section, openChat, send, mockAnswer } = require('../../../support/v2/app');
const { call, json, projectPath, messages } = require('../../../support/domain');
const documents = require('../../../page-objects/apis/documents');
const embeddings = require('../../../page-objects/apis/embeddingsProject');

test.use({ storageState: sessionOf('testUser1') });
test.describe('V2 browser smoke', { tag: '@smoke' }, () => {
    test('organization legal name survives a reload', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'organization-settings'));
        const name = field(page, 'Legal name');
        await expect(name).toHaveValue(w.name);
        await name.fill(`${w.name} renamed`);
        const saved = apiResponse(page, 'PUT', /\/organizations\/[^/]+$/);
        await section(page, 'Invoice details').getByRole('button', { name: 'Save', exact: true }).click();
        await expectOk(await saved);
        await page.reload();
        await expect(name).toHaveValue(`${w.name} renamed`);
    });

    test('API key creation appears after a reload', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'api-keys'));
        await page.getByRole('button', { name: 'Create key', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await field(dialog, 'Name').fill('smoke key');
        const created = apiResponse(page, 'POST', /\/api-keys$/);
        await dialog.getByRole('button', { name: 'Create key', exact: true }).click();
        await expectOk(await created);
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await page.reload();
        await expect(page.getByRole('row', { name: /smoke key/ })).toBeVisible();
    });

    test('create Document Insights and reopen the saved task', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'tasks'));
        await page.getByRole('button', { name: 'New task', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Smoke insights');
        const created = apiResponse(page, 'POST', /\/tasks$/);
        await dialog.getByRole('button', { name: 'Create task', exact: true }).click();
        await expectOk(await created);
        await expect(page.getByRole('heading', { name: 'Smoke insights', exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Smoke insights', exact: true })).toBeVisible();
    });

    test.describe('agent creation', () => {
        test.use({ storageState: sessionOf('testUser3'), workspaceOptions: { owner: 'testUser3', project: false } });
        test('create an agent and enter its workspace', async ({ page, api, workspace: w }) => {
            const name = `${w.name} agent`;
            await page.goto(`/gendox/create-project/?organizationId=${w.organizationId}`);
            await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
            await page.getByRole('textbox', { name: 'What is it for?', exact: true }).fill('Created by smoke');
            const created = apiResponse(page, 'POST', /\/projects$/);
            await page.getByRole('button', { name: 'Create agent', exact: true }).click();
            const response = await created;
            await expectOk(response);
            const project = await response.json();
            await expect(page.getByRole('heading', { name: `${name} is ready`, exact: true })).toBeVisible();
            await page.getByRole('link', { name: 'Skip for now', exact: true }).click();
            await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible();
            const stored = await json(await call(api, { ...w, projectId: project.id }, 'get', projectPath({ ...w, projectId: project.id })));
            expect(stored).toMatchObject({ name, description: 'Created by smoke' });
        });
    });

    test.describe('reader access', () => {
        test.use({ storageState: sessionOf('testUser4'), workspaceOptions: { members: { testUser4: 'ROLE_READER' } } });
        test('reader sees settings as read-only', async ({ page, api, workspace: w }) => {
            await page.goto(inProject(w, 'agent-settings'));
            const description = page.getByRole('textbox', { name: 'Description', exact: true });
            await expect(description).toHaveValue('Created by the tests');
            await expect(description).toBeDisabled();
            await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
            expect((await json(await call(api, w, 'get', projectPath(w)))).description).toBe('Created by the tests');
        });
    });

    test('upload knowledge, read sections, send a question and follow-up with tools', async ({ page, api, workspace: w }) => {
        await page.goto(inProject(w, 'knowledge'));
        await page.getByRole('button', { name: 'Upload files', exact: true }).first().click();
        const dialog = page.getByRole('dialog');
        const uploaded = apiResponse(page, 'POST', /\/documents\/upload$/);
        await dialog.locator('input[type=file]').setInputFiles(textFile);
        await expectOk(await uploaded);
        await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
        await expect(page.getByRole('row', { name: /least-squares/ })).toBeVisible();
        await expectOk(await documents.splitDocumentSections(api, w.ownerToken, w.organizationId, w.projectId));
        await expectOk(await embeddings.getProjectEmbeddings(api, w.ownerToken, w.projectId));
        await page.getByRole('row', { name: /least-squares/ }).getByText('least-squares', { exact: true }).click();
        await page.getByRole('link', { name: 'Open', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'least-squares', exact: true })).toBeVisible();
        await expect(page.getByText(/least squares/i).last()).toBeVisible();
        await openChat(page, w);
        await send(page, 'What are the drawbacks of least squares?', 1);
        await page.getByText('Used advanced_search', { exact: true }).click();
        await expect(page.getByText('↳ result', { exact: true }).first()).toBeVisible();
        await expect(page).toHaveURL(/#\/chat\/[0-9a-f-]{36}$/);
        const threadId = page.url().split('#/chat/')[1];
        await send(page, 'How does that relate to outliers?', 2);
        expect(page.url().split('#/chat/')[1]).toBe(threadId);
        const saved = await messages(api, w, threadId);
        expect(saved.filter(m => m.role === 'user')).toHaveLength(2);
        expect(saved.filter(m => m.role === 'tool' && m.name === 'advanced_search')).toHaveLength(2);
        await page.reload();
        await expect(mockAnswer(page)).toHaveCount(2);
    });

    test('agent instructions persist and can be used in chat', async ({ page, api, workspace: w }) => {
        await page.goto(inProject(w, 'agent-behavior'));
        const instructions = section(page, 'Instructions').getByRole('textbox');
        await expect(instructions).toBeEnabled();
        await instructions.fill('Answer questions from the test knowledge clearly.');
        const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+$/);
        await page.getByRole('button', { name: 'Save changes', exact: true }).click();
        await expectOk(await saved);
        await page.reload();
        await expect(instructions).toHaveValue('Answer questions from the test knowledge clearly.');
        expect((await json(await call(api, w, 'get', projectPath(w)))).projectAgent.completionModel.model).toBe('mock-gemini-2.0-flash');
        await openChat(page, w);
        await send(page, 'Hello from the saved agent', 1);
    });

    test('write a document and read its processed content after reload', async ({ page, api, workspace: w }) => {
        await page.goto(inProject(w, 'create-document'));
        await page.getByRole('textbox', { name: 'Document title' }).fill('Written smoke document');
        await page.getByPlaceholder('Write here…').fill('## Saved section\n\nThis is a saved smoke document.');
        const uploaded = apiResponse(page, 'POST', /\/documents\/upload$/);
        await page.getByRole('button', { name: 'Save to knowledge' }).click();
        await expectOk(await uploaded);
        await expect(page.getByRole('row', { name: /Written smoke document/ })).toBeVisible();
        await expectOk(await documents.splitDocumentSections(api, w.ownerToken, w.organizationId, w.projectId));
        await page.getByRole('row', { name: /Written smoke document/ }).getByText('Written smoke document', { exact: true }).click();
        await page.getByRole('link', { name: 'Open', exact: true }).click();
        await expect(page.getByText('This is a saved smoke document.', { exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByText('This is a saved smoke document.', { exact: true })).toBeVisible();
    });
});
