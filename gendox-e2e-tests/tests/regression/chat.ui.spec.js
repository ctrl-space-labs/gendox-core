const fs = require('fs');
const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { openChat, send } = require('../../support/chat');
const { complete, upload } = require('../../support/domain');
const { apiResponse, expectOk, textFile } = require('../../support/app');
const embeddingsProject = require('../../page-objects/apis/embeddingsProject');

test.use({ storageState: sessionOf('testUser1') });
test.describe('Chat browser regression', { tag: '@p1' }, () => {
    test('chat Sources opens the retrieved document', { tag: '@smoke' }, async ({ page, api, workspace: w }) => {
        await upload(api, w);
        await expectOk(await embeddingsProject.getProjectEmbeddings(api, w.ownerToken, w.projectId));
        const answer = await complete(api, w, 'What are the drawbacks of least squares?');
        await openChat(page, w, answer.threadId);
        await expect(page.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toBeVisible();
        const metadata = apiResponse(page, 'GET', /\/message-metadata\//);
        await page.getByText('Sources', { exact: true }).last().click();
        await expectOk(await metadata);
        const source = page.getByRole('button').filter({ hasText: 'least-squares' }).first();
        const [documentPage] = await Promise.all([page.waitForEvent('popup'), source.click()]);
        await expect(documentPage).toHaveURL(/document-instance/);
        await expect(documentPage.getByRole('heading', { name: 'least-squares Document' })).toBeVisible();
        await expect(documentPage.getByRole('main').getByText(/least squares/i).first()).toBeVisible();
        await documentPage.close();
    });

    test('copy a saved assistant answer', async ({ page, api, workspace: w }) => {
        const answer = await complete(api, w, 'An answer to copy');
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        await openChat(page, w, answer.threadId);
        await expect(page.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Copy', exact: true }).last().click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('MOCK GEMINI RESPONSE');
    });

    test('attach a file to a follow-up, reload the thread and download the original bytes', async ({ page, api, workspace: w }) => {
        const answer = await complete(api, w, 'Start an attachment conversation');
        await openChat(page, w, answer.threadId);
        await expect(page.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toBeVisible();
        const uploaded = apiResponse(page, 'POST', /\/documents\/upload-single$/);
        await page.locator('input[type=file]').setInputFiles(textFile);
        const response = await uploaded;
        await expectOk(response);
        const document = await response.json();
        await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
        await send(page, 'Read the attached text', 2);
        await page.reload();
        const attachment = page.getByTitle(document.title, { exact: true }).first();
        await expect(attachment).toBeVisible();
        const [download] = await Promise.all([page.waitForEvent('download'), attachment.click()]);
        expect(await download.failure()).toBeNull();
        expect(fs.readFileSync(await download.path())).toEqual(fs.readFileSync(textFile));
    });
});
