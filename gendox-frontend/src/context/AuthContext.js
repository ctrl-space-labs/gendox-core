import React, { createContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import axios from "axios";
import authConfig from "src/configs/auth";
import { userDataActions } from "src/store/apps/userData/userData";
import { fetchOrganizationById } from "src/store/apps/activeOrganization/activeOrganization";
import { fetchProject } from "src/store/apps/activeProject/activeProject";

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
    
  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem(authConfig.user);
    window.localStorage.removeItem(authConfig.storageTokenKeyName);
    window.localStorage.removeItem(authConfig.onTokenExpiration);
    router.push("/login");
  };

  const initAuth = async () => {
    setLoading(true);
    const storedToken = localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      setLoading(false);
      return handleLogout();
    }

    try {
      const response = await axios.get(authConfig.getProfile, {
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

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    const { organizationId, projectId } = router.query;
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

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
            fetchProject({
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

  const handleLogin = (params, errorCallback) => {
    // Prepare form data
    const formData = new URLSearchParams();
    formData.append("grant_type", "password");
    formData.append("client_id", "gendox-public-client");
    formData.append("scope", "openid email");
    formData.append("username", params.email);
    formData.append("password", params.password);

    axios({
      method: "post",
      url: authConfig.loginEndpoint,
      data: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then(async (response) => {
        // Set access token in local storage
        params.rememberMe
          ? window.localStorage.setItem(
              authConfig.storageTokenKeyName,
              response.data.access_token
            )
          : null;

        // Set refresh token in local storage
        params.rememberMe
          ? window.localStorage.setItem(
              authConfig.onTokenExpiration,
              response.data.refresh_token
            )
          : null;
        const returnUrl = router.query.returnUrl;

        // Fetch user data from getProfile
        setLoading(true);
        await axios
          .get(authConfig.getProfile, {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + response.data.access_token,
            },
          })
          .then(async (userDataResponse) => {
            // Add 'role': 'admin' to the userDataResponse.data object
            userDataResponse.data.role = "admin";            
            setUser(userDataResponse.data);            
            params.rememberMe
              ? window.localStorage.setItem(
                  authConfig.user,
                  JSON.stringify(userDataResponse.data)
                )
              : null;

            // Store userData, actives project and organization  
            dispatch(userDataActions.getUserData(userDataResponse.data));          
            dispatch(
              fetchOrganizationById({
                organizationId: userDataResponse.data.organizations[0],
                storedToken :response.data.access_token      
              })
            );
            dispatch(
              fetchProject({
                organizationId: userDataResponse.data.organizations[0],
                projectId: userDataResponse.data.organizations[0].projects[0],
                storedToken :response.data.access_token             
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

        const redirectURL = returnUrl && returnUrl !== "/" ? returnUrl : "/";
        router.replace(redirectURL);
      })
      .catch((err) => {
        console.error("Error occurred:", err);
        if (errorCallback) errorCallback(err);
      });
  };

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

export { AuthContext, AuthProvider };
