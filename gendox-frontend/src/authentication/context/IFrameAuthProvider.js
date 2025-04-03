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
import { AuthContext } from './AuthContext'
import { generalConstants } from 'src/utils/generalConstants'
import { useIFrameMessageManager } from './IFrameMessageManagerContext'

/**
 * This AuthProvider is used to check that the accessToken exists in the local storage
 * Mainly will be used when the page is loaded in an i-frame in an other page.
 * the other page will have to give the accessToken using browser postMessage API
 *
 * @param children
 * @param initialAuth
 * @returns {JSX.Element}
 * @constructor
 */
const IFrameAuthProvider = ({ children, initialAuth }) => {
  const [user, setUser] = useState(initialAuth.user)
  const [accessToken, setAccessToken] = useState(generalConstants.NO_AUTH_TOKEN)
  const [loading, setLoading] = useState(initialAuth.loading)
  const router = useRouter()
  const dispatch = useDispatch()
  const iFrameMessageManager = useIFrameMessageManager()

  const handleLogout = () => {
    clearLocalStorage()
  }

  const handleLogin = () => {
    throw new Error('handleLogin is not implemented')
  }

  const clearLocalStorage = () => {
    window.localStorage.removeItem(localStorageConstants.userDataKey)
    window.localStorage.removeItem(localStorageConstants.accessTokenKey)
    window.localStorage.removeItem(localStorageConstants.refreshTokenKey)
    window.localStorage.removeItem(localStorageConstants.selectedOrganizationId)
    window.localStorage.removeItem(localStorageConstants.selectedProjectId)
    window.localStorage.removeItem(authConfig.oidcConfig)
  }

  const loadUserProfileFromAccessToken = async () => {
    setLoading(true)
    if (!accessToken) {
      // clearLocalStorage();
      return
    }

    if (accessToken === generalConstants.NO_AUTH_TOKEN) {
      setUser({
        id: 'anonymous',
        name: 'Anonymous',
        organizations: []
      })
      setLoading(false)
      return
    }

    // Fetch user data from getProfile
    setLoading(true)
    await axios
      .get(apiRequests.getProfile, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken
        }
      })
      .then(async userDataResponse => {
        // Add 'role': 'admin' to the userDataResponse.data object
        userDataResponse.data.role = 'reader'
        setUser(userDataResponse.data)
        window.localStorage.setItem(localStorageConstants.userDataKey, JSON.stringify(userDataResponse.data))

        // Store userData, actives project and organization
        dispatch(userDataActions.getUserData(userDataResponse.data))
        // dispatch(
        //   fetchOrganization({
        //     organizationId: userDataResponse.data.organizations[0].id,
        //     token: accessToken
        //   })
        // )
        // dispatch(
        //   fetchProject({
        //     organizationId: userDataResponse.data.organizations[0].id,
        //     projectId: userDataResponse.data.organizations[0].projects[0].id,
        //     token: accessToken
        //   })
        // )
        // window.localStorage.setItem(
        //   localStorageConstants.selectedOrganizationId,
        //   userDataResponse.data.organizations[0].id
        // )
        // window.localStorage.setItem(
        //   localStorageConstants.selectedProjectId,
        //   userDataResponse.data.organizations[0].projects[0].id
        // )

        setLoading(false)
      })

      .catch(userDataError => {
        // TODO in case of expired token the hole app brakes and the user is not able to login again
        // check if the token is expired and redirect user to login page
        setLoading(false)
        console.error('Error occurred while fetching user data:', userDataError)
      })
  }

  const receiveAccessTokenMessage = event => {
    // console.log("event.data", event.data)
    if (event.data && event.data.type === 'gendox.events.initialization.response') {
      window.localStorage.setItem(localStorageConstants.accessTokenKey, event.data.accessToken)
      setAccessToken(event.data.accessToken)
    }
  }

  useEffect(() => {
    let token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
    if (token) {
      setAccessToken(token)
    }
    return () => {
      // window.parent.postMessage({ type: 'gendox.events.listener.removed' }, "*");
      iFrameMessageManager.messageManager.sendMessage({ type: 'gendox.events.listener.removed' })
      iFrameMessageManager.messageManager.removeHandler(receiveAccessTokenMessage)
    }
  }, [])

  useEffect(() => {
    if (iFrameMessageManager && iFrameMessageManager?.iFrameConfiguration?.externalToken) {
      setAccessToken(iFrameMessageManager?.iFrameConfiguration?.externalToken)
    }
  }, [iFrameMessageManager?.iFrameConfiguration?.externalToken])

  useEffect(() => {
    loadUserProfileFromAccessToken(accessToken)
  }, [accessToken])

  useEffect(() => {
    const { organizationId, projectId } = router.query;
    const token = window.localStorage.getItem(localStorageConstants.accessTokenKey);
    console.log('user', user)
    if (user && user.organizations.length > 0 && organizationId && projectId) {
      dispatch(
        fetchOrganization({
          organizationId,
          token,
        })
      );
      dispatch(
        fetchProject({
          organizationId,
          projectId,
          token,
        })
      );
    }
  }, [user, router.query, dispatch]);

  
  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { IFrameAuthProvider }
