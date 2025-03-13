import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import {localStorageConstants} from "src/utils/generalConstants";

/**
 * Prevents authenticated users from accessing its children.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to display if the user is not logged in.
 * @param {React.ReactNode} props.pageLoader - Shown while determining user status.
 */
function PublicOnly({ children, pageLoader }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!router.isReady) return

    // If user data exists in localStorage, assume user is logged in
    const storedUser = window.localStorage.getItem(localStorageConstants.userDataKey)
    if (storedUser) {
      // Redirect authenticated users to the homepage
      router.replace('/')
    }
  }, [router.isReady, router])


  // If still loading or user is authenticated, show the fallback
  if (loading || user !== null) {
    return pageLoader
  }

  // Otherwise, render the content for unauthenticated users
  return <>{children}</>
}

export default PublicOnly
