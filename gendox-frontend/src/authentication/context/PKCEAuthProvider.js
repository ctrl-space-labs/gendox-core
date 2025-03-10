import React, { createContext, useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import axios from 'axios'
import authConfig from 'src/configs/auth'
import { localStorageConstants } from 'src/utils/generalConstants'

import apiRequests from 'src/configs/apiRequest.js'
import { userDataActions } from 'src/store/userData/userData'
import { fetchOrganization } from 'src/store/activeOrganization/activeOrganization'
import { fetchProject } from 'src/store/activeProject/activeProject'
import userManager from 'src/services/authService'
import { AuthContext } from './AuthContext'

const PKCEAuthProvider = ({ children, initialAuth }) => {
  const [user, setUser] = useState(initialAuth.user)
  const [loading, setLoading] = useState(initialAuth.loading)
  const router = useRouter()
  const dispatch = useDispatch()
  const [authState, setAuthState] = React.useState({
    user: null,
    isLoading: true
  })

  /**
   * Handles login redirect
   *
   * @param returnUrl - the url to redirect to after login
   */
  const handleLogin = returnUrl => {
    let args = {}
    if (returnUrl) {
      args = {
        redirect_uri: `${authConfig.oidcConfig.redirect_uri}?returnUrl=${encodeURIComponent(returnUrl)}`
      }
    }
    userManager.signinRedirect(args)
  }

  const handleLogout = async () => {
    try {
      await userService.logoutUser(token)
    } catch (error) {
    } finally {
      // Clear the authentication state and log
      clearAuthState()
      userManager.signoutRedirect()
    }
  }

  const clearAuthState = () => {
    setUser(null)
    window.localStorage.removeItem(localStorageConstants.userDataKey)
    window.localStorage.removeItem(localStorageConstants.accessTokenKey)
    window.localStorage.removeItem(localStorageConstants.refreshTokenKey)
    window.localStorage.removeItem(localStorageConstants.selectedOrganizationId)
    window.localStorage.removeItem(localStorageConstants.selectedProjectId)
  }

  const loadUser = user => {
    setAuthState({ user, isLoading: false })
  }

  const unloadUser = () => {
    setAuthState({ user: null, isLoading: false })
  }

  const removeUser = () => {
    // Here you can clear your application's session and redirect the user to the login page
    userManager.removeUser()
  }

  const initAuthOIDC = () => {
    userManager.getUser().then(user => {
      if (user && !user.expired) {
        setAuthState({ user, isLoading: false })
      } else {
        // no user data found or user expired, loadUserProfileFromAuthState will handle cleanup
        setAuthState({ user: null, isLoading: false })
      }
    })

    // Adding an event listener for when new user data is loaded
    userManager.events.addUserLoaded(loadUser)
    userManager.events.addUserSignedOut(removeUser)
    userManager.events.addUserUnloaded(unloadUser)

    return () => {
      userManager.events.removeUserLoaded(loadUser)
      userManager.events.removeUserUnloaded(unloadUser)
      userManager.events.removeUserSignedOut(removeUser)
    }
  }

  const loadUserProfileFromAuthState = async authState => {
    if (authState.isLoading) {
      return
    }
    setLoading(true)
    if (!authState.user || authState.user === null) {
      setLoading(false)
      clearAuthState()
      return
    }
    let user = authState.user
    window.localStorage.setItem(localStorageConstants.accessTokenKey, user.access_token)

    // Set refresh token in local storage
    window.localStorage.setItem(localStorageConstants.refreshTokenKey, user.refresh_token)

    setLoading(true)
    try {
      const userDataResponse = await axios.get(apiRequests.getProfile, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + user.access_token
        }
      })

      // Add 'role': 'admin' to the userDataResponse.data object
      userDataResponse.data.role = 'ROLE_ADMIN'
      setUser(userDataResponse.data)
      window.localStorage.setItem(localStorageConstants.userDataKey, JSON.stringify(userDataResponse.data))

      // Safely handle organization and project data
      const organizationId = userDataResponse.data.organizations?.[0]?.id || null
      let projectId = userDataResponse.data.organizations?.[0]?.projects?.[0]?.id || null

      if (organizationId && userDataResponse.data.organizations.find (org => org.id === organizationId)) {
        window.localStorage.setItem(localStorageConstants.selectedOrganizationId, organizationId)
        dispatch(
          fetchOrganization({
            organizationId,
            token: user.access_token
          })
        )
      } else {
        console.warn('Organization ID is missing.')
      }

      if (projectId && userDataResponse.data.organizations.find(org => org.projects.find(proj => proj.id === projectId))) {
        window.localStorage.setItem(localStorageConstants.selectedProjectId, projectId)
        dispatch(
          fetchProject({
            organizationId,
            projectId,
            token: user.access_token
          })
        )
      } else {
        console.warn('Project ID is missing.')
      }

      // Store userData in Redux
      dispatch(userDataActions.getUserData(userDataResponse.data))
    } catch (userDataError) {
      console.error('Error occurred while fetching user data:', userDataError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initAuth_old();
    return initAuthOIDC()
  }, [])

  useEffect(() => {
    loadUserProfileFromAuthState(authState)
  }, [authState])

  useEffect(() => {
    if (user && router.pathname.includes('oidc-callback')) {
      // Redirect to create organization if user has no organizations
      if (!Array.isArray(user.organizations) || user.organizations.length === 0) {
        router.push('/gendox/create-organization')
        return
      }
      // Redirect to create project if user has no projects
      if (user.organizations[0].projects.length === 0) {
        router.push(`/gendox/create-project?organizationId=${user.organizations[0].id}`)
        return
      }
      // Redirect to home page if user has organizations and projects
      let homeUrl = '/gendox/home'
      //oidc-callback might contain a returnUrl query param to redirect to after login,
      // like ../oidc-callback?returnUrl=%2Fgendox%2Fhome....
      const { returnUrl } = router.query
      if (returnUrl) {
        homeUrl = decodeURIComponent(returnUrl)
      }

      window.location.href = homeUrl
    }
  }, [user])

  useEffect(() => {
    const { organizationId, projectId } = router.query
    const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

    if (user && user.organizations) {
      const updatedActiveOrganization = user.organizations.find(org => org.id === organizationId)
      if (updatedActiveOrganization) {
        dispatch(
          fetchOrganization({
            organizationId: updatedActiveOrganization.id,
            token
          })
        )
        window.localStorage.setItem(localStorageConstants.selectedOrganizationId, updatedActiveOrganization.id)
        const updatedActiveProject = updatedActiveOrganization.projects.find(proj => proj.id === projectId)
        if (updatedActiveProject) {
          dispatch(
            fetchProject({
              organizationId: updatedActiveOrganization.id,
              projectId: updatedActiveProject.id,
              token
            })
          )
          window.localStorage.setItem(localStorageConstants.selectedProjectId, updatedActiveProject.id)
        }
      }
    }
  }, [user, router])

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    oidcAuthState: authState,
    loadUserProfileFromAuthState
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { PKCEAuthProvider }
