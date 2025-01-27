/**
 *  Set Home URL based on User Roles
 */

// ** Config
import authConfig from 'src/configs/auth'



const getHomeRoute = role => {
  let selectedOrganizationId = null
  let selectedProjectId = null
  

  // Check if window object is defined (client-side)
  if (typeof window !== 'undefined') {
    selectedOrganizationId = window.localStorage.getItem(authConfig.selectedOrganizationId)
    selectedProjectId = window.localStorage.getItem(authConfig.selectedProjectId)
  }

  if (role === 'client') return '/acl'
  else {
    // If selectedOrganizationId is not found, return create organization URL
    if (selectedOrganizationId === null) {
      return '/gendox/create-organization'
    }
    
    // If selectedOrganizationId exists but selectedProjectId does not, return create project URL
    if (selectedOrganizationId !== null && selectedProjectId === null) {
      return `/gendox/create-project/?organizationId=${selectedOrganizationId}`
    }

    // If both selectedOrganizationId and selectedProjectId exist, return home URL with both query parameters
    if (selectedOrganizationId !== null && selectedProjectId !== null) {
      return `/gendox/home/?organizationId=${selectedOrganizationId}&projectId=${selectedProjectId}`
    }
    
    // Fallback URL (shouldn't be hit based on the above checks)
    return '/gendox/home'
  }
}

export default getHomeRoute
