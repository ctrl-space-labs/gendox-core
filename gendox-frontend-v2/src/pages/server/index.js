import { useState } from 'react'
import { Check, Plus, Server, Trash2 } from 'lucide-react'
import { routeTypes } from 'src/authentication/components/RouteHandler'

// The desktop app's server picker. The app injects the list in window.__GENDOX_ENV__.GENDOX_DESKTOP
// and switches through its own command, which checks the server and restarts the app on it.
const desktop = () => (typeof window !== 'undefined' && window.__GENDOX_ENV__?.GENDOX_DESKTOP) || null

const invoke = (command, args) => window.__TAURI__.core.invoke(command, args)

const ServerPage = () => {
  const info = desktop()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  if (!info || !window.__TAURI__) {
    return (
      <main className='center'>
        <div className='modal s' style={{ padding: 28, gap: 12, animation: 'none' }}>
          <h2 style={{ fontSize: 18 }}>Choosing a server</h2>
          <p className='muted sm'>Only the Gendox desktop app connects to other servers.</p>
        </div>
      </main>
    )
  }

  const run = async (key, command, args) => {
    setBusy(key)
    setError('')
    try {
      await invoke(command, args) // the app restarts on success
    } catch (e) {
      setError(String(e))
      setBusy(null)
    }
  }

  const choose = server => run(server.address, 'set_server', { name: server.name, address: server.address })
  const remove = server => run(`remove:${server.address}`, 'remove_server', { address: server.address })
  const add = e => {
    e.preventDefault()
    if (address.trim()) run('add', 'set_server', { name: name.trim() || null, address: address.trim() })
  }

  return (
    <main className='center'>
      <div className='modal s' style={{ padding: 28, gap: 16, animation: 'none', width: 'min(460px, 100%)' }}>
        <div className='stack' style={{ gap: 4 }}>
          <h2 style={{ fontSize: 18 }}>Server</h2>
          <p className='muted sm'>The Gendox server this app signs in to. Switching restarts the app.</p>
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
