import { useState } from 'react'
import { Check, Plus, Server, Trash2 } from 'lucide-react'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import { apiBaseOf, clientConfig, isAllowed, STORAGE_KEY } from 'src/utils/server/serverChoice'

// The server picker. The desktop app injects its list in window.__GENDOX_ENV__.GENDOX_DESKTOP and switches
// through its own command, which checks the server and restarts the app on it. In a browser the list is
// GENDOX_WEB (set in _document.js from this browser's choice) and switching reloads the page; a site
// allows it only for the servers its own API lists in allowedServers, mainly for development.
const desktop = () => (typeof window !== 'undefined' && window.__GENDOX_ENV__?.GENDOX_DESKTOP) || null
const web = () => (typeof window !== 'undefined' && window.__GENDOX_ENV__?.GENDOX_WEB) || null

const invoke = (command, args) => window.__TAURI__.core.invoke(command, args)

const webServers = info => {
  const site = { name: "This site's server", address: new URL(info.site).origin, custom: false }

  return { servers: [site, ...info.custom.map(server => ({ ...server, custom: true }))], current: { address: info.current || site.address } }
}

// Keeps the choice and starts over on that server, where the organization selected before does not exist
const saveWeb = (custom, current) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ custom, current }))
  window.localStorage.removeItem(localStorageConstants.selectedOrganizationId)
  window.localStorage.removeItem(localStorageConstants.selectedProjectId)
  window.location.assign('/')
}

async function setWebServer(info, { name, address }) {
  const { allowedServers = [] } = await clientConfig(info.site)
  if (!allowedServers.length) throw new Error('This site does not allow other servers.')
  const allowed = url => new URL(url).origin === window.location.origin || isAllowed(new URL(url).origin, allowedServers)
  const apiBase = apiBaseOf(address)
  if (!allowed(apiBase)) throw new Error(`This site does not allow ${new URL(apiBase).origin}.`)
  const config = await clientConfig(apiBase)
  if (!allowed(config.apiUrl)) throw new Error(`That server's API, ${config.apiUrl}, is not allowed on this site.`)
  const server = {
    name: name || new URL(apiBase).host,
    address,
    config: { apiUrl: config.apiUrl, oidcAuthority: config.oidcAuthority, clientId: config.webClientId || null }
  }
  saveWeb([...info.custom.filter(s => s.address !== address), server], address)
}

const ServerPage = () => {
  const native = desktop()
  const browser = !native && web()
  const info = native || (browser && webServers(browser))
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  if (!info || (native && !window.__TAURI__)) {
    return (
      <main className='center'>
        <div className='modal s' style={{ padding: 28, gap: 12, animation: 'none' }}>
          <h2 style={{ fontSize: 18 }}>Choosing a server</h2>
          <p className='muted sm'>Only the Gendox desktop app connects to other servers.</p>
        </div>
      </main>
    )
  }

  const run = async (key, action) => {
    setBusy(key)
    setError('')
    try {
      await action() // the app restarts, or the page reloads, on success
    } catch (e) {
      setError(e?.message || String(e))
      setBusy(null)
    }
  }

  const choose = server =>
    run(server.address, () =>
      native
        ? invoke('set_server', { name: server.name, address: server.address })
        : server.custom
          ? setWebServer(browser, server)
          : saveWeb(browser.custom, null)
    )
  const remove = server =>
    run(`remove:${server.address}`, () =>
      native
        ? invoke('remove_server', { address: server.address })
        : saveWeb(browser.custom.filter(s => s.address !== server.address), browser.current === server.address ? null : browser.current)
    )
  const add = e => {
    e.preventDefault()
    const server = { name: name.trim() || null, address: address.trim() }
    if (server.address) run('add', () => (native ? invoke('set_server', server) : setWebServer(browser, server)))
  }

  return (
    <main className='center'>
      <div className='modal s' style={{ padding: 28, gap: 16, animation: 'none', width: 'min(460px, 100%)' }}>
        <div className='stack' style={{ gap: 4 }}>
          <h2 style={{ fontSize: 18 }}>Server</h2>
          <p className='muted sm'>
            {native
              ? 'The Gendox server this app signs in to. Switching restarts the app.'
              : 'The Gendox server this page talks to, in this browser only. After switching you sign in to it.'}
          </p>
        </div>

        <div className='stack' style={{ gap: 6 }}>
          {info.servers.map(server => {
            const current = server.address === info.current.address
            return (
              <div key={server.address} className='row' style={{ gap: 8 }}>
                <button
                  className={current ? 'btn' : 'btn ghost'}
                  style={{ flex: 1, justifyContent: 'flex-start' }}
                  disabled={current || busy !== null}
                  onClick={() => choose(server)}
                >
                  {current ? <Check className='lucide' /> : <Server className='lucide' />}
                  <span>{server.name}</span>
                  <span className='faint sm mono' style={{ marginLeft: 'auto' }}>
                    {busy === server.address ? 'Connecting…' : server.address}
                  </span>
                </button>
                {server.custom && (
                  <button
                    className='btn ghost icon danger'
                    title={`Remove ${server.name}`}
                    aria-label={`Remove ${server.name}`}
                    disabled={busy !== null}
                    onClick={() => remove(server)}
                  >
                    <Trash2 className='lucide' />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <form className='stack' style={{ gap: 10 }} onSubmit={add}>
          <div className='field'>
            <label htmlFor='server-address'>Add a server</label>
            <input
              id='server-address'
              className='input mono'
              placeholder='https://gendox.example.com'
              autoComplete='off'
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <div className='field'>
            <label htmlFor='server-name'>Name (optional)</label>
            <input
              id='server-name'
              className='input'
              autoComplete='off'
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          {error && (
            <p className='sm' role='alert' style={{ color: 'var(--err)' }}>
              {error}
            </p>
          )}
          <button className='btn primary' type='submit' disabled={!address.trim() || busy !== null}>
            <Plus className='lucide' />
            {busy === 'add' ? 'Connecting…' : 'Add and switch'}
          </button>
        </form>
      </div>
    </main>
  )
}

ServerPage.pageConfig = {
  routeType: routeTypes.sharedRoute
}

export default ServerPage
