import React, { createContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import axios from "axios";
import authConfig from "src/configs/auth";

import apiRequests from "src/configs/apiRequest.js";
import { userDataActions } from "src/store/apps/userData/userData";
import { fetchOrganizationById } from "src/store/apps/activeOrganization/activeOrganization";
import { fetchProjectById } from "src/store/apps/activeProject/activeProject";
import userManager from "src/services/authService";

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
};

// Create context
const AuthContext = createContext(defaultProvider);



const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(defaultProvider.user);
  const [loading, setLoading] = useState(defaultProvider.loading);
  const router = useRouter();
  const dispatch = useDispatch();
  const [authState, setAuthState] = React.useState({
    user: null,
    isLoading: true
  });


  const initAuth_old = async () => {
    setLoading(true);
    const storedToken = localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      setLoading(false);
      return handleLogout();
    }

    try {
      const response = await axios.get(apiRequests.getProfile, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });

      // Add 'role': 'admin' to the userDataResponse.data object
      const userData = { ...response.data, role: "admin" };
      setUser(userData);
      dispatch(userDataActions.getUserData(userData));
      setLoading(false);
    } catch (error) {
      console.error("Error during auth initialization:", error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // New - to test tomorrow
  const handleLogin = () => {
    userManager.signinRedirect();
  };

  const clearAuthState = () => {
    setUser(null);
    window.localStorage.removeItem(authConfig.user);
    window.localStorage.removeItem(authConfig.storageTokenKeyName);
    window.localStorage.removeItem(authConfig.onTokenExpiration);
    //this is to make sure that the page is always redirected to the login page
    // but actually this is handled by userManager.signoutRedirect();
    // router.push("/login");
  }
  const handleLogout = () => {
    clearAuthState();
    userManager.signoutRedirect();
  };

  const initAuthOIDC = () => {

    // Adding an event listener for when new user data is loaded
    userManager.events.addUserLoaded(async (user) => {
      console.log('addUserLoaded User: ', user);
      setAuthState({ user, isLoading: false });
    });

    userManager.events.addUserSignedOut(() => {
      console.log("User signed out of IDP");
      // Here you can clear your application's session and redirect the user to the login page
      userManager.removeUser();
    });

    userManager.events.addUserUnloaded(() => {
      console.log('addUserUnloaded');
      setAuthState({ user: null, isLoading: false });
    });


    // Check for user session on component mount
    userManager.signinSilent()
        .then(user => {
          console.log('signinSilent User: ', user);
          setAuthState({user, isLoading: false})
        })
        .catch(() => {
          userManager.signinRedirectCallback().catch(() => {
            console.log('No user logged in');
          });
        });


    return () => {
      userManager.events.removeUserLoaded(user => setUser(null));
      userManager.events.removeUserUnloaded(() => setUser(null));
    };

  }

  const loadUserProfileFromAuthState = async (authState) => {

    setLoading(true);
    if (!authState.user) {
      setLoading(false);
      clearAuthState();
      // router.push("/login");
      return;
    }
    let user = authState.user;
    console.log("AuthState: ", authState);
    window.localStorage.setItem(
        authConfig.storageTokenKeyName,
        user.access_token
    )

    // Set refresh token in local storage
    window.localStorage.setItem(
        authConfig.onTokenExpiration,
        user.refresh_token
    )

    // Fetch user data from getProfile
    setLoading(true);
    await axios
        .get(apiRequests.getProfile, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.access_token,
          },
        })
        .then(async (userDataResponse) => {
          // Add 'role': 'admin' to the userDataResponse.data object
          userDataResponse.data.role = "admin";
          setUser(userDataResponse.data);
          window.localStorage.setItem(
              authConfig.user,
              JSON.stringify(userDataResponse.data)
          )

          // Store userData, actives project and organization
          dispatch(userDataActions.getUserData(userDataResponse.data));
          dispatch(
              fetchOrganizationById({
                organizationId: userDataResponse.data.organizations[0].id,
                storedToken: user.access_token
              })
          );
          dispatch(
              fetchProjectById({
                organizationId: userDataResponse.data.organizations[0].id,
                projectId: userDataResponse.data.organizations[0].projects[0].id,
                storedToken: user.access_token
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

          const returnUrl = router.query.returnUrl;
          const redirectURL =
              returnUrl && returnUrl !== "/" ? returnUrl : "/";
          router.replace(redirectURL);
          setLoading(false);
        })
        .catch((userDataError) => {
          console.error(
              "Error occurred while fetching user data:",
              userDataError
          );
        });

    // const redirectURL = returnUrl && returnUrl !== "/" ? returnUrl : "/";
    // router.replace(redirectURL);
  }

  useEffect(() => {
    console.log('useEffect for loadUserProfileFromAuthState');
    loadUserProfileFromAuthState(authState)
  }, [authState]);

  useEffect(() => {

    console.log('useEffect for initAuthOIDC');
    // initAuth_old();
    return initAuthOIDC();
  }, []);

  useEffect(() => {
    console.log('useEffect for user');
    const { organizationId, projectId } = router.query;
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

    const returnUrl = router.query.returnUrl;
    if (user && user.organizations) {
      const updatedActiveOrganization = user.organizations.find(
        (org) => org.id === organizationId
      );
      if (updatedActiveOrganization) {
        
        dispatch(
          fetchOrganizationById({
            organizationId: updatedActiveOrganization.id,
            storedToken          
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
            fetchProjectById({
              organizationId: updatedActiveOrganization.id,
              projectId: updatedActiveProject.id,
              storedToken            
            })
          );
          window.localStorage.setItem(
            authConfig.selectedProjectId,
            updatedActiveProject.id
          );
        }
      }
    }
  }, [user, router.query.organizationId, router.query.projectId]);

  // const handleLogin = (params, errorCallback) => {
  //
  //
  //     .then(async (response) => {
  //       // Set access token in local storage
  //       ......
  //       const returnUrl = router.query.returnUrl;
  //
  //
  //     })
  //     .catch((err) => {
  //       console.error("Error occurred:", err);
  //       if (errorCallback) errorCallback(err);
  //     });
  // };

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    oidcAuthState: authState
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
