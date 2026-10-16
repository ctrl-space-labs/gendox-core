import { useEffect } from 'react'
import { useRouter } from 'next/router'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'

// The old agent settings page; its tabs are separate pages now. Keeps old links and bookmarks working.
const ProjectSettingsRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const { organizationId, projectId } = router.query
    const query = new URLSearchParams(Object.entries({ organizationId, projectId }).filter(([, v]) => v)).toString()
    router.replace(`/gendox/agent-settings/${query ? '?' + query : ''}`)
  }, [router])

  return <GendoxPageLoader />
}

export default ProjectSettingsRedirect
