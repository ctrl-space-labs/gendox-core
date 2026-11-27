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
    const approval = page.getByRole('region', { name: 'Run this command on your computer?' })
    await expect(approval).toBeVisible()
    const approvedCommand = await approval.locator('pre').textContent()
    const activity = page.locator('details').filter({ has: page.getByText('1 tool call', { exact: true }) })
    await expect(activity).toHaveJSProperty('open', true)
    expect(await page.evaluate(() => window.nativeInvocations)).toHaveLength(0)
    await approval.getByRole('button', { name: declined ? 'Don’t allow' : 'Run', exact: true }).click()
    await expect(page.getByText('Tool-based answer.', { exact: true })).toBeVisible()
    await expect(activity).toHaveJSProperty('open', false)
    await activity.getByText('1 tool call', { exact: true }).click()
    await activity.getByText('Print a harmless desktop integration check.', { exact: true }).click()
    await expect(activity.locator('pre').first()).toHaveText(approvedCommand)
    if (declined) {
      await expect(activity.getByText('Declined', { exact: true }).first()).toBeVisible()
    } else {
      await expect(activity.getByLabel('Output', { exact: true })).toHaveText('gendox-native-command-check\n')
    }
    const state = await (await request.get('/__state')).json()
    expect(state.requests).toHaveLength(2)
    expect(state.requests[0]).toMatchObject({ stream: true, clientToolResults: true })
    const desktop = state.requests[0].localContexts.find(context => context.contextType === 'GENDOX_DESKTOP')
    expect(JSON.parse(desktop.value)).toEqual({ source: 'gendox-desktop', approvalMode: 'ask', localCommandsAvailable: true, clientTools: ['run_command'] })
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
    await expect(activity).toHaveJSProperty('open', false)
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

for (const allowed of [true, false]) {
  test(`a tool marked Ask before running reaches the host only after ${allowed ? 'Allow' : 'Don’t allow'}`, async ({ page, request }) => {
    await request.get('/__reset?mode=approval')
    await page.addInitScript(source => {
      window.lookups = []
      window.maxApprovalCards = 0
      new MutationObserver(() => {
        const count = document.querySelectorAll('section[aria-label="Lookup?"]').length
        window.maxApprovalCards = Math.max(window.maxApprovalCards, count)
      }).observe(document, { childList: true, subtree: true })
      const install = (0, eval)(source + '; installClientToolHost')
      const host = install({ folders: async () => null, commandStatus: async () => ({ known: false }), activity: async () => {}, badge: async () => {}, deepLinks: async () => [] }, location.protocol + '//' + location.host)
      host.registerTool('lookup', async args => { window.lookups.push(args); return { found: 3 } })
    }, hostSource)
    await page.goto('/gendox/embed/embedded-chat/?organizationId=org&projectId=project&variant=panel')
    const message = page.getByRole('textbox', { name: 'Message', exact: true })
    await message.fill('Look up an order')
    await message.press('Enter')
    const card = page.getByRole('region', { name: 'Lookup?' })
    await expect(card).toBeVisible()
    await expect(card.getByRole('term')).toHaveText('Query')
    await expect(card.getByRole('definition')).toHaveText('order')
    expect(await page.evaluate(() => window.lookups)).toHaveLength(0)
    await card.getByRole('button', { name: allowed ? 'Allow' : 'Don’t allow', exact: true }).click()
    await expect(page.getByText('Tool-based answer.', { exact: true })).toBeVisible()
    await page.getByText('1 tool call', { exact: true }).click()
    await page.getByText('Lookup', { exact: true }).last().click()
    await expect(page.getByRole('group', { name: 'Input', exact: true }).locator('dt')).toHaveText('query')
    await expect(page.getByRole('group', { name: 'Input', exact: true }).locator('dd')).toHaveText('order')
    if (allowed) {
      await expect(page.getByRole('group', { name: 'Result', exact: true }).locator('dd')).toHaveText('3')
    }
    expect(await page.evaluate(() => window.maxApprovalCards)).toBe(1)
    const state = await (await request.get('/__state')).json()
    expect(state.requests).toHaveLength(2)
    expect(JSON.parse(state.requests[1].value)).toEqual(
      allowed ? { found: 3 } : { declined: true, message: 'The user did not allow this tool call. Nothing ran.' }
    )
    expect(await page.evaluate(() => window.lookups)).toEqual(allowed ? [{ query: 'order' }] : [])
  })
}

test('a running command shows its output as it arrives, and Stop reaches the app', async ({ page, request }) => {
  await request.get('/__reset?mode=desktop')
  let finish
  await page.exposeFunction('runLongCommand', () => new Promise(resolve => { finish = resolve }))
  await page.addInitScript(source => {
    window.stops = 0
    const install = (0, eval)(source + '; installClientToolHost')
    localStorage.setItem('gendox.client.preferences.v1', JSON.stringify({ mode: 'auto' }))
    install({ folders: async () => ({ folders: ['/workspace'], working_directory: '/workspace', enforcement_available: true }), commandStatus: async () => ({ known: false }), activity: async () => {}, badge: async () => {}, deepLinks: async () => [], stop: async () => { window.stops++ }, runCommand: (_request, executionId) => {
      const output = text => window.dispatchEvent(new CustomEvent('gendox.native', { detail: { type: 'command-output', executionId, stream: 'stdout', text } }))
      setTimeout(() => output('building step 1\n'), 50)
      setTimeout(() => output('building step 2\n'), 100)
      return window.runLongCommand()
    } }, location.protocol + '//' + location.host)
  }, hostSource)
  await page.goto('/gendox/embed/embedded-chat/?organizationId=org&projectId=project&variant=panel')
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  await message.fill('Run the build')
  await message.press('Enter')
  const card = page.getByRole('region', { name: 'Command running on this computer' })
  await expect(card).toContainText('building step 1')
  await expect(card).toContainText('building step 2')
  await expect(card).toContainText(/Running on this computer · \d+ s/)
  await card.getByRole('button', { name: 'Stop', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.stops)).toBe(1)
  finish({ exit_code: 130, stdout: 'building step 1\nbuilding step 2\n', stderr: 'Command stopped by the user; its process tree was ended.', duration_ms: 400 })
  await expect(page.getByText('Tool-based answer.', { exact: true })).toBeVisible()
  await expect(card).toBeHidden()
  await page.getByText('1 tool call', { exact: true }).click()
  await page.getByText('Print a harmless desktop integration check.', { exact: true }).click()
  const output = page.getByLabel('Output', { exact: true })
  await expect(output).toBeVisible()
  expect(await output.textContent()).toBe('building step 1\nbuilding step 2\n')
  await expect(page.getByLabel('Standard error', { exact: true })).toContainText('Command stopped by the user')
  const state = await (await request.get('/__state')).json()
  expect(JSON.parse(state.requests[1].value).exit_code).toBe(130)
})
