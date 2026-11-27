import { useState } from 'react'
import { ArrowLeft, Check, Plus, Server, Trash2 } from 'lucide-react'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import { apiBaseOf, clientConfig, isAllowed, STORAGE_KEY, webServers } from 'src/utils/server/serverChoice'

// Installed apps validate and save the choice in the native shell. Browsers use the site's allowlist.
const nativeServerInfo = () => (typeof window !== 'undefined' && window.__GENDOX_ENV__?.GENDOX_DESKTOP) || null
const web = () => (typeof window !== 'undefined' && window.__GENDOX_ENV__?.GENDOX_WEB) || null

const invoke = (command, args) => window.__TAURI__.core.invoke(command, args)

// Keeps the choice and starts over on that server, where the organization selected before does not exist
const saveWeb = (custom, current) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ custom, current }))
  window.localStorage.removeItem(localStorageConstants.selectedOrganizationId)
  window.localStorage.removeItem(localStorageConstants.selectedProjectId)
  window.location.assign('/')
}

// Reads a server's configuration and checks it against the site's allowlist, without saving it
async function webServer(info, { name, address }) {
  const { allowedServers = [] } = await clientConfig(info.site)
  if (!allowedServers.length) throw new Error('This site does not allow other servers.')
  const allowed = url => new URL(url).origin === window.location.origin || isAllowed(new URL(url).origin, allowedServers)
  const apiBase = apiBaseOf(address)
  if (!allowed(apiBase)) throw new Error(`This site does not allow ${new URL(apiBase).origin}.`)
  const config = await clientConfig(apiBase)
  if (!allowed(config.apiUrl)) throw new Error(`That server's API, ${config.apiUrl}, is not allowed on this site.`)

  return {
    name: name || new URL(apiBase).host,
    address,
    config: { apiUrl: config.apiUrl, oidcAuthority: config.oidcAuthority, clientId: config.webClientId || null }
  }
}

async function setWebServer(info, server) {
  const checked = await webServer(info, server)
  saveWeb([...info.custom.filter(s => s.address !== checked.address), checked], checked.address)
}

const truncate = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const ServerPage = () => {
  const native = nativeServerInfo()
  const browser = !native && web()
  const info = native || (browser && webServers(browser))
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [check, setCheck] = useState(null) // { address, checking, ok, message } of the address typed
  const typed = address.trim()

  if (!info || (native && !window.__TAURI__)) {
    return (
      <main className='center'>
        <div className='modal s' style={{ padding: 28, gap: 12, animation: 'none' }}>
          <h2 style={{ fontSize: 18 }}>Choosing a server</h2>
          <p className='muted sm'>Open this page in an installed Gendox app to choose a server.</p>
        </div>
      </main>
    )
  }

  const run = async (key, action) => {
    setBusy(key)
    setError('')
    try {
      await action() // the app restarts, or the page reloads, on success
      if (native?.mobile) {
        setSaved(true)
        setBusy(null)
      }
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
  // Checks the address when the field loses focus, so it shows whether the app can connect
  const checkAddress = async () => {
    if (!typed || saved || check?.address === typed) return
    setCheck({ address: typed, checking: true })
    let result
    try {
      await (native ? invoke('check_server', { address: typed }) : webServer(browser, { address: typed }))
      result = { address: typed, ok: true }
    } catch (e) {
      result = { address: typed, ok: false, message: e?.message || String(e) }
    }
    setCheck(latest => (latest?.address === typed ? result : latest)) // unless the address changed meanwhile
  }

  const add = e => {
    e.preventDefault()
    const server = { name: name.trim() || null, address: address.trim() }
    if (server.address) run('add', () => (native ? invoke('set_server', server) : setWebServer(browser, server)))
  }

  return (
    <main className='center'>
      <div className='modal s native-server-picker' style={{ padding: 28, gap: 16, animation: 'none', width: 'min(460px, 100%)' }}>
        <button
          className='btn ghost s'
          style={{ alignSelf: 'flex-start' }}
          disabled={Boolean(busy)}
          onClick={() => {
            if (window.history.length > 1) window.history.back()
            else window.location.replace('/')
          }}
        >
          <ArrowLeft className='lucide' /> Back
        </button>
        <div className='stack' style={{ gap: 4 }}>
          <h2 style={{ fontSize: 18 }}>Server</h2>
          <p className='muted sm'>
            {native
              ? 'Choose the Gendox server this app signs in to.'
              : 'The Gendox server this page talks to, in this browser only. After switching you sign in to it.'}
          </p>
        </div>

        {saved && info.mobile && (
          <p className='sm' role='status'>Server saved. Close and reopen Gendox to apply the change.</p>
        )}

        <div className='stack' style={{ gap: 6 }}>
          {info.servers.map(server => {
            const current = server.address === info.current.address
            return (
              <div key={server.address} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 34px', gap: 8 }}>
                <button
                  className={current ? 'btn' : 'btn ghost'}
                  style={{ minWidth: 0, justifyContent: 'flex-start' }}
                  title={`${server.name} · ${server.address}`}
                  disabled={current || saved || busy !== null}
                  onClick={() => choose(server)}
                >
                  {current ? <Check className='lucide' /> : <Server className='lucide' />}
                  <span style={{ ...truncate, flexShrink: 0, maxWidth: '55%' }}>{server.name}</span>
                  <span className='faint sm mono' style={{ ...truncate, marginLeft: 'auto' }}>
                    {busy === server.address ? 'Connecting…' : server.address}
                  </span>
                </button>
                {server.custom ? (
                  <button
                    className='btn ghost icon danger'
                    title={`Remove ${server.name}`}
                    aria-label={`Remove ${server.name}`}
                    disabled={saved || busy !== null}
                    onClick={() => remove(server)}
                  >
                    <Trash2 className='lucide' />
                  </button>
                ) : (
                  <span />
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
              className={native?.mobile ? 'input' : 'input mono'}
              inputMode='url'
              placeholder='https://gendox.example.com'
              autoCapitalize='none'
              autoComplete='off'
              spellCheck={false}
              value={address}
              onChange={e => {
                setAddress(e.target.value)
                setError('')
                setCheck(null)
              }}
              onBlur={checkAddress}
            />
            {!error && check?.address === typed && (
              <p
                className='sm row'
                role='status'
                style={{ gap: 6, color: check.checking ? 'var(--text-3)' : check.ok ? 'var(--ok)' : 'var(--err)' }}
              >
                {check.checking ? (
                  <>
                    <span className='spin' style={{ width: 13, height: 13 }} aria-hidden='true' />
                    Checking the server…
                  </>
                ) : check.ok ? (
                  <>
                    <Check className='lucide' />
                    Gendox server found
                  </>
                ) : (
                  check.message
                )}
              </p>
            )}
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
          <button className='btn primary' type='submit' disabled={!address.trim() || saved || busy !== null}>
            <Plus className='lucide' />
            {busy === 'add' ? 'Connecting…' : 'Add and switch'}
          </button>
        </form>
        {native?.mobile && !saved && <a href='/'>Back to Gendox</a>}
      </div>
    </main>
  )
}

ServerPage.pageConfig = {
  routeType: routeTypes.sharedRoute
}

export default ServerPage
