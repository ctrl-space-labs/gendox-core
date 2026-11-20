const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { apiResponse, expectOk } = require('../../../support/app');
const { openChat, mockAnswer } = require('../../../support/v2/app');
const { complete, upload, createTask, messages } = require('../../../support/domain');

test.use({ storageState: sessionOf('testUser1') });

test('the sidebar marks the focused chat; New chat opens one tab per click', async ({ page, api, workspace: w }) => {
    const first = await complete(api, w, 'First saved conversation');
    const second = await complete(api, w, 'Second saved conversation');
    const recent = id => page.locator(`.recents a[href$="#/chat/${id}"]`);
    const selected = page.locator('.recents a[aria-current="page"]');

    await openChat(page, w, first.threadId);
    await expect(recent(first.threadId)).toHaveAttribute('aria-current', 'page');
    await recent(second.threadId).click();
    await expect(recent(second.threadId)).toHaveAttribute('aria-current', 'page');
    await expect(selected).toHaveCount(1);

    // a slow CPU: the page handles #/chat/new twice, and on a fast one both new chats get the same id and merge
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    const tabs = page.locator('.tab');
    const before = await tabs.count();
    for (let i = 1; i <= 2; i++) {
        await page.getByRole('link', { name: 'New chat', exact: true }).click();
        await expect(tabs).toHaveCount(before + i);
        await expect(selected).toHaveCount(0);
    }

    await page.getByRole('navigation').getByRole('link', { name: 'Tasks', exact: true }).click();
    await expect(selected).toHaveCount(0);
});

test('a mentioned task and document are sent as links with their ids', async ({ page, api, workspace: w }) => {
    const document = await upload(api, w);
    const task = await createTask(api, w, 'DOCUMENT_INSIGHTS', 'T12 b');
    await openChat(page, w);
    const input = page.getByRole('textbox', { name: 'Message', exact: true });

    await input.fill('Read the results of @T12 b');
    await expect(page.getByRole('option', { name: 'T12 b' })).toBeVisible();
    await input.press('Enter');
    await expect(input).toHaveValue('Read the results of @T12 b ');
    await expect(page.getByRole('listbox')).toHaveCount(0);

    await input.pressSequentially('and @least');
    await page.getByRole('option', { name: /least-squares/ }).click();
    await expect(input).toHaveValue(/^Read the results of @T12 b and @least-squares\S* $/);

    const response = apiResponse(page, 'POST', /\/messages\/completions$/);
    await input.press('Enter');
    const sent = await response;
    await expectOk(sent);
    const value = sent.request().postDataJSON().value;
    expect(value).toContain(`[@T12 b](/gendox/tasks/document-insights?taskId=${task.id})`);
    expect(value).toContain(`(/gendox/document-instance?documentId=${document.id})`);
    await expect(mockAnswer(page)).toBeVisible();

    await expect(page).toHaveURL(/#\/chat\/[a-f0-9-]{36}$/i);
    const threadId = page.url().split('#/chat/')[1];
    expect((await messages(api, w, threadId)).find(m => m.role === 'user').value).toBe(value);
    await page.reload();
    await expect(page.locator('main').getByRole('link', { name: '@T12 b', exact: true })).toBeVisible();
});

test('the mention picker ignores email addresses and closes with Escape', async ({ page, workspace: w }) => {
    await openChat(page, w);
    const input = page.getByRole('textbox', { name: 'Message', exact: true });

    await input.fill('Email person@example.com');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await input.fill('@no-such-document-or-task');
    await expect(page.getByRole('status')).toHaveText('No matching tasks or documents.');
    await input.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);

    await input.fill('');
    await page.getByRole('button', { name: 'Mention a task or document (@)', exact: true }).click();
    await expect(input).toHaveValue('@');
    await expect(page.getByRole('listbox')).toBeVisible();
});
