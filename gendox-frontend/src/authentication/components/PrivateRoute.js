import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import {localStorageConstants} from "src/utils/generalConstants";

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
  const { user, loading, login } = useAuth()

  useEffect(() => {
    if (!router.isReady) return

    // If no user is found and not currently loading, attempt to log in
    const hasLocalUserData = Boolean(window.localStorage.getItem(localStorageConstants.userDataKey))
    if (!user && !hasLocalUserData && !loading) {
      login(router.asPath)
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
