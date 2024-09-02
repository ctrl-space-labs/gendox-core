import React, { createContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import axios from "axios";
import authConfig from "src/configs/auth";

import apiRequests from "src/configs/apiRequest.js";
import { userDataActions } from "src/store/apps/userData/userData";
import { fetchOrganization } from "src/store/apps/activeOrganization/activeOrganization";
import { fetchProject } from "src/store/apps/activeProject/activeProject";
import {AuthContext} from "./AuthContext";
import { generalConstants } from "src/utils/generalConstants";
import {useIFrameMessageManager} from "./IFrameMessageManagerContext";



/**
 * This AuthProvider is used to check that the accessToken exists in the local storage
 * Mainly will be used when the page is loaded in an i-frame in an other page.
 * the other page will have to give the accessToken using browser postMessage API
 *
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
const IFrameAuthProvider = ({ children, defaultProvider }) => {
  const [user, setUser] = useState(defaultProvider.user);
  const [accessToken, setAccessToken] = useState(generalConstants.NO_AUTH_TOKEN);
  const [loading, setLoading] = useState(defaultProvider.loading);
  const router = useRouter();
  const dispatch = useDispatch();
  const iFrameMessageManager = useIFrameMessageManager();


  const handleLogout = () => {
    clearLocalStorage();
  };

  const handleLogin = () => {
    throw new Error("handleLogin is not implemented");
  }


  const clearLocalStorage = () => {
    window.localStorage.removeItem(authConfig.user);
    window.localStorage.removeItem(authConfig.storageTokenKeyName);
    window.localStorage.removeItem(authConfig.onTokenExpiration);
    window.localStorage.removeItem(authConfig.selectedOrganizationId);
    window.localStorage.removeItem(authConfig.selectedProjectId);
    window.localStorage.removeItem(authConfig.oidcConfig);
  };


  const loadUserProfileFromAccessToken = async () => {
    setLoading(true);
    if (!accessToken) {
      // clearLocalStorage();
      return;
    }

    if (accessToken === generalConstants.NO_AUTH_TOKEN) {
      setUser({
        id: "anonymous",
        name: "Anonymous",
        organizations: [],
      });
      setLoading(false);
      return;
    }

    // Fetch user data from getProfile
    setLoading(true);
    await axios
      .get(apiRequests.getProfile, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
      })
      .then(async (userDataResponse) => {
        // Add 'role': 'admin' to the userDataResponse.data object
        userDataResponse.data.role = "admin";
        setUser(userDataResponse.data);
        window.localStorage.setItem(
          authConfig.user,
          JSON.stringify(userDataResponse.data)
        );

        // Store userData, actives project and organization
        dispatch(userDataActions.getUserData(userDataResponse.data));
        dispatch(
          fetchOrganization({
            organizationId: userDataResponse.data.organizations[0].id,
            storedToken: accessToken,
          })
        );
        dispatch(
          fetchProject({
            organizationId: userDataResponse.data.organizations[0].id,
            projectId: userDataResponse.data.organizations[0].projects[0].id,
            storedToken: accessToken,
          })
        );
        window.localStorage.setItem(
          authConfig.selectedOrganizationId,
          userDataResponse.data.organizations[0].id
        );
        window.localStorage.setItem(
          authConfig.selectedProjectId,
          userDataResponse.data.organizations[0].projects[0].id
        );

        setLoading(false);
      })

      .catch((userDataError) => {
        console.log("set loading to false");
        // TODO in case of expired token the hole app brakes and the user is not able to login again
        // check if the token is expired and redirect user to login page
        setLoading(false);
        console.error(
          "Error occurred while fetching user data:",
          userDataError
        );        
      });

  };


  const receiveAccessTokenMessage = (event) => {
    // console.log("event.data", event.data)
    if (event.data && event.data.type === 'gendox.events.initialization.response') {

      console.log("event.data.accessToken", event.data.accessToken)
      window.localStorage.setItem(authConfig.storageTokenKeyName, event.data.accessToken);
      setAccessToken(event.data.accessToken);
    }
  }


  useEffect(() => {

    let storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (storedToken) {
      setAccessToken(storedToken);
    }
    return () => {
      window.parent.postMessage({ type: 'GENDOX_EVENTS_LISTENER_REMOVED' }, "*");
      iFrameMessageManager.messageManager.removeHandler(receiveAccessTokenMessage);
    };
  }, []);

  useEffect(() => {

    if (iFrameMessageManager && iFrameMessageManager?.iFrameConfiguration?.externalToken) {
      setAccessToken(iFrameMessageManager?.iFrameConfiguration?.externalToken);
    }

  }, [iFrameMessageManager?.iFrameConfiguration?.externalToken]);

  useEffect(() => {
    loadUserProfileFromAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const { organizationId, projectId } = router.query;
    const storedToken = window.localStorage.getItem(
      authConfig.storageTokenKeyName
    );


    if (user && user.organizations) {
      const updatedActiveOrganization = user.organizations.find(
        (org) => org.id === organizationId
      );
      if (updatedActiveOrganization) {
        dispatch(
          fetchOrganization({
            organizationId: updatedActiveOrganization.id,
            storedToken,
          })
        );
        window.localStorage.setItem(
          authConfig.selectedOrganizationId,
          updatedActiveOrganization.id
        );
        const updatedActiveProject = updatedActiveOrganization.projects.find(
          (proj) => proj.id === projectId
        );
        if (updatedActiveProject) {
          dispatch(
            fetchProject({
              organizationId: updatedActiveOrganization.id,
              projectId: updatedActiveProject.id,
              storedToken,
            })
          );
          window.localStorage.setItem(
            authConfig.selectedProjectId,
            updatedActiveProject.id
          );
        }
      }
    }
    
  }, [user, router]);

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { IFrameAuthProvider };
