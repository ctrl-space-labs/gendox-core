import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { LogIn } from 'lucide-react'
import { User } from 'oidc-client-ts'
import userManager from 'src/services/authService'
import { localStorageConstants } from 'src/utils/generalConstants'
import { routeTypes } from 'src/authentication/components/RouteHandler'

// The sign-in screen the WordPress plugin shows inside its admin page (an iframe)
const LoginPromptPage = () => {
  const router = useRouter()

  useEffect(() => {
    const handleMessage = async event => {
      // Validate the sender's origin.
      if (event.origin !== window.location.origin) {
        console.warn('Gendox Untrusted origin:', event.origin)

        return
      }

      // Check for the expected message type.
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        // When this page runs as a cross-site iframe (the WP plugin admin screen) its
        // localStorage is partitioned, so it cannot see the session the popup just stored
        // in the app's first-party storage. The popup hands it over on the message instead,
        // and we persist our own copy here.
        const { oidcUser, userData } = event.data.payload || {}
        if (oidcUser) {
          try {
            await userManager.storeUser(User.fromStorageString(oidcUser))
            if (userData) {
              window.localStorage.setItem(localStorageConstants.userDataKey, JSON.stringify(userData))
            }
          } catch (storeError) {
            console.error('Failed to store the session received from the login popup:', storeError)
          }
        }

        // Full page load, not router.push: this window's auth provider already bootstrapped
        // with no user and won't re-read storage on a client-side navigation (leaving '/'
        // spinning forever).
        window.location.replace('/')
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [router])

  const handleLoginClick = () => {
    const width = 600
    const height = 600
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2

    // Open a popup without noopener so window.opener is available in the popup
    const popup = window.open('/login', 'loginPopup', `width=${width},height=${height},left=${left},top=${top}`)

    if (!popup) {
      console.error('Popup blocked. Please allow popups for this site.')
    }
  }

  return (
    <main className='center'>
      <div
        className='modal s'
        style={{ padding: 28, alignItems: 'center', textAlign: 'center', gap: 12, animation: 'none' }}
      >
        <span className='mark' style={{ width: 40, height: 40 }} />
        <h2 style={{ fontSize: 18 }}>Connect this site to Gendox</h2>
        <p className='muted sm' style={{ lineHeight: 1.6 }}>
          Sign in to choose which agent answers on this site. Your Gendox password never reaches WordPress.
        </p>
        <button className='btn primary' style={{ width: '100%' }} onClick={handleLoginClick}>
          <LogIn className='lucide' />
          Sign in to Gendox
        </button>
      </div>
    </main>
  )
}

LoginPromptPage.pageConfig = {
  routeType: routeTypes.publicOnly
}

export default LoginPromptPage
