const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const script = fs.readFileSync(path.join(__dirname, '../src-tauri/src/client-tools.js'), 'utf8')
const REQUEST = 'gendox.events.chat.message.tool_calls.request'
const RESPONSE = 'gendox.events.chat.message.tool_calls.response'
const READY = 'gendox.events.chat.message.tool_calls.ready'
const ACK = 'gendox.events.chat.message.tool_calls.ack'
const origin = 'tauri://localhost'
const completed = { exit_code: 0, stdout: 'done\n', stderr: '', duration_ms: 5 }
const settle = async () => { await new Promise(setImmediate); await new Promise(setImmediate) }

function setup(invoke = async () => completed, { frame = false, remote = false } = {}) {
  const listeners = []
  const sent = []
  const window = {
    addEventListener: (type, listener) => { if (type === 'message') listeners.push(listener) },
    postMessage: (data, targetOrigin) => sent.push({ data, targetOrigin })
  }
  window.top = frame ? {} : window
  const context = { window, location: { protocol: remote ? 'https:' : 'tauri:', host: remote ? 'remote.example' : 'localhost' } }
  const install = vm.runInNewContext(script, context)
  const host = install(invoke, origin)
  const deliver = (type, payload, overrides = {}) => listeners.forEach(listener => listener({
    source: window, origin, isTrusted: true, data: { type, payload }, ...overrides
  }))
  return { window, host, sent, deliver, install, responses: () => sent.filter(entry => entry.data.type === RESPONSE) }
}

function call(overrides = {}) {
  return {
    id: 'call', threadId: 'thread', turnId: 'turn', messageId: 'message', execution: 'CLIENT',
    function: { name: 'run_command', arguments: JSON.stringify({ command: 'echo done', description: 'Print a check' }) },
    ...overrides
  }
}

test('returns the native result through the existing client-tool protocol', async () => {
  const invoked = []
  const host = setup(async (...args) => { invoked.push(args); return completed })
  host.deliver(READY, { threadId: 'thread' })
  host.deliver(REQUEST, [call()])
  await settle()
  assert.deepEqual(JSON.parse(JSON.stringify(invoked[0][0])), { command: 'echo done', description: 'Print a check' })
  assert.equal(invoked[0][1], JSON.stringify(['thread', 'turn', 'call']))
  const response = host.responses()[0]
  assert.equal(response.targetOrigin, origin)
  assert.deepEqual(JSON.parse(response.data.payload[0].value), completed)
  assert.equal(response.data.payload[0].toolCallId, 'call')
  assert.equal(response.data.payload[0].turnId, 'turn')
})

test('queues a declined result until the new thread installs its listener', async () => {
  const host = setup(async () => ({ declined: true }))
  host.deliver(REQUEST, [call()])
  await settle()
  assert.equal(host.responses().length, 0)
  host.deliver(READY, { threadId: 'other-thread' })
  assert.equal(host.responses().length, 0)
  host.deliver(READY, { threadId: 'thread' })
  assert.deepEqual(JSON.parse(host.responses()[0].data.payload[0].value), { declined: true })
  host.deliver(ACK, { threadId: 'thread', turnId: 'turn', toolCallId: 'call' })
  host.deliver(READY, { threadId: 'thread' })
  assert.equal(host.responses().length, 1)
})

test('deduplicates requests while running and after acknowledgment', async () => {
  let finish
  let invocations = 0
  const host = setup(() => { invocations++; return new Promise(resolve => { finish = resolve }) })
  host.deliver(READY, { threadId: 'thread' })
  host.deliver(REQUEST, [call(), call()])
  await settle()
  assert.equal(invocations, 1)
  finish(completed)
  await settle()
  host.deliver(ACK, { threadId: 'thread', turnId: 'turn', toolCallId: 'call' })
  host.deliver(REQUEST, [call()])
  await settle()
  assert.equal(invocations, 1)
  assert.equal(host.responses().length, 2)
})

test('serializes commands and does not dispatch unregistered or ACTION tools', async () => {
  const order = []
  let finish
  const host = setup((args) => {
    order.push(args.command)
    return args.command === 'first' ? new Promise(resolve => { finish = resolve }) : Promise.resolve(completed)
  })
  const first = call({ function: { name: 'run_command', arguments: { command: 'first', description: 'First' } } })
  const second = call({ id: 'second', function: { name: 'run_command', arguments: { command: 'second', description: 'Second' } } })
  host.deliver(REQUEST, [first, second, call({ id: 'action', execution: 'ACTION' }), call({ id: 'unknown', function: { name: 'unknown', arguments: '{}' } })])
  await settle()
  assert.deepEqual(order, ['first'])
  finish(completed)
  await settle()
  assert.deepEqual(order, ['first', 'second'])
})

test('answers malformed known-tool arguments without invoking native code', async () => {
  let invoked = false
  const host = setup(async () => { invoked = true; return completed })
  host.deliver(READY, { threadId: 'thread' })
  host.deliver(REQUEST, [call({ function: { name: 'run_command', arguments: '{broken' } }), call({ id: 'missing-description', function: { name: 'run_command', arguments: { command: 'echo done' } } })])
  await settle()
  assert.equal(invoked, false)
  assert.equal(host.responses().length, 2)
  assert.equal(JSON.parse(host.responses()[1].data.payload[0].value).exit_code, -1)
})

test('native failures still produce a completed tool-result shape', async () => {
  const host = setup(async () => { throw new Error('Native command unavailable') })
  host.deliver(READY, { threadId: 'thread' })
  host.deliver(REQUEST, [call()])
  await settle()
  assert.deepEqual(JSON.parse(host.responses()[0].data.payload[0].value), {
    exit_code: -1, stdout: '', stderr: 'Native command unavailable', duration_ms: 0
  })
})

test('remote documents, child frames, forged sources and synthetic events cannot invoke the host', async () => {
  assert.equal(setup(undefined, { remote: true }).host, null)
  assert.equal(setup(undefined, { frame: true }).host, null)
  let invoked = false
  const host = setup(async () => { invoked = true; return completed })
  host.deliver(REQUEST, [call()], { source: {} })
  host.deliver(REQUEST, [call()], { origin: 'https://remote.example' })
  host.deliver(REQUEST, [call()], { isTrusted: false })
  await settle()
  assert.equal(invoked, false)
})

test('installation is idempotent and does not expose a native invoke function', () => {
  const host = setup()
  assert.equal(host.install(async () => completed, origin), host.host)
  assert.equal(Object.isFrozen(host.host), true)
  assert.deepEqual(Object.keys(host.host), ['registerTool'])
  assert.equal(Object.getOwnPropertyDescriptor(host.window, '__GENDOX_CLIENT_TOOL_HOST__').writable, false)
})
