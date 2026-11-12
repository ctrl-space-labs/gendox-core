const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { inProject, expectOk } = require('../../../support/app');
const { upload } = require('../../../support/domain');
const embeddings = require('../../../page-objects/apis/embeddingsProject');
const config = require('../../../tests.config');

test.use({ storageState: sessionOf('testUser1') });
test.describe('V2 documents', { tag: '@p1' }, () => {
    test('unsupported files are rejected before upload', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'knowledge'));
        await page.getByRole('button', { name: 'Upload files', exact: true }).first().click();
        const dialog = page.getByRole('dialog');
        await dialog.locator('input[type=file]').setInputFiles({ name: 'unsupported.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('Synthetic unsupported fixture') });
        await expect(dialog.getByText('EXE files can’t be uploaded.', { exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
        await expect(page.getByRole('row', { name: /unsupported/ })).toHaveCount(0);
    });

    test('document sections remain readable through a direct link and reload', async ({ page, api, workspace: w }) => {
        const doc = await upload(api, w);
        await page.goto(inProject(w, 'document-instance') + `&documentId=${doc.id}`);
        await expect(page.getByRole('heading', { name: 'least-squares', exact: true })).toBeVisible();
        await expect(page.getByText(/least squares/i).first()).toBeVisible();
        await page.reload();
        await expect(page.getByText(/least squares/i).first()).toBeVisible();
    });
});

test.describe('V2 search, profile and embedding', { tag: '@p2' }, () => {
    test('global search opens the selected agent workspace', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'knowledge'));
        await page.getByRole('button', { name: /Search ⌘K/ }).click();
        const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
        await dialog.getByPlaceholder('Search agents, documents, pages…').fill(w.name);
        await dialog.getByRole('link', { name: new RegExp(`${w.name} project`) }).click();
        await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible();
        expect(new URL(page.url()).searchParams.get('projectId')).toBe(w.projectId);
    });

    test('global document search opens the retrieved document', async ({ page, api, workspace: w }) => {
        await upload(api, w);
        await expectOk(await embeddings.getProjectEmbeddings(api, w.ownerToken, w.projectId));
        await page.goto(inProject(w, 'knowledge'));
        await page.getByRole('button', { name: /Search ⌘K/ }).click();
        const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
        await dialog.getByPlaceholder('Search agents, documents, pages…').fill('least squares');
        await dialog.getByRole('link').filter({ hasText: 'least-squares' }).first().click();
        await expect(page.getByRole('heading', { name: 'least-squares', exact: true })).toBeVisible();
        await expect(page.getByText(/least squares/i).first()).toBeVisible();
    });

    test('profile displays the current identity and organizations', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'user-profile'));
        await expect(page.getByRole('heading', { name: 'Test User1', exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('testuser1@test.com');
        await expect(page.getByRole('heading', { name: 'Organizations', exact: true })).toBeVisible();
    });

    test('real embedded chat sends and restores a saved answer', async ({ page, workspace: w }) => {
        const host = `${config.frontendURL}/e2e-embed-host/`;
        await page.route(host, route => route.fulfill({ contentType: 'text/html', body:
            `<!doctype html><title>E2E embed host</title><h1>Embed host</h1><script id="gendox-chat-script" src="${config.frontendURL}/gendox-sdk/gendox-widget-plugin.js" data-gendox-src="${config.frontendURL}" data-organization-id="${w.organizationId}" data-project-id="${w.projectId}" data-gendox-chat-initial-state="open"></script>` }));
        await page.goto(host);
        const chat = page.frameLocator('#gendox-chat-iframe-id');
        await chat.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello from the v2 widget');
        await chat.getByRole('button', { name: 'Send', exact: true }).click();
        await expect(chat.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByRole('heading', { name: 'Embed host', exact: true })).toBeVisible();
        await page.reload();
        await expect(chat.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toBeVisible();
    });
});
