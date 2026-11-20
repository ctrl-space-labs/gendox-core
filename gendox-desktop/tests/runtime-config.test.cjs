const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const template = fs.readFileSync(path.join(__dirname, '../src-tauri/src/runtime-config.js'), 'utf8')
const publicEnv = { NEXT_PUBLIC_GENDOX_URL: 'https://api.example/gendox/api/v1/' }
const script = template
  .replace('__GENDOX_RUNTIME_ORIGIN__', JSON.stringify('tauri://localhost'))
  .replace('__GENDOX_RUNTIME_ENV__', JSON.stringify(publicEnv))

test('a bundled frame receives public settings without native desktop metadata', () => {
  const context = { location: { protocol: 'tauri:', host: 'localhost' }, window: {} }
  vm.runInNewContext(script, context)
  assert.equal(context.window.__GENDOX_ENV__.NEXT_PUBLIC_GENDOX_URL, publicEnv.NEXT_PUBLIC_GENDOX_URL)
  assert.equal(context.window.__GENDOX_ENV__.GENDOX_DESKTOP, undefined)
  assert.equal(context.window.__TAURI__, undefined)
  assert.equal(Object.isFrozen(context.window.__GENDOX_ENV__), true)
})

test('the main frame keeps its protected environment and server picker', () => {
  const nativeEnv = Object.freeze({ ...publicEnv, GENDOX_DESKTOP: { version: 'test' } })
  const context = { location: { protocol: 'tauri:', host: 'localhost' }, window: {} }
  Object.defineProperty(context.window, '__GENDOX_ENV__', { get: () => nativeEnv, set: () => {} })
  vm.runInNewContext(script, context)
  assert.equal(context.window.__GENDOX_ENV__, nativeEnv)
})

test('loading the asset from a remote document does not install configuration', () => {
  const context = { location: { protocol: 'https:', host: 'auth.example' }, window: {} }
  vm.runInNewContext(script, context)
  assert.equal(context.window.__GENDOX_ENV__, undefined)
})
