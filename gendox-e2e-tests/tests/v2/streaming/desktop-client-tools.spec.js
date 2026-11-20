const fs = require('node:fs')
const path = require('node:path')
const { test, expect } = require('../../../support/workspace')

const hostSource = fs.readFileSync(path.resolve(__dirname, '../../../../gendox-desktop/src-tauri/src/client-tool-host.js'), 'utf8')

for (const declined of [false, true]) {
  test(`top-level client tool host resumes the chat after ${declined ? 'Cancel' : 'Run'}`, async ({ page, request }) => {
    await request.get('/__reset?mode=desktop')
    await page.addInitScript(({ source, declined }) => {
      window.nativeInvocations = []
      const install = (0, eval)(source + '; installClientToolHost')
      install({ folders: async () => ({ folders: ['/workspace'], working_directory: '/workspace', enforcement_available: true }), commandStatus: async () => ({ known: false }), activity: async () => {}, badge: async () => {}, deepLinks: async () => [], runCommand: async (request, executionId) => {
        window.nativeInvocations.push({ request, executionId })
        return declined ? { declined: true } : { exit_code: 0, stdout: 'gendox-native-command-check\n', stderr: '', duration_ms: 5 }
      } }, location.protocol + '//' + location.host)
    }, { source: hostSource, declined })
    await page.goto('/gendox/embed/embedded-chat/?organizationId=org&projectId=project&variant=panel')
    const message = page.getByRole('textbox', { name: 'Message', exact: true })
    await expect(message).toBeVisible()
    await message.fill('Check the native client tool')
    await message.press('Enter')
    await expect(page.getByRole('heading', { name: 'Run command on this computer?' })).toBeVisible()
    expect(await page.evaluate(() => window.nativeInvocations)).toHaveLength(0)
    await page.getByRole('button', { name: declined ? 'Don’t allow' : 'Allow', exact: true }).click()
    await expect(page.getByText('Tool-based answer.', { exact: true })).toBeVisible()
    const state = await (await request.get('/__state')).json()
    expect(state.requests).toHaveLength(2)
    expect(state.requests[0]).toMatchObject({ stream: true, clientToolResults: true })
    const desktop = state.requests[0].localContexts.find(context => context.contextType === 'GENDOX_DESKTOP')
    expect(JSON.parse(desktop.value)).toEqual({ source: 'gendox-desktop', approvalMode: 'ask', localCommandsAvailable: true })
    expect(state.requests[1].localContexts || []).toEqual([])
    expect(state.requests[1]).toMatchObject({ role: 'tool', stream: true })
    expect(state.requests[1].toolCallId).toBe(state.messages.find(message => message.toolCalls)?.toolCalls[0].id)
    expect(JSON.parse(state.requests[1].value)).toEqual(declined ? { declined: true } : {
      exit_code: 0, stdout: 'gendox-native-command-check\n', stderr: '', duration_ms: 5
    })
    const calls = await page.evaluate(() => window.nativeInvocations)
    expect(calls).toHaveLength(declined ? 0 : 1)
    if (!declined) {
    expect(calls[0].request.description).toBe('Print a harmless desktop integration check.')
    expect(calls[0].request.command).toMatch(/^(printf|Write-Output) /)
    }
    await page.reload()
    await expect(page.getByText('Tool-based answer.', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => window.nativeInvocations)).toHaveLength(0)
  })
}

test('a pending native call survives reload without executing twice', async ({ page, request }) => {
  await request.get('/__reset?mode=desktop')
  const cached = new Map()
  let finish
  let deliveries = 0
  let executions = 0
  await page.exposeFunction('runNativeCheck', (_request, executionId) => {
    deliveries++
    if (!cached.has(executionId)) {
      executions++
      cached.set(executionId, new Promise(resolve => { finish = resolve }))
    }
    return cached.get(executionId)
  })
  await page.addInitScript(source => {
    const install = (0, eval)(source + '; installClientToolHost')
    localStorage.setItem('gendox.client.preferences.v1', JSON.stringify({ mode: 'auto' }))
    install({ folders: async () => ({ folders: ['/workspace'], working_directory: '/workspace', enforcement_available: true }), commandStatus: async () => ({ known: false }), activity: async () => {}, badge: async () => {}, deepLinks: async () => [], runCommand: (request, executionId) => window.runNativeCheck(request, executionId) }, location.protocol + '//' + location.host)
  }, hostSource)
  await page.goto('/gendox/embed/embedded-chat/?organizationId=org&projectId=project&variant=panel')
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  await message.fill('Check reload recovery')
  await message.press('Enter')
  await expect.poll(() => executions).toBe(1)
  await page.reload()
  await expect.poll(() => deliveries).toBeGreaterThanOrEqual(2)
  expect(executions).toBe(1)
  finish({ exit_code: 0, stdout: 'once\n', stderr: '', duration_ms: 5 })
  await expect(page.getByText('Tool-based answer.', { exact: true })).toBeVisible()
  const state = await (await request.get('/__state')).json()
  expect(state.requests).toHaveLength(2)
  expect(state.requests[1]).toMatchObject({ role: 'tool', stream: true })
  expect(JSON.parse(state.requests[1].value).stdout).toBe('once\n')
  expect(executions).toBe(1)
})
