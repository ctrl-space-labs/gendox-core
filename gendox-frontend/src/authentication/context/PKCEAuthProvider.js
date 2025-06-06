import React, { createContext, useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import axios from 'axios'
import authConfig from 'src/configs/auth'
import { localStorageConstants } from 'src/utils/generalConstants'
import userService from 'src/gendox-sdk/userService'
import apiRequests from 'src/configs/apiRequest.js'
import { userDataActions } from 'src/store/userData/userData'

import userManager from 'src/services/authService'
import { AuthContext } from './AuthContext'

const PKCEAuthProvider = ({ children, initialAuth }) => {
  const [user, setUser] = useState(initialAuth.user)
  const [loading, setLoading] = useState(initialAuth.loading)
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    // setting true, because after the clearAuthState(),
    // the PrivateRoute, will redirect for login before clear Keycloak Session
    // and it will stack in infinite re-login loop
    setIsLoggingOut(true);
    try {
      let token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
      if (!token) {
        console.warn('No access token found for logout')
        throw new Error('Missing access token')
      }
      await userService.logoutUser(token)
    } catch (error) {
      console.error('Error occurred while logging out:', error)
    } finally {
      // Clear the authentication state and log
      clearAuthState()
      await userManager.signoutRedirect()
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

      // Store userData in Redux
      dispatch(userDataActions.getUserData(userDataResponse.data))
      // if it is opened by the WP Plugin Admin page
      if (window.opener) {
        console.log('Sending message to parent window')
        const trustedDomain = window.location.origin; // gets the current domain
        window.opener.postMessage(
          { type: 'LOGIN_SUCCESS', payload: { /* any token or user info */ } },
          trustedDomain
        );
        window.close();
      }
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
      const { returnUrl } = router.query
      const homeUrl = returnUrl ? decodeURIComponent(returnUrl) : '/gendox/home'
      window.location.href = homeUrl
    }
  }, [user])

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    isLoggingOut,
    oidcAuthState: authState,
    loadUserProfileFromAuthState
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { PKCEAuthProvider }
