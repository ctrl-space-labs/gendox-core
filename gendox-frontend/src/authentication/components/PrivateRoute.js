import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import {localStorageConstants} from "src/utils/generalConstants";


const _inIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};


/**
 * A protective component that ensures only authenticated users
 * can view its children.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The guarded page/component.
 * @param {React.ReactNode} props.pageLoader - A loading or placeholder component.
 */
function PrivateRoute({ children, pageLoader }) {
  const router = useRouter()
  const { user, loading, login, isLoggingOut } = useAuth()



  useEffect(() => {
    if (!router.isReady) return
    // If no user is found and not currently loading, attempt to log in
    const hasLocalUserData = Boolean(window.localStorage.getItem(localStorageConstants.userDataKey))
    if (!user && !hasLocalUserData && !loading && !isLoggingOut) {
      // this is to cover the Gendox WP Plugin ONLY
      // When the app is in an iframe the path is / , show the login page
      if (_inIframe() && router.asPath === '/') {
        router.push('/login-prompt')
      } else {
        // This directly redirect the user to the login page
        // and keep the previous url for after the login
        login(router.asPath)
      }
    }
  }, [router.isReady, user, loading, login, router.asPath])

  // While loading or missing user data, show the fallback
  if (loading || !user) {
    return pageLoader
  }

  // User is loaded and authenticated, render children
  return <>{children}</>
}

export default PrivateRoute
