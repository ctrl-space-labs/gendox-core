const { expect } = require('./workspace');
const { inProject, apiResponse, expectOk } = require('./app');

const openChat = async (page, workspace, threadId) => {
    await page.goto(inProject(workspace, 'chat') + (threadId ? `&threadId=${threadId}` : ''));
    await expect(page.locator('#chat-conversation-header').getByText(`${workspace.name} project Agent`, { exact: true })).toBeVisible();
};
const send = async (page, question, answerCount) => {
    const completed = apiResponse(page, 'POST', /\/messages\/completions$/);
    await page.getByRole('textbox', { name: 'Ask anything...' }).fill(question);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expectOk(await completed);
    await expect(page.getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true })).toHaveCount(answerCount, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
};
module.exports = { openChat, send };
