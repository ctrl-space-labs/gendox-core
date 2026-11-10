const { test, expect } = require('../../support/workspace');
const { sessionOf } = require('../../support/login');
const { inProject, apiResponse, expectOk, projectSettingsLoaded } = require('../../support/app');

test.use({ storageState: sessionOf('testUser1') });

// The mock model repeats the agent's instructions in its answer, so the chat shows
// whether a change made in the settings really reaches the agent.
// FIXME, not finished: the settings part works, but clicking Send in the chat does not
// send the question. See NOTES.md.
test.fixme('agent settings: change the instructions, keep them after a reload, see them used in chat', { tag: '@smoke' }, async ({ page, workspace }) => {
    const behavior = `You answer as the e2e agent ${Date.now().toString(36)}.`;

    await page.goto(inProject(workspace, 'project-settings'));
    await projectSettingsLoaded(page);
    await page.getByRole('tab', { name: 'AI AGENT' }).click();
    await expect(page.getByRole('combobox', { name: 'Completion Model' })).toHaveValue('MOCK_GEMINI');
    await expect(page.getByRole('combobox', { name: 'Semantic Search Model' })).toHaveValue('MOCK_GEMINI_EMBEDDING');

    await page.getByRole('textbox', { name: 'Agent Behavior' }).fill(behavior);
    await page.getByRole('spinbutton', { name: 'Max Tokens' }).fill('700');
    const saved = apiResponse(page, 'PUT', /\/projects\/[^/]+/);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expectOk(await saved);

    await page.reload();
    await projectSettingsLoaded(page);
    await page.getByRole('tab', { name: 'AI AGENT' }).click();
    await expect(page.getByRole('textbox', { name: 'Agent Behavior' })).toHaveValue(behavior);
    await expect(page.getByRole('spinbutton', { name: 'Max Tokens' })).toHaveValue('700');
    // The snippet for embedding the chat elsewhere belongs to this organization.
    await expect(page.getByRole('main').getByRole('textbox').filter({ hasText: 'gendox-chat-script' }))
        .toContainText(workspace.organizationId);

    await page.goto(inProject(workspace, 'chat'));
    await page.getByRole('textbox', { name: 'Ask anything...' }).fill('Who are you?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText(behavior).first()).toBeVisible({ timeout: 30_000 });
});
