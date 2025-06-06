import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useDispatch } from 'react-redux'
import { fetchOrganization } from 'src/store/activeOrganization/activeOrganization'
import { fetchProject } from 'src/store/activeProject/activeProject'

const useOrganizationProjectGuard = (authProviderOption, pageConfig) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user } = useAuth()
  const { organizationId: urlOrgId, projectId: urlProjId } = router.query

  const redirectPath = router.pathname
  useEffect(() => {
    // Only run if the auth provider is the one for which guard is applicable.
    if (authProviderOption === 'IFrameAuthProvider') return

    // Only run if a user is present.
    if (!user) return

    // Only run the guard if pageConfig.runGuard is explicitly set to true.
    if (!pageConfig?.applyEffectiveOrgAndProjectIds) return
    if (redirectPath === '/oidc-callback') return
    if (typeof window === 'undefined') return
    const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

    //////    Organizations Validation   //////
    const organizations = user.organizations
    if (!organizations || organizations.length === 0) {
      router.push('/gendox/create-organization')
      return
    }
    // Validate URL organization ID before computing effective organization.
    if (urlOrgId && !organizations.find(o => o.id === urlOrgId)) {
      router.push('/404')
      return
    }
    const localOrgId = window.localStorage.getItem(localStorageConstants.selectedOrganizationId)
    const candidateOrgId = urlOrgId || localOrgId
    const effectiveOrg = organizations.find(o => o.id === candidateOrgId) || organizations[0]
    window.localStorage.setItem(localStorageConstants.selectedOrganizationId, effectiveOrg.id)
    dispatch(
      fetchOrganization({
        organizationId: effectiveOrg.id,
        token
      })
    )

    //////    Projects Validation   //////
    const projects = effectiveOrg.projects
    if (!projects || projects.length === 0) {
      router.push(`/gendox/create-project/?organizationId=${effectiveOrg.id}`)
      return
    }

    // Validate URL project ID before computing effective project.
    if (urlProjId && !projects.find(p => p.id === urlProjId)) {
      router.push('/404')
      return
    }

    const localProjId = window.localStorage.getItem(localStorageConstants.selectedProjectId)
    const candidateProjId = urlProjId || localProjId
    const effectiveProj = projects.find(p => p.id === candidateProjId) || projects[0]
    window.localStorage.setItem(localStorageConstants.selectedProjectId, effectiveProj.id)
    dispatch(
      fetchProject({
        organizationId: effectiveOrg.id,
        projectId: effectiveProj.id,
        token
      })
    )

    // update the url only if the effective organization or project is different from the original URL.
    if (urlOrgId !== effectiveOrg.id || urlProjId !== effectiveProj.id && redirectPath !== '/oidc-callback') {
      const slash = redirectPath.endsWith('/') ? '' : '/'
      const newUrl = `${redirectPath}${slash}?organizationId=${effectiveOrg.id}&projectId=${effectiveProj.id}`
      router.push(newUrl)
    }
  }, [urlOrgId, urlProjId, user, dispatch, redirectPath])
}

export default useOrganizationProjectGuard
