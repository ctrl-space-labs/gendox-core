const fs = require('fs');
const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { apiResponse, expectOk, textFile } = require('../../../support/app');
const { openChat, send, mockAnswer } = require('../../../support/v2/app');
const { complete, upload } = require('../../../support/domain');
const embeddings = require('../../../page-objects/apis/embeddingsProject');

test.use({ storageState: sessionOf('testUser1') });
test.describe('V2 conversation regression', { tag: '@p1' }, () => {
    test('copy a persisted assistant answer', async ({ page, api, workspace: w }) => {
        const answer = await complete(api, w, 'An answer to copy');
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        await openChat(page, w, answer.threadId);
        await expect(mockAnswer(page)).toBeVisible();
        await page.getByRole('button', { name: 'Copy', exact: true }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('MOCK GEMINI RESPONSE');
    });

    test('attachment persists across follow-up, reload and download', async ({ page, api, workspace: w }) => {
        const answer = await complete(api, w, 'Start an attachment conversation');
        await openChat(page, w, answer.threadId);
        await expect(mockAnswer(page)).toBeVisible();
        const uploaded = apiResponse(page, 'POST', /\/documents\/upload-single$/);
        await page.locator('form').filter({ has: page.getByRole('textbox', { name: 'Message', exact: true }) }).locator('input[type=file]').setInputFiles(textFile);
        await expectOk(await uploaded);
        await send(page, 'Read the attached text', 2);
        await page.reload();
        const attachment = page.getByRole('button', { name: /least-squares/ }).first();
        await expect(attachment).toBeVisible();
        const [download] = await Promise.all([page.waitForEvent('download'), attachment.click()]);
        expect(await download.failure()).toBeNull();
        expect(fs.readFileSync(await download.path())).toEqual(fs.readFileSync(textFile));
    });

    test('Sources opens the retrieved document', { tag: '@blocked', annotation: { type: 'blocked', description: 'Ephemeral source-metadata database dependency returns HTTP 500; backend/schema changes are out of scope.' } }, async ({ page, api, workspace: w }) => {
        await upload(api, w);
        await expectOk(await embeddings.getProjectEmbeddings(api, w.ownerToken, w.projectId));
        const answer = await complete(api, w, 'Find the least squares document');
        await openChat(page, w, answer.threadId);
        await expect(mockAnswer(page)).toBeVisible();
        const metadata = apiResponse(page, 'GET', /\/message-metadata\//);
        await page.getByRole('button', { name: /^(Sources|\d+ sources?)$/ }).click();
        await expectOk(await metadata);
        const source = page.getByRole('link').filter({ hasText: 'least-squares' }).first();
        const [documentPage] = await Promise.all([page.waitForEvent('popup'), source.click()]);
        await expect(documentPage.getByRole('heading', { name: 'least-squares', exact: true })).toBeVisible();
        await expect(documentPage.getByText(/least squares/i).first()).toBeVisible();
        await documentPage.close();
    });
});
