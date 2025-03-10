import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'

const useRedirectOr404ForHome = (organizationId, projectId) => {
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (!auth.user) return // Ensure user is available before proceeding

    // If user has no organizations, redirect to create-organization
    if (!Array.isArray(auth.user.organizations) || auth.user.organizations.length === 0) {
      router.push('/gendox/create-organization')
      return
    }
    
    let effectiveOrgId = null
    // Determine effective organization ID
    if (organizationId) {
      effectiveOrgId =
        organizationId && auth.user.organizations.some(o => o.id === organizationId) ? organizationId : null
    } else {
      effectiveOrgId = auth.user.organizations[0]?.id || null
    }    

    const organization = auth.user.organizations.find(o => o.id === effectiveOrgId)

    // Determine effective project ID
    let effectiveProjId = null
    if (projectId) {
      effectiveProjId = projectId && organization.projects.some(p => p.id === projectId) ? projectId : organization?.projects[0]?.id || null
    } else {
      effectiveProjId = organization?.projects[0]?.id || null
    }

    if (!effectiveOrgId && !effectiveProjId) {
      router.push('/404')
    } else if (!effectiveProjId || effectiveProjId === 'null') {
      router.push(`/gendox/create-project/?organizationId=${effectiveOrgId}`)
    } else if (projectId && !organization.projects.some(p => p.id === projectId)) {      
      const fallbackProjId = organization?.projects[0]?.id
      router.push(`/gendox/home/?organizationId=${effectiveOrgId}&projectId=${fallbackProjId}`)    
    } else if (!organizationId || !projectId) {
      router.push(`/gendox/home/?organizationId=${effectiveOrgId}&projectId=${effectiveProjId}`)
    }
  }, [organizationId, projectId, router])
}

export default useRedirectOr404ForHome
