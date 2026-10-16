const { test, expect } = require('@playwright/test')

async function openChat(page, request, mode) {
  await request.get(`/__reset?mode=${mode}`)
  await page.goto('/test-host')
  const chat = page.frameLocator('#gendox-chat-iframe-id')
  await expect(chat.getByPlaceholder('Ask anything...')).toBeVisible()
  return chat
}

test('renders answer deltas before the final message and retains reasoning', async ({ page, request }) => {
  const chat = await openChat(page, request, 'plain')
  await chat.getByPlaceholder('Ask anything...').fill('question')
  await chat.getByPlaceholder('Ask anything...').press('Enter')
  await expect(chat.getByText('First', { exact: true })).toBeVisible()
  await expect(chat.getByText('First second.', { exact: true })).toBeVisible()
  await expect(chat.getByText('First second.', { exact: true })).toHaveCount(1)
  await chat.getByText('Show thinking', { exact: true }).click()
  await expect(chat.getByText('Working through the evidence.', { exact: true })).toBeVisible()
  const state = await (await request.get('/__state')).json()
  expect(state.requests[0]).toMatchObject({ stream: true, clientToolResults: true, value: 'question' })
})

test('awaits a host Promise and submits a tool message through the same endpoint', async ({ page, request }) => {
  const chat = await openChat(page, request, 'client')
  await chat.getByPlaceholder('Ask anything...').fill('look up order')
  await chat.getByPlaceholder('Ask anything...').press('Enter')
  await expect(chat.getByText('Tool-based answer.', { exact: true })).toBeVisible()
  const state = await (await request.get('/__state')).json()
  expect(state.requests).toHaveLength(2)
  expect(state.requests[1]).toMatchObject({ role: 'tool', toolCallId: 'call', stream: true })
  expect(JSON.parse(state.requests[1].value)).toMatchObject({ status: 'shipped', query: 'order' })
  expect(await page.evaluate(() => window.toolExecutions)).toBe(1)
  await page.reload()
  await expect(page.frameLocator('#gendox-chat-iframe-id').getByText('Tool-based answer.', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.toolExecutions)).toBe(0)
})

test('navigation preserves the thread, shows generating status and recovers the saved answer', async ({ page, request }) => {
  const chat = await openChat(page, request, 'navigation')
  await chat.getByPlaceholder('Ask anything...').fill('navigate')
  await chat.getByPlaceholder('Ask anything...').press('Enter')
  await page.waitForURL('**/test-host?resumed=1')
  const resumed = page.frameLocator('#gendox-chat-iframe-id')
  await expect(resumed.getByText('Generating…', { exact: true })).toBeVisible()
  await expect(resumed.getByText('Answer recovered after navigation.', { exact: true })).toBeVisible({ timeout: 15000 })
  const state = await (await request.get('/__state')).json()
  expect(state.requests).toHaveLength(1)
})
