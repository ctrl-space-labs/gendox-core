import React, { createContext, useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import axios from 'axios'
import authConfig from 'src/configs/auth'
import { localStorageConstants } from 'src/utils/generalConstants'
import userService from 'src/gendox-sdk/userService'
import apiRequests from 'src/configs/apiRequest.js'
import { userDataActions } from 'src/store/userData/userData'

import userManager, { signOutWithBrowser } from 'src/services/authService'
import { isDesktopApp, isMobileApp } from 'src/services/desktopBridge'
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
    // The desktop app signs in through the system browser, from a page with a button: never a browser
    // tab opened unasked when the app starts
    if (isDesktopApp()) {
      const query = returnUrl && returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
      if (!router.pathname.startsWith('/desktop-sign-in')) router.replace(`/desktop-sign-in/${query}`)
      return
    }
    if (isMobileApp()) {
      return userManager.signinRedirect({ state: { returnUrl } })
    }
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
      try {
        if (isDesktopApp()) {
          // Revokes the tokens and ends the session in the browser, where the user signed in
          await signOutWithBrowser()
          window.location.replace('/desktop-sign-in/')
        } else {
          await userManager.signoutRedirect()
        }
      } catch (error) {
        // Signed out here even when the sign-in server could not be told (offline, cancelled)
        console.error('Failed to end the session at the sign-in server:', error)
        await userManager.removeUser()
        window.location.replace(isDesktopApp() ? '/desktop-sign-in/' : '/login')
      }
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

  const renewSession = async () => {
    try {
      await userManager.signinSilent()
    } catch (error) {
      if (isDesktopApp() && error?.error !== 'invalid_grant') {
        setAuthState({ user: null, isLoading: false, renewalFailed: true })
        return
      }

      await userManager.removeUser()
      unloadUser()
    }
  }

  const initAuthOIDC = () => {
    userManager.getUser().then(async user => {
      if (user && !user.expired) {
        setAuthState({ user, isLoading: false })
      } else if (user?.refresh_token) {
        await renewSession()
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

      setUser(userDataResponse.data)
      window.localStorage.setItem(localStorageConstants.userDataKey, JSON.stringify(userDataResponse.data))

      // Store userData in Redux
      dispatch(userDataActions.getUserData(userDataResponse.data))
      // if it is opened by the WP Plugin Admin page
      if (window.opener) {
        console.log('Sending message to parent window')
        const trustedDomain = window.location.origin; // gets the current domain
        // The opener is this same app running as a cross-site iframe on the WordPress
        // admin page, so its localStorage is partitioned and cannot see the session we
        // just stored here. Ship the session across so it can store its own copy.
        window.opener.postMessage(
          {
            type: 'LOGIN_SUCCESS',
            payload: {
              oidcUser: user.toStorageString(),
              userData: userDataResponse.data
            }
          },
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
      if (isMobileApp()) {
        const returnUrl = authState.user?.state?.returnUrl
        // Only return to a bundled path. Reject slash and backslash variants of external URLs.
        const isLocalPath = typeof returnUrl === 'string' && returnUrl.startsWith('/') &&
          !returnUrl.startsWith('//') && !/[\\\s]/.test(returnUrl)
        window.location.replace(isLocalPath ? returnUrl : '/gendox/agent-home/')
        return
      }
      const { returnUrl } = router.query
      const homeUrl = returnUrl ? decodeURIComponent(returnUrl) : '/gendox/agent-home'
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
