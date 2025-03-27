import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useDispatch } from 'react-redux'
import { fetchOrganization } from 'src/store/activeOrganization/activeOrganization'
import { fetchProject } from 'src/store/activeProject/activeProject'

const useOrganizationProjectGuard = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user } = useAuth()
  const { organizationId: urlOrgId, projectId: urlProjId } = router.query

  const redirectPath = router.pathname
  console.log("Redirect Path------------------------------------->", redirectPath)
// console.log("USer------------------------------------->", user)
  useEffect(() => {    
    if (!user) return
    if(!user) console.log("User------------------------------------->", user)
    if (redirectPath === '/oidc-callback') return
    if (redirectPath === '/oidc-callback') console.log("Redirect Path------------------------------------->", redirectPath)
    if (typeof window === 'undefined') return
    console.log("Redirect Path useEffect Start------------------------------------->", redirectPath)
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
      router.push(`${redirectPath}/?organizationId=${effectiveOrg.id}&projectId=${effectiveProj.id}`)
    }
  }, [urlOrgId, urlProjId, user, dispatch, redirectPath])
}

export default useOrganizationProjectGuard
