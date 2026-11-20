import { useState } from 'react'
import { useRouter } from 'next/router'
import { ExternalLink, LogIn } from 'lucide-react'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import { useAuth } from 'src/authentication/useAuth'
import { cancelBrowserSignIn, signInWithBrowser } from 'src/services/authService'
import { isDesktopApp } from 'src/services/desktopBridge'
import Spinner from 'src/components/ui/Spinner'

const currentServer = () => (typeof window !== 'undefined' && window.__GENDOX_ENV__?.GENDOX_DESKTOP?.current) || null

// Only a path inside the app: a returnUrl is never an address elsewhere
const safeReturn = value => (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/')

/**
 * The desktop app's sign-in: the sign-in page opens in the system browser, where the user's passwords,
 * single sign-on and Google or Microsoft accounts are, and the browser hands the app the answer.
 */
const DesktopSignInPage = () => {
  const router = useRouter()
  const { oidcAuthState } = useAuth()
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const server = currentServer()

  if (typeof window !== 'undefined' && !isDesktopApp()) {
    return (
      <main className='center'>
        <div className='modal s' style={{ padding: 28, gap: 12, animation: 'none' }}>
          <h2 style={{ fontSize: 18 }}>Signing in from the desktop app</h2>
          <p className='muted sm'>This page is for the Gendox desktop app.</p>
        </div>
      </main>
    )
  }

  const signIn = async () => {
    setError('')
    setWaiting(true)
    try {
      await signInWithBrowser()
      window.location.replace(safeReturn(router.query.returnUrl))
    } catch (e) {
      setWaiting(false)
      const message = String(e?.message || e)
      if (!/cancelled/i.test(message)) setError(message)
    }
  }

  const cancel = () => cancelBrowserSignIn().catch(() => {})

  return (
    <main className='center'>
      <div className='modal s' style={{ padding: 28, gap: 14, animation: 'none', textAlign: 'center' }}>
        <span className='mark' style={{ width: 44, height: 44, margin: '0 auto' }} />
        <h2 style={{ fontSize: 20 }}>{waiting ? 'Finish signing in in your browser' : 'Sign in to Gendox'}</h2>
        <p className='muted sm'>
          {waiting
            ? 'Your browser opened the sign-in page. When you are done there, Gendox continues here.'
            : 'Gendox opens the sign-in page in your browser, where your accounts and passwords are.'}
        </p>
        {server?.name && <p className='muted sm'>Server: {server.name}</p>}
        {error && (
          <p role='alert' className='sm'>
            {error}
          </p>
        )}
        {oidcAuthState.renewalFailed && (
          <p role='alert' className='sm'>Gendox couldn’t renew your saved session. Check your connection and try again.</p>
        )}
        {waiting ? (
          <div className='stack' style={{ alignItems: 'center', gap: 12 }}>
            <Spinner />
            <div className='row' style={{ justifyContent: 'center', gap: 8 }}>
              <button className='btn' onClick={cancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : oidcAuthState.renewalFailed ? (
          <button
            className='btn primary'
            onClick={() => window.location.replace(safeReturn(router.query.returnUrl))}
            style={{ justifyContent: 'center' }}
          >
            Retry session
          </button>
        ) : (
          <button className='btn primary' onClick={signIn} style={{ justifyContent: 'center' }}>
            <LogIn className='lucide' />
            Sign in with your browser
            <ExternalLink className='lucide' />
          </button>
        )}
        {!waiting && (
          <a className='muted sm' href='/server/'>
            Choose another server
          </a>
        )}
      </div>
    </main>
  )
}

DesktopSignInPage.pageConfig = {
  routeType: routeTypes.publicOnly
}

export default DesktopSignInPage
