const { expect } = require('../workspace');
const { inProject, apiResponse, expectOk } = require('../app');

// Some v2 labels are visual siblings, not associated <label for> controls.
// Scope by that visible label; do not depend on field order or generated classes.
const field = (scope, label, role = 'textbox') => scope.getByText(label, { exact: true })
    .locator('..').getByRole(role);
const section = (page, name) => page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });
const mockAnswer = page => page.getByRole('main').getByText('MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING', { exact: true });
const openChat = async (page, w, threadId) => {
    await page.goto(inProject(w, 'agent-home'));
    await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible();
    if (threadId) await page.getByRole('link').and(page.locator(`a[href$="#/chat/${threadId}"]`)).click();
};
const send = async (page, question, count) => {
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill(question);
    const response = apiResponse(page, 'POST', /\/messages\/completions$/);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expectOk(await response);
    await expect(mockAnswer(page)).toHaveCount(count, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Copy', exact: true })).toHaveCount(count);
};
module.exports = { field, section, mockAnswer, openChat, send };
