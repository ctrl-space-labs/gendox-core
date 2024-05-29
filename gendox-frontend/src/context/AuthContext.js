import React, { createContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import axios from "axios";
import authConfig from "src/configs/auth";

import apiRequests from "src/configs/apiRequest.js";
import { userDataActions } from "src/store/apps/userData/userData";
import { fetchOrganization } from "src/store/apps/activeOrganization/activeOrganization";
import { fetchProject } from "src/store/apps/activeProject/activeProject";
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
    isLoading: true,
  });

  // New - to test tomorrow
  const handleLogin = () => {
    userManager.signinRedirect();    
  };

  const handleLogout = () => {    
    // TODO call DELETE /profile/caches
    clearAuthState();
    userManager.signoutRedirect();
  };

  const clearAuthState = () => {
    setUser(null);
    window.localStorage.removeItem(authConfig.user);
    window.localStorage.removeItem(authConfig.storageTokenKeyName);
    window.localStorage.removeItem(authConfig.onTokenExpiration);
    window.localStorage.removeItem(authConfig.selectedOrganizationId);
    window.localStorage.removeItem(authConfig.selectedProjectId);
    window.localStorage.removeItem(authConfig.oidcConfig);
  };

  const loadUser = (user) => {    
    setAuthState({ user, isLoading: false });
  };

  const unloadUser = () => {    
    setAuthState({ user: null, isLoading: false });
  };

  const removeUser = () => {    
    // Here you can clear your application's session and redirect the user to the login page
    userManager.removeUser();
  };

  const initAuthOIDC = () => {
    userManager.getUser().then((user) => {
      if (user && !user.expired) {
        setAuthState({ user, isLoading: false });
      }
    });    

    // Adding an event listener for when new user data is loaded
    userManager.events.addUserLoaded(loadUser);
    userManager.events.addUserSignedOut(removeUser);
    userManager.events.addUserUnloaded(unloadUser);

    return () => {
      userManager.events.removeUserLoaded(loadUser);
      userManager.events.removeUserUnloaded(unloadUser);
      userManager.events.removeUserSignedOut(removeUser);
    };
  };

  const loadUserProfileFromAuthState = async (authState) => {
    setLoading(true);
    if (!authState.user || authState.user === null) {
      setLoading(false);
      clearAuthState();      
      return;
    }
    let user = authState.user;
    window.localStorage.setItem(
      authConfig.storageTokenKeyName,
      user.access_token
    );

    // Set refresh token in local storage
    window.localStorage.setItem(
      authConfig.onTokenExpiration,
      user.refresh_token
    );

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
        );

        // Store userData, actives project and organization
        dispatch(userDataActions.getUserData(userDataResponse.data));
        dispatch(
          fetchOrganization({
            organizationId: userDataResponse.data.organizations[0].id,
            storedToken: user.access_token,
          })
        );
        dispatch(
          fetchProject({
            organizationId: userDataResponse.data.organizations[0].id,
            projectId: userDataResponse.data.organizations[0].projects[0].id,
            storedToken: user.access_token,
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
        setLoading(false);
        console.error(
          "Error occurred while fetching user data:",
          userDataError
        );        
      });

    setLoading(false);
  };

  useEffect(() => {
    // initAuth_old();
    return initAuthOIDC();
  }, []);

  useEffect(() => {
    loadUserProfileFromAuthState(authState);
  }, [authState]);

  useEffect(() => {
    if (user && router.pathname.includes("oidc-callback")) {
      console.log(
        "User data loaded successfully. Redirecting to the home page..."
      );
      window.location.href = "/gendox/home";
    }
  }, [user]);

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
    oidcAuthState: authState,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
