const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk } = require('../../support/app');

test.use({ storageState: sessionOf('testUser1') });

test('written document: create it in the editor, add a section, read it back', { tag: '@smoke' }, async ({ page, workspace }) => {
    await page.goto(inProject(workspace, 'create-document'));
    const fields = page.getByRole('main').getByRole('textbox');
    await fields.nth(0).fill('Written by a test');
    await fields.nth(1).fill('# Notes\n\nThis text was typed in the editor.');
    await page.getByRole('button', { name: 'Save Document' }).click();

    await page.waitForURL(/\/gendox\/home\//);
    await page.getByRole('link', { name: 'Written by a test' }).click();
    await expect(page.getByRole('heading', { name: 'Written by a test Document' })).toBeVisible();

    await page.getByRole('button', { name: 'Edit Document Sections' }).first().click();
    await page.getByRole('button', { name: 'Add new Section' }).first().click();

    // A section saves by itself, a second after the last change.
    const title = page.getByRole('textbox', { name: 'Section Title' });
    await expect(title).toBeVisible();
    const saved = apiResponse(page, 'PUT', /\/sections\//);
    await title.fill('Added by a test');
    await page.getByRole('main').getByRole('textbox').last().fill('This section was added in the browser.');
    await expectOk(await saved);
    await expect(async () => {
        await page.reload();
        await expect(page.getByRole('main').getByText('This section was added in the browser.')).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 20_000 });
});
