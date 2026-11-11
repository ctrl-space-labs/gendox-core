const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk, textFile } = require('../../support/app');
const documents = require('../../page-objects/apis/documents');
const embeddingsProject = require('../../page-objects/apis/embeddingsProject');
const { openChat, send } = require('../../support/chat');
const { messages } = require('../../support/domain');

test.use({ storageState: sessionOf('testUser1') });

// The main path of the product: a document goes in, is split and embedded, and the
// agent answers a question about it. The project uses the mock models.
//
// Splitting is asked for through the API. In the application it is the Training button,
// which queues a background job that can take a minute: training.spec.js covers that.
test('document to answer: upload, read the sections, ask in chat', { tag: '@smoke' }, async ({ page, api, workspace }) => {
    await page.goto(inProject(workspace, 'home'));
    await page.getByRole('button', { name: 'UPLOAD DOCUMENT' }).click();
    await page.getByText('Maximum file size').waitFor();
    await page.locator('input[type=file]').setInputFiles(textFile);
    const uploaded = apiResponse(page, 'POST', /\/documents\/upload$/);
    await page.getByRole('button', { name: 'Upload Files' }).click();
    await expectOk(await uploaded);
    await expect(page.getByRole('link', { name: 'least-squares' })).toBeVisible();

    await expectOk(await documents.splitDocumentSections(api, workspace.ownerToken, workspace.organizationId, workspace.projectId));

    await page.getByRole('link', { name: 'least-squares' }).click();
    await expect(page.getByRole('heading', { name: 'least-squares Document' })).toBeVisible();
    await expect(page.getByRole('main').getByText(/least squares/i).first()).toBeVisible();

    await expectOk(await embeddingsProject.getProjectEmbeddings(api, workspace.ownerToken, workspace.projectId));
    await openChat(page, workspace);
    await send(page, 'What are the drawbacks of least squares?', 1);
    await expect(page.getByText('calling advanced_search', { exact: true })).toBeVisible();
    await page.getByText('calling advanced_search', { exact: true }).click();
    await expect(page.getByText('↳ result', { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/threadId=/);
    const threadId = new URL(page.url()).searchParams.get('threadId');

    await send(page, 'How does that relate to outliers in the same document?', 2);
    expect(new URL(page.url()).searchParams.get('threadId')).toBe(threadId);
    const stored = await messages(api, workspace, threadId);
    expect(stored.filter(m => m.role === 'user').map(m => m.value)).toEqual([
        'What are the drawbacks of least squares?',
        'How does that relate to outliers in the same document?',
    ]);
    expect(stored.filter(m => m.role === 'tool' && m.name === 'advanced_search')).toHaveLength(2);

    await page.reload();
    await expect(page.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toHaveCount(2);
});
