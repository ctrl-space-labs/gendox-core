import PublicOnlyRoute from 'src/authentication/components/PublicOnlyRoute'
import SharedAccessRoute from 'src/authentication/components/SharedAccessRoute'
import PrivateRoute from 'src/authentication/components/PrivateRoute'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'
import { useAuth } from '../useAuth'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { localStorageConstants } from 'src/utils/generalConstants'
import authConfig from 'src/configs/auth'

const routeTypes = {
  publicOnly: 'publicOnly',
  sharedRoute: 'sharedRoute',
  private: 'private'
}

/**
 * 'RouteHandler' component is a wrapper for the different types of routes in the application.
 * @param children
 * @param routeType | 'publicOnly', 'sharedRoute', 'private'
 * @return {JSX.Element}
 * @constructor
 */
const RouteHandler = ({ children, routeType }) => {

  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (auth.user && router.route === '/') {
      const homeRoute = getHomeRoute()
      router.replace(homeRoute)
    }
  }, [auth.user, router])


  let RouteTag ;
  if (routeType === routeTypes.publicOnly) {
    RouteTag = PublicOnlyRoute
  } else if (routeType === routeTypes.sharedRoute) {
    RouteTag = SharedAccessRoute
  } else {
    RouteTag = PrivateRoute
  }

  return <RouteTag pageLoader={<GendoxPageLoader />}>{children}</RouteTag>
}

const getHomeRoute = () => {
  let selectedOrganizationId = null
  let selectedProjectId = null

  // Check if window object is defined (client-side)
  if (typeof window !== 'undefined') {
    selectedOrganizationId = window.localStorage.getItem(localStorageConstants.selectedOrganizationId)
    selectedProjectId = window.localStorage.getItem(localStorageConstants.selectedProjectId)
  }

  // If both selectedOrganizationId and selectedProjectId exist, return home URL with both query parameters
  if (selectedOrganizationId !== null && selectedProjectId !== null) {
    return `/gendox/home/?organizationId=${selectedOrganizationId}&projectId=${selectedProjectId}`
  }

  // Fallback URL (shouldn't be hit based on the above checks)
  return '/gendox/home'

}

export default RouteHandler


export {routeTypes}
