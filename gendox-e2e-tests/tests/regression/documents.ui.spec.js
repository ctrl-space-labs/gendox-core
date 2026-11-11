const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject } = require('../../support/app');
const { upload } = require('../../support/domain');

test.use({ storageState: sessionOf('testUser1') });
test.describe('Document browser regression', { tag: '@p1' }, () => {
    test('upload queue allows removing a selected file before sending', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'home'));
        await page.getByRole('button', { name: 'UPLOAD DOCUMENT' }).click();
        await page.locator('input[type=file]').setInputFiles(require('../../support/app').textFile);
        await expect(page.getByText('least-squares.txt', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: /Remove All|Clear All/i }).click();
        await expect(page.getByText('least-squares.txt', { exact: true })).not.toBeVisible();
    });

    test('document sections remain readable after reloading their direct URL', async ({ page, api, workspace: w }) => {
        const doc = await upload(api, w);
        await page.goto(inProject(w, 'document-instance') + `&documentId=${doc.id}`);
        await expect(page.getByRole('heading', { name: 'least-squares Document' })).toBeVisible();
        await expect(page.getByRole('main').getByText(/least squares/i).first()).toBeVisible();
        await page.reload();
        await expect(page.getByRole('main').getByText(/least squares/i).first()).toBeVisible();
    });
});
