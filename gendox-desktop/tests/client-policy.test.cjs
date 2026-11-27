const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const moduleOf = name => import(pathToFileURL(path.resolve(__dirname, '../../gendox-frontend-v2/src/utils/clientTools', name)))
const args = { command: 'printf check', description: 'Check permissions' }
const completed = { exit_code: 0, stdout: 'check', stderr: '', duration_ms: 1 }
const settle = () => new Promise(setImmediate)
async function runtime(options = {}) {
  const { createCommandRunner } = await moduleOf('commandRunner.js')
  return createCommandRunner({ native: { runCommand: async () => completed }, preferences: () => ({ mode: 'ask' }), approve: async () => true, changed() {}, ...options })
}
test('Ask waits for an explicit frontend decision before native execution', async () => {
  let allow, calls = 0
  const flow = await runtime({ native: { runCommand: async () => { calls++; return completed } }, approve: () => new Promise(resolve => { allow = resolve }) })
  const result = flow.execute(args, 'one', { threadId: 'thread' })
  await settle(); assert.equal(calls, 0)
  allow(true); assert.deepEqual(await result, completed); assert.equal(calls, 1)
})
test('decline and Plan execute nothing; malformed calls cannot bypass validation', async () => {
  const native = { runCommand: () => assert.fail('native execution before approval') }
  const flow = await runtime({ native, approve: async () => false })
  assert.deepEqual(await flow.execute(args, 'decline'), { declined: true })
  const plan = await runtime({ native, preferences: () => ({ mode: 'plan' }) })
  assert.deepEqual(await plan.execute(args, 'plan'), { declined: true })
  assert.equal((await flow.execute({ command: 'x' }, 'malformed')).exit_code, -1)
})
test('Auto still asks for folders and declining the native confirmation never retries', async () => {
  let asks = 0, calls = 0
  const flow = await runtime({ preferences: () => ({ mode: 'auto' }), approve: () => assert.fail('No second prompt'), native: { runCommand: async () => { calls++; return { permission_required: true, directory: '/other' } }, chooseFolder: async () => { asks++; return { chosen: false } } } })
  assert.deepEqual(await flow.execute(args, 'auto'), { declined: true }); assert.equal(asks, 1); assert.equal(calls, 1)
})
test('folder retries need explicit approval and a new replay ID', async () => {
  const ids = [], approvals = [], denied = { permission_required: true, directory: '/requested' }
  const flow = await runtime({ preferences: () => ({ mode: 'auto' }), native: { runCommand: async (_args, id) => { ids.push(id); return ids.length === 1 ? denied : completed }, chooseFolder: async directory => { approvals.push(directory); return { chosen: true } } } })
  assert.deepEqual(await flow.execute(args, 'retry'), completed); assert.deepEqual(ids, ['retry', 'retry:retry:1']); assert.deepEqual(approvals, ['/requested'])
})
test('a denied retry returns without asking for a folder again', async () => {
  const ids = []
  const denied = { permission_required: true, directory: '/requested' }
  const flow = await runtime({
    preferences: () => ({ mode: 'auto' }),
    native: {
      runCommand: async (_request, id) => { ids.push(id); return denied },
      chooseFolder: async directory => { assert.equal(directory, denied.directory); return { chosen: true } }
    }
  })
  assert.deepEqual(await flow.execute(args, 'folder-denied'), denied)
  assert.deepEqual(ids, ['folder-denied', 'folder-denied:retry:1'])
})
test('switching to Plan while approval is pending prevents execution', async () => {
  let mode = 'ask'
  const flow = await runtime({ preferences: () => ({ mode }), native: { runCommand: () => assert.fail('Plan must not execute') }, approve: async () => { mode = 'plan'; return true } })
  assert.deepEqual(await flow.execute(args, 'plan-switch'), { declined: true })
})
test('corrupt and unknown persisted modes default to Ask', async () => {
  const { readPreferences } = await moduleOf('preferences.js')
  for (const value of ['{bad', '{"mode":"bypass"}', 'null']) assert.equal(readPreferences({ getItem: () => value }).mode, 'ask')
})
test('notifications are opt-in, suppressed when visible, generic and deduplicated', async () => {
  const { createNotificationService } = await moduleOf('notificationRules.js')
  const delivered = [], badges = [], opened = []
  let enabled = false, visible = false
  const service = createNotificationService({ preferences: () => ({ notifications: enabled, answerNotifications: true, approvalNotifications: true }), visible: () => visible, deliver: event => delivered.push(event), badge: n => badges.push(n), openThread: target => opened.push(target) })
  const event = { id: 'one', kind: 'answer', threadId: 'thread', projectId: 'project', organizationId: 'org', command: 'secret', message: 'private answer' }
  assert.equal(await service.publish(event), false)
  enabled = true; visible = true; assert.equal(await service.publish({ ...event, id: 'two' }), false)
  visible = false; assert.equal(await service.publish({ ...event, id: 'three' }), true); assert.equal(await service.publish({ ...event, id: 'three' }), false)
  assert.equal(delivered.length, 1); assert.ok(!JSON.stringify(delivered).includes('secret')); assert.ok(!JSON.stringify(delivered).includes('private answer'))
  delivered[0].onClick(); assert.equal(opened[0].threadId, 'thread'); assert.equal(badges.at(-1), 0)
})
test('only an observed completion transition notifies', async () => {
  const { completedThreads } = await moduleOf('notificationRules.js')
  const thread = { threadId: 't', messages: [{ role: 'assistant', messageId: 'answer' }] }, done = { main: { currentThread: thread, completionStatus: 'COMPLETED' } }
  assert.deepEqual(completedThreads({}, done), []); assert.equal(completedThreads({ main: { currentThread: thread, completionStatus: 'GENERATING' } }, done).length, 1); assert.deepEqual(completedThreads(done, done), [])
})
test('deep links only open scoped conversations', async () => {
  const { conversationFromLink } = await moduleOf('deepLinks.js')
  assert.deepEqual(conversationFromLink('gendox://chat/thread?organizationId=org&projectId=project'), { threadId: 'thread', organizationId: 'org', projectId: 'project' })
  for (const value of ['https://evil.example', 'gendox://server/change', 'gendox://chat/../../server', 'gendox://user:password@chat/thread', 'gendox://chat/thread?organizationId=org&projectId=%2Fserver']) assert.equal(conversationFromLink(value), null)
})

test('desktop context is capability metadata only and never labels browser widgets as desktop', async () => {
  const { desktopMessageContext } = await moduleOf('desktopContext.js')
  const device = { preferences: { mode: 'auto' }, folders: { enforcement_available: true, working_directory: '/private/work', folders: ['/private/work'] }, notes: 'private saved notes' }
  assert.equal(desktopMessageContext(null, device), null)
  const context = desktopMessageContext({}, device)
  assert.equal(context.contextType, 'GENDOX_DESKTOP')
  assert.deepEqual(JSON.parse(context.value), { source: 'gendox-desktop', approvalMode: 'auto', localCommandsAvailable: true, clientTools: ['run_command'] })
  assert.ok(!context.value.includes('/private/work'))
  assert.ok(!context.value.includes('private saved notes'))
  assert.deepEqual(JSON.parse(desktopMessageContext({}, { preferences: { mode: 'bypass' } }).value), { source: 'gendox-desktop', approvalMode: 'ask', localCommandsAvailable: false, clientTools: [] })
  // Plan offers the agent no local commands at all
  assert.deepEqual(JSON.parse(desktopMessageContext({}, { ...device, preferences: { mode: 'plan' } }).value).clientTools, [])
})
test('shell permission errors return without guessing which folder to grant', async () => {
  for (const stderr of ['Operation not permitted', 'Read-only file system', 'Permission denied']) {
    const denied = { ...completed, exit_code: 1, stderr }
    const flow = await runtime({ preferences: () => ({ mode: 'auto' }), native: {
      runCommand: async () => denied,
      chooseFolder: () => assert.fail('A shell error does not identify a folder to grant')
    } })
    assert.deepEqual(await flow.execute(args, stderr), denied)
  }
})
test('timeout_seconds reaches native execution only within the limit', async () => {
  const { MAX_TIMEOUT_SECONDS } = await moduleOf('commandRunner.js')
  const requests = []
  const flow = await runtime({ native: { runCommand: async request => { requests.push(request); return completed } } })
  assert.deepEqual(await flow.execute({ ...args, timeout_seconds: 900 }, 'long'), completed)
  assert.equal(requests[0].timeout_seconds, 900)
  for (const timeout_seconds of [0, -1, 1.5, '60', MAX_TIMEOUT_SECONDS + 1]) {
    assert.equal((await flow.execute({ ...args, timeout_seconds }, `bad-${timeout_seconds}`)).exit_code, -1)
  }
  assert.equal(requests.length, 1)
})
test('a call replayed after the app was closed is answered as such and never run or asked', async () => {
  const { APP_CLOSED } = await moduleOf('commandRunner.js')
  const replays = []
  const flow = await runtime({
    approve: () => assert.fail('a closed-app call must not ask'),
    native: {
      commandStatus: async (_request, _id, replayed) => { replays.push(replayed); return { known: false, closed: replayed } },
      runCommand: () => assert.fail('a closed-app call must not run')
    }
  })
  assert.deepEqual(await flow.execute(args, 'old', { threadId: 'thread', replayed: true }), APP_CLOSED)
  assert.deepEqual(replays, [true])
})
test('the runner reports which command starts and ends, for the live output card', async () => {
  const changes = []
  const flow = await runtime({ changed: change => changes.push(change) })
  await flow.execute(args, 'live', { threadId: 'thread' })
  assert.deepEqual(changes.map(({ running, executionId, command }) => [running, executionId, command]), [[true, 'live', 'printf check'], [false, 'live', undefined]])
})
test('a command the agent owner marked Ask before running still asks in Auto', async () => {
  let asks = 0
  const flow = await runtime({ preferences: () => ({ mode: 'auto' }), approve: async () => { asks++; return false } })
  assert.deepEqual(await flow.execute(args, 'owner-asks', { threadId: 'thread', requiresApproval: true }), { declined: true })
  assert.equal(asks, 1)
  assert.deepEqual(await flow.execute(args, 'auto-runs', { threadId: 'thread' }), completed)
  assert.equal(asks, 1)
})
test('tool arguments are shown as lines a person reads', async () => {
  const { argumentFields } = await moduleOf('approvalAnswers.js')
  assert.deepEqual(argumentFields('{"url":"https://example.com","tabs":2}'), [
    { label: 'Url', value: 'https://example.com' },
    { label: 'Tabs', value: '2' }
  ])
  assert.deepEqual(argumentFields('not json'), [{ label: 'Input', value: 'not json' }])
})
