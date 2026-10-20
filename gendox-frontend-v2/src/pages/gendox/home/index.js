import { useEffect } from 'react'
import { useRouter } from 'next/router'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'

// The home is the agent home. Keeps sign-in redirects, old links and bookmarks working.
const HomeRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const { organizationId, projectId } = router.query
    const query = new URLSearchParams(Object.entries({ organizationId, projectId }).filter(([, v]) => v)).toString()
    router.replace(`/gendox/agent-home/${query ? '?' + query : ''}`)
  }, [router])

  return <GendoxPageLoader />
}

export default HomeRedirect
