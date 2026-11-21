import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { bundleLoadedAfter, diagnosticsPath, saveFixture, settingsPath, startFixture } from './smoke.mjs'

test('the fixture serves the client configuration and records it', async () => {
  const fixture = await startFixture()
  try {
    assert.equal((await fetch(`${fixture.base}/idp/realms/ci/.well-known/openid-configuration`)).status, 404)
    assert.deepEqual(fixture.reached, { config: false })
    const config = await (await fetch(`${fixture.base}/gendox/api/v1/public/client-config`)).json()
    assert.deepEqual(config, fixture.config)
    assert.equal(config.apiUrl, `${fixture.base}/gendox/api/v1/`)
    assert.deepEqual(fixture.reached, { config: true })
  } finally { await fixture.close() }
})

test('the bundled UI counts as loaded only after the server check, in this launch', () => {
  const earlier = '1 app_started\n2 page_loaded\n3 server_connected\n4 page_loaded\n'
  assert.equal(bundleLoadedAfter(earlier), true)
  assert.equal(bundleLoadedAfter(earlier, earlier.length), false)
  assert.equal(bundleLoadedAfter(earlier + '5 app_started\n6 page_loaded\n7 server_connected\n', earlier.length), false)
  assert.equal(bundleLoadedAfter(earlier + '5 app_started\n6 page_loaded\n7 server_connected\n8 page_loaded\n', earlier.length), true)
  assert.equal(bundleLoadedAfter('1 page_loaded\n2 server_unreachable\n3 page_loaded\n'), false)
})

test('fixture settings never replace an existing file', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'gendox-desktop-ci-'))
  const path = join(folder, 'servers.json')
  const fixture = { base: 'http://127.0.0.1:1234', config: {} }
  try {
    const clean = await saveFixture(path, fixture)
    const original = await readFile(path, 'utf8')
    await assert.rejects(saveFixture(path, fixture), { code: 'EEXIST' })
    assert.equal(await readFile(path, 'utf8'), original)
    await clean()
  } finally { await rm(folder, { recursive: true, force: true }) }
})

test('the fixture uses each platform configuration folder', () => {
  assert.equal(settingsPath('linux', { XDG_CONFIG_HOME: '/config' }, '/home'), '/config/dev.gendox.desktop/servers.json')
  assert.equal(settingsPath('darwin', {}, '/home'), '/home/Library/Application Support/dev.gendox.desktop/servers.json')
  assert.equal(settingsPath('win32', { APPDATA: 'C:\\Config' }), 'C:\\Config\\dev.gendox.desktop\\servers.json')
})

test('the diagnostics log is in each platform data folder', () => {
  assert.equal(diagnosticsPath('linux', { XDG_DATA_HOME: '/data' }, '/home'), '/data/dev.gendox.desktop/logs/desktop.log')
  assert.equal(diagnosticsPath('linux', {}, '/home'), '/home/.local/share/dev.gendox.desktop/logs/desktop.log')
  assert.equal(diagnosticsPath('darwin', {}, '/home'), '/home/Library/Application Support/dev.gendox.desktop/logs/desktop.log')
  assert.equal(diagnosticsPath('win32', { APPDATA: 'C:\\Data' }), 'C:\\Data\\dev.gendox.desktop\\logs\\desktop.log')
})
