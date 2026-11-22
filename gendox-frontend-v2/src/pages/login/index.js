import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'
import { isMobileApp } from 'src/services/desktopBridge'

const LoginPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const mobile = isMobileApp()

  useEffect(() => {
    if (!mobile) auth.login()
  }, [mobile])

  if (mobile) {
    const signIn = async () => {
      setFailed(false)
      setPending(true)
      try {
        await auth.login(router.query.returnUrl)
      } catch {
        setFailed(true)
        setPending(false)
      }
    }

    return (
      <main className='center'>
        <div className='modal s' style={{ padding: 28, gap: 12, animation: 'none' }}>
          <h2>Sign in to Gendox</h2>
          {failed && <p role='alert'>Could not open the sign-in page. Try again or choose another server.</p>}
          <button className='btn primary' onClick={signIn} disabled={pending || !router.isReady}>
            {pending ? 'Opening sign-in…' : 'Sign in'}
          </button>
          <a href='/server/'>Choose a server</a>
        </div>
      </main>
    )
  }

  return <GendoxPageLoader text='Signing you in…' />
}

LoginPage.pageConfig = {
  routeType: routeTypes.publicOnly
}

export default LoginPage
