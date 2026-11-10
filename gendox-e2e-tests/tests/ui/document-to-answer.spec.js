const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk, textFile } = require('../../support/app');
const documents = require('../../page-objects/apis/documents');

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

    await page.goto(inProject(workspace, 'chat'));
    // The chat clears the input and drops the message when the agent is not set yet, so wait
    // until the header shows the agent before typing.
    await expect(page.getByText(`${workspace.name} project Agent`).first()).toBeVisible();
    await page.getByRole('textbox', { name: 'Ask anything...' }).fill('What are the drawbacks of least squares?');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('What are the drawbacks of least squares?').first()).toBeVisible();
    await expect(page.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING').first()).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/threadId=/);
    await expect(page.getByRole('heading', { name: 'Threads' })).toBeVisible();
});
