const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk } = require('../../support/app');
const { upload } = require('../../support/domain');
const config = require('../../tests.config');

test.use({ storageState: sessionOf('testUser1') });
test.describe('Search, profile and embedding', { tag: '@p2' }, () => {
    test('global search finds the project agent and navigates to chat', async ({ page, workspace: w }) => {
        await page.goto(inProject(w, 'home'));
        await page.getByText('Global Search', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByPlaceholder('Search', { exact: true }).fill(w.name);
        await dialog.getByText(`${w.name} project Agent`, { exact: true }).click();
        await expect(page).toHaveURL(/\/chat\//);
        await expect(page.getByRole('textbox', { name: 'Ask anything...' })).toBeVisible();
    });

    test('global document search returns an uploaded document and opens it', async ({ page, api, workspace: w }) => {
        await upload(api, w);
        await expectOk(await require('../../page-objects/apis/embeddingsProject').getProjectEmbeddings(api, w.ownerToken, w.projectId));
        await page.goto(inProject(w, 'home'));
        await page.getByText('Global Search', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByText('Documents', { exact: true }).click();
        await dialog.getByPlaceholder('Search', { exact: true }).fill('least squares');
        await dialog.getByText('least-squares', { exact: true }).first().click();
        await expect(page).toHaveURL(/document-instance/);
        await expect(page.getByRole('heading', { name: 'least-squares Document' })).toBeVisible();
    });

    test('profile displays the authenticated identity and organization navigation', async ({ page }) => {
        await page.goto('/gendox/user-profile/');
        await expect(page.getByText('Test User1', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(/testuser1@test.com/).first()).toBeVisible();
        await expect(page.getByRole('tab').first()).toBeVisible();
    });

    test('real embedded chat sends a message through the iframe and displays the saved answer', async ({ page, workspace: w }) => {
        const host = `${config.frontendURL}/e2e-embed-host/`;
        await page.route(host, route => route.fulfill({ contentType: 'text/html', body:
            `<!doctype html><title>E2E embed host</title><h1>Embed host</h1><script id="gendox-chat-script" src="${config.frontendURL}/gendox-sdk/gendox-widget-plugin.js" data-gendox-src="${config.frontendURL}" data-organization-id="${w.organizationId}" data-project-id="${w.projectId}" data-gendox-chat-initial-state="open"></script>` }));
        await page.goto(host);
        const chat = page.frameLocator('#gendox-chat-iframe-id');
        await expect(chat.getByRole('textbox', { name: 'Ask anything...' })).toBeVisible();
        await expect(chat.locator('#chat-conversation-header').getByText(`${w.name} project Agent`, { exact: true })).toBeVisible();
        const completed = apiResponse(page, 'POST', /\/messages\/completions$/);
        await chat.getByRole('textbox', { name: 'Ask anything...' }).fill('Hello from the real embedded chat');
        await chat.getByRole('button', { name: 'Send', exact: true }).click();
        await expectOk(await completed);
        await expect(chat.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toBeVisible({ timeout: 30_000 });
        await expect(page.getByRole('heading', { name: 'Embed host' })).toBeVisible();
    });
});
