import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'

/**
 * The organization and the agent (project) the URL points at, read from the signed-in user's profile.
 * `href(path)` builds a link that keeps both, e.g. href('/gendox/home').
 */
const useActiveScope = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { organizationId, projectId } = router.query

  return useMemo(() => {
    const organizations = Array.isArray(user?.organizations) ? user.organizations : []
    const organization = organizations.find(o => o.id === organizationId) ?? null
    const projects = Array.isArray(organization?.projects) ? organization.projects : []
    const project = projects.find(p => p.id === projectId) ?? null

    const href = (path, overrides = {}) => {
      const ids = { organizationId, projectId, ...overrides }
      const query = Object.entries(ids)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')

      return `${path.endsWith('/') ? path : path + '/'}${query ? '?' + query : ''}`
    }

    return { organizations, organization, projects, project, organizationId, projectId, href }
  }, [user, organizationId, projectId])
}

export default useActiveScope
