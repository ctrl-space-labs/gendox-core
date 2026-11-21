// CI-only launch check. The fixture never signs in or contacts an external service.
// Sign-in opens the system browser after a click, so the check stops at the sign-in page.
import assert from 'node:assert/strict'
import { spawn, execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, posix, resolve, win32 } from 'node:path'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'

const identifier = process.env.GENDOX_SMOKE_IDENTIFIER || 'dev.gendox.desktop'
assert.match(identifier, /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/, 'Use an application identifier without path separators')
const fixtureName = 'Desktop CI fixture'
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const runFile = promisify(execFile)

export async function startFixture() {
  // Before sign-in the app reads only the client configuration. Sign-in itself happens in the
  // system browser after a click, which a CI machine has no browser for.
  const reached = { config: false }
  let base
  const server = createServer((req, res) => {
    const url = new URL(req.url, base)
    res.setHeader('Cache-Control', 'no-store')
    if (req.method === 'GET' && url.pathname === '/gendox/api/v1/public/client-config') {
      reached.config = true
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(config()))
    } else {
      res.writeHead(404).end()
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
  function config() {
    return {
      apiUrl: `${base}/gendox/api/v1/`,
      oidcAuthority: `${base}/idp/realms/ci`,
      desktopClientId: 'gendox-desktop',
      serverVersion: '0.1.0',
      apiVersion: 'v1',
      minDesktopAppVersion: '0.1.0'
    }
  }
  return {
    base, reached, config: config(),
    close: () => new Promise(resolve => {
      server.close(resolve)
      server.closeAllConnections()
    })
  }
}

export function settingsPath(platform = process.platform, env = process.env, home = homedir()) {
  const paths = platform === 'win32' ? win32 : posix
  const folder = platform === 'darwin' ? paths.join(home, 'Library', 'Application Support') :
    platform === 'win32' ? env.APPDATA : env.XDG_CONFIG_HOME || paths.join(home, '.config')
  assert.ok(folder, 'The operating system must provide its app configuration folder')
  return paths.join(folder, identifier, 'servers.json')
}

/** The app's diagnostics log: fixed event names only, such as server_connected and page_loaded. */
export function diagnosticsPath(platform = process.platform, env = process.env, home = homedir()) {
  const paths = platform === 'win32' ? win32 : posix
  const folder = platform === 'darwin' ? paths.join(home, 'Library', 'Application Support') :
    platform === 'win32' ? env.APPDATA : env.XDG_DATA_HOME || paths.join(home, '.local', 'share')
  assert.ok(folder, 'The operating system must provide its app data folder')
  return paths.join(folder, identifier, 'logs', 'desktop.log')
}

/** True when the events after `offset` show the server check passing and then the bundled UI loading. */
export function bundleLoadedAfter(log, offset = 0) {
  const events = log.slice(offset).split('\n').map(line => line.split(' ')[1])
  const connected = events.indexOf('server_connected')
  return connected >= 0 && events.indexOf('page_loaded', connected) > connected
}

const readLog = path => readFile(path, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return ''
  throw error
})

export async function saveFixture(path, fixture) {
  const current = { name: fixtureName, address: fixture.base, config: fixture.config }
  await mkdir(dirname(path), { recursive: true })
  // Never replace a developer's settings, even when CI was set accidentally.
  const content = JSON.stringify({ current, custom: [current] })
  await writeFile(path, content, { flag: 'wx' })
  return async () => {
    if (await readFile(path, 'utf8') === content) await unlink(path)
  }
}

function launch(binary, args = []) {
  const child = spawn(binary, args, { stdio: 'inherit', detached: process.platform !== 'win32' })
  child.once('error', error => { child.spawnError = error })
  return child
}

async function stop(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return
  if (process.platform === 'win32') {
    await runFile('taskkill', ['/PID', String(child.pid), '/T', '/F']).catch(() => {})
  } else {
    try { process.kill(-child.pid, 'SIGTERM') } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
}

async function waitFor(check, label, child) {
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    if (child?.spawnError) throw child.spawnError
    if (child && (child.exitCode !== null || child.signalCode !== null)) {
      throw new Error(`Process exited before ${label}`)
    }
    if (await check()) return
    await pause(250)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

export async function smoke(binary) {
  assert.equal(process.env.CI, 'true', 'The smoke runner writes fixture settings only on fresh CI machines')
  assert.ok(binary, 'Pass the built desktop executable')
  const fixture = await startFixture()
  let cleanSettings, child, session
  const driver = 'http://127.0.0.1:4444'
  async function webdriver(method, path, body) {
    const response = await fetch(`${driver}${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000)
    })
    const data = await response.json()
    assert.ok(response.ok && !data.value?.error, `WebDriver ${path}: ${JSON.stringify(data.value)}`)
    return data.value
  }
  const log = diagnosticsPath()
  try {
    cleanSettings = await saveFixture(settingsPath(), fixture)
    // Only events of this launch count.
    const logStart = (await readLog(log)).length
    if (process.platform === 'darwin') {
      // tauri-driver has no macOS WKWebView backend. Require a rendered fixture page instead.
      child = launch(resolve(binary))
    } else {
      const args = process.platform === 'win32' ? ['--native-driver', resolve('msedgedriver.exe')] : []
      child = launch('tauri-driver', args)
      await waitFor(async () => {
        try { return (await webdriver('GET', '/status')).ready } catch { return false }
      }, 'tauri-driver readiness', child)
      session = (await webdriver('POST', '/session', {
        capabilities: { alwaysMatch: { 'tauri:options': { application: resolve(binary) } } }
      })).sessionId
      assert.ok(session, 'WebDriver must create a desktop session')
    }
    await waitFor(async () => fixture.reached.config && bundleLoadedAfter(await readLog(log), logStart),
      'the app to read the fixture configuration and load its bundled UI', child)
    if (session) {
      const path = `/session/${session}`
      const execute = script => webdriver('POST', `${path}/execute/sync`, { script, args: [] })
      const text = () => execute('return document.body.innerText')
      await waitFor(async () => {
        const page = await text()
        return page.includes('Sign in with your browser') && page.includes(`Server: ${fixtureName}`)
      }, 'the desktop sign-in page', child)
      const appOrigin = process.platform === 'win32' ? 'http://tauri.localhost' : 'tauri://localhost'
      await webdriver('POST', `${path}/url`, { url: `${appOrigin}/server/` })
      const loadedServer = async () => (await text()).includes(fixtureName)
      await waitFor(loadedServer, 'the bundled server route', child)
      assert.equal(await execute('return window.__GENDOX_ENV__.NEXT_PUBLIC_GENDOX_URL'), fixture.config.apiUrl)
      await webdriver('POST', `${path}/refresh`, {})
      await waitFor(loadedServer, 'reload of the bundled server route', child)
    }
    console.log('Desktop smoke passed: the app read the fixture configuration and loaded its bundled UI')
  } finally {
    if (session) await webdriver('DELETE', `/session/${session}`).catch(() => {})
    await stop(child)
    if (cleanSettings) await cleanSettings()
    await fixture.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  smoke(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1 })
}
