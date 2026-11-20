import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { saveFixture, settingsPath, startFixture } from './smoke.mjs'

test('the fixture accepts the desktop PKCE flow and records page readiness', async () => {
  const fixture = await startFixture()
  try {
    const metadata = await (await fetch(`${fixture.config.oidcAuthority}/.well-known/openid-configuration`, {
      headers: { Origin: 'tauri://localhost' }
    })).json()
    assert.equal(metadata.issuer, fixture.config.oidcAuthority)
    assert.equal((await fetch(`${fixture.base}/ready`, { method: 'POST' })).status, 404)
    assert.equal((await fetch(metadata.authorization_endpoint)).status, 400)
    const query = new URLSearchParams({ client_id: 'gendox-desktop', response_type: 'code',
      redirect_uri: 'tauri://localhost/oidc-callback/', code_challenge_method: 'S256',
      code_challenge: 'fixture-challenge', state: 'fixture-state' })
    assert.equal((await fetch(`${metadata.authorization_endpoint}?${query}`)).status, 200)
    assert.equal((await fetch(`${fixture.base}/ready`, { method: 'POST' })).status, 204)
    assert.deepEqual(fixture.reached, { config: false, discovery: true, authorize: true, ready: true })
  } finally { await fixture.close() }
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
