const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { inProject, apiResponse, expectOk } = require('../../../support/app');
const { field } = require('../../../support/v2/app');
const { call, json, orgPath } = require('../../../support/domain');

test.use({ storageState: sessionOf('testUser1') });
test.describe('V2 API keys', { tag: '@p2' }, () => {
    test('a new key is shown once, then masked, and Reveal shows it again', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'api-keys'));
        await page.getByRole('button', { name: 'Create key', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await field(dialog, 'Name').fill('Reveal in browser');
        const created = apiResponse(page, 'POST', /\/api-keys$/);
        await dialog.getByRole('button', { name: 'Create key', exact: true }).click();
        const response = await created;
        await expectOk(response);
        const key = (await response.json()).apiKey;
        expect(key).toMatch(/^gxsk-[0-9a-f]{64}$/);
        await expect(dialog.getByText(key, { exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(dialog).toBeHidden();

        // after a reload the list has only the last four characters
        await page.reload();
        const row = page.getByRole('row', { name: /Reveal in browser/ });
        await expect(row.getByText(`••••${key.slice(-4)}`, { exact: true })).toBeVisible();
        await expect(page.getByText(key, { exact: true })).toHaveCount(0);

        const revealed = apiResponse(page, 'POST', /\/api-keys\/[^/]+\/reveal$/);
        await row.getByRole('button', { name: 'Reveal key', exact: true }).click();
        await expectOk(await revealed);
        const revealDialog = page.getByRole('dialog');
        await expect(revealDialog.getByText('Revealing a key is recorded in the audit log.')).toBeVisible();
        await expect(revealDialog.getByText(key, { exact: true })).toBeVisible();
        await revealDialog.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(page.getByText(key, { exact: true })).toHaveCount(0);
    });

    test.describe('without the permission', () => {
        test.use({ storageState: sessionOf('testUser3'), workspaceOptions: { members: { testUser3: 'ROLE_EDITOR' } } });
        test('an editor sees no Reveal button', async ({ page, api, workspace: w }) => {
            // the owner made a key, so the list has a row to show
            const created = await json(await call(api, w, 'post', `${orgPath(w)}/api-keys`, { name: 'Owner key', durationInDays: 1 }));
            await page.goto(inProject(w, 'api-keys'));
            await expect(page.getByRole('heading', { name: 'API keys', exact: true })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Reveal key' })).toHaveCount(0);
            await expect(page.getByText(created.apiKey)).toHaveCount(0);
        });
    });
});
