import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'

/**
 * A route component for pages accessible to both authenticated and unauthenticated users.
 * Typically used for shared pages like general public content.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The content to display after loading is complete.
 * @param {React.ReactNode} props.pageLoader - A placeholder or spinner while loading.
 */
function SharedAccessRoute({ children, pageLoader }) {
  const router = useRouter()
  const { loading } = useAuth()

  // Show loader while router initializes or auth state is loading.
  // Using pageLoader (not null) ensures SSR and client render the same
  // markup, preventing React 19 hydration mismatches.
  if (!router.isReady || loading) {
    return pageLoader
  }

  // Render the page content for both guests and authenticated users
  return <>{children}</>
}

export default SharedAccessRoute
