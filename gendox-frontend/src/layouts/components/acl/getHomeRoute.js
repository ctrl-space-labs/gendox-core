/**
 *  Set Home URL based on User Roles
 */

import { useState, useEffect } from 'react'

// ** Config
import authConfig from 'src/configs/auth'

// Check if window object is defined (client-side)
if (typeof window !== 'undefined') {
  const selectedOrganizationId = window.localStorage.getItem(authConfig.selectedOrganizationId)
  const selectedProjectId = window.localStorage.getItem(authConfig.selectedProjectId)
}

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
    // Check if selectedOrganizationId and selectedProjectId are not null before constructing the URL
    if (selectedOrganizationId !== null && selectedProjectId !== null) {
      return `/gendox/home?organizationId=${selectedOrganizationId}&projectId=${selectedProjectId}`
    } else {
      // Return a default URL if selectedOrganizationId or selectedProjectId is null
      return '/gendox/home'
    }
  }
}

export default getHomeRoute
