const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const source = name => fs.readFileSync(path.join(__dirname, '../src-tauri/src', name), 'utf8')
const origin = 'tauri://localhost'
const proof = 'test-session-proof'
const script = source('client-tool-bootstrap.js')
  .replaceAll('__GENDOX_TOOL_INSTALLER__', source('client-tools.js'))
  .replaceAll('__GENDOX_TOOL_ORIGIN__', JSON.stringify(origin))
  .replaceAll('__GENDOX_TOOL_SESSION__', JSON.stringify(proof))

test('bootstrap keeps the native proof private and captures the initial invoke function', async () => {
  const listeners = []
  const calls = []
  const window = {
    __TAURI__: { core: { invoke: async (...args) => { calls.push(args); return { declined: true } } } },
    addEventListener: (_type, handler) => listeners.push(handler), postMessage() {}
  }
  window.top = window
  vm.runInNewContext(script, { window, location: { protocol: 'tauri:', host: 'localhost' } })
  window.__TAURI__.core.invoke = () => assert.fail('page replacement must not receive the proof')
  const request = { command: 'echo check', description: 'Print a check' }
  for (const handler of listeners) handler({ source: window, origin, isTrusted: true, data: {
    type: 'gendox.events.chat.message.tool_calls.request', payload: [{
      execution: 'CLIENT', id: 'call', threadId: 'thread', turnId: 'turn',
      function: { name: 'run_command', arguments: request }
    }]
  } })
  await new Promise(setImmediate)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['run_command', {
    request, executionId: JSON.stringify(['thread', 'turn', 'call']), sessionToken: proof
  }]])
  assert.equal(Object.values(window).includes(proof), false)
  assert.deepEqual(Object.keys(window).sort(), ['__TAURI__', 'addEventListener', 'postMessage', 'top'])
  assert.deepEqual(Object.keys(window.__GENDOX_CLIENT_TOOL_HOST__), ['registerTool'])
})

test('bootstrap never reads native APIs in a child frame or remote document', () => {
  for (const frame of [true, false]) {
    const window = {}
    window.top = frame ? {} : window
    Object.defineProperty(window, '__TAURI__', { get() { assert.fail('native API read outside bundled main frame') } })
    vm.runInNewContext(script, { window, location: { protocol: frame ? 'tauri:' : 'https:', host: 'localhost' } })
    assert.equal(window.__GENDOX_CLIENT_TOOL_HOST__, undefined)
  }
})
