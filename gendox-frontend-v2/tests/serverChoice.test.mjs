import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apiBaseOf, isAllowed, webServers } from '../src/utils/server/serverChoice.js'

test('the profile and picker can use the selected server from the same list', () => {
  const site = 'https://gendox.example/gendox/api/v1/'
  const address = 'http://localhost:8107'
  const custom = [{ name: 'Local', address }]

  const selected = webServers({ site, custom, current: address })
  assert.deepEqual(selected.current, { ...custom[0], custom: true })
  const defaults = webServers({ site, custom, current: null })
  assert.deepEqual(defaults.current, { name: "This site's server", address: 'https://gendox.example', custom: false })
})

test('a site address means its API in the usual place; a path is the API base itself', () => {
  assert.equal(apiBaseOf('https://dev-app-2.gendox.dev'), 'https://dev-app-2.gendox.dev/gendox/api/v1/')
  assert.equal(apiBaseOf('dev-app-2.gendox.dev/'), 'https://dev-app-2.gendox.dev/gendox/api/v1/')
  assert.equal(apiBaseOf('https://dev-app.gendox.dev/gendox/api/v2'), 'https://dev-app.gendox.dev/gendox/api/v2/')
  assert.equal(apiBaseOf('127.0.0.1:8109'), 'http://127.0.0.1:8109/gendox/api/v1/')
  assert.throws(() => apiBaseOf('http://dev-app.gendox.dev'), /https/)
  assert.throws(() => apiBaseOf('https://'), /valid/)
})

test('allowlist entries match exact origins, one subdomain label or a port', () => {
  const allowed = ['https://dev-app-2.gendox.dev', 'https://*.example.com', 'http://localhost:*']
  assert.equal(isAllowed('https://dev-app-2.gendox.dev', allowed), true)
  assert.equal(isAllowed('https://a.example.com', allowed), true)
  assert.equal(isAllowed('https://example.com', allowed), false)
  assert.equal(isAllowed('https://evil.com/.example.com', allowed), false)
  assert.equal(isAllowed('https://a.example.com.evil.com', allowed), false)
  assert.equal(isAllowed('http://localhost:8109', allowed), true)
  assert.equal(isAllowed('http://dev-app-2.gendox.dev', allowed), false)
  assert.equal(isAllowed('https://dev-app-2.gendox.dev', []), false)
})
