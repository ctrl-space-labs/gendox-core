// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** React redux
import { useDispatch } from 'react-redux'
import { userDataActions } from 'src/store/apps/userData/userData'
import { activeOrganizationActions } from 'src/store/apps/activeOrganization/activeOrganization'
import { activeProjectActions } from 'src/store/apps/activeProject/activeProject'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  activeProject: null,
  activeOrganization: null
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)
  const [activeProject, setActiveProject] = useState(defaultProvider.activeProject)
  const [activeOrganization, setActiveOrganization] = useState(defaultProvider.activeOrganization)

  const router = useRouter()
  const dispatch = useDispatch()

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

      if (!storedToken) {
        setLoading(false)

        return handleLogout()
      }

      try {
        const response = await axios.get(authConfig.getProfile, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` }
        })

        // Add 'role': 'admin' to the userDataResponse.data object
        const userData = { ...response.data, role: 'admin' }
        setUser(userData)
        dispatch(userDataActions.getUserData(userData))
        setLoading(false)
      } catch (error) {
        console.error('Error during auth initialization:', error)
        handleLogout() // Cleanup and redirect on error
      } finally {
        setLoading(false)
      }
    }

    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handling Active Organization and Project based on URL changes
  useEffect(() => {
    const { organizationId, projectId } = router.query
    if (user && user.organizations) {
      const updatedActiveOrganization = user.organizations.find(org => org.id === organizationId)
      if (updatedActiveOrganization) {
        setActiveOrganization(updatedActiveOrganization)
        dispatch(activeOrganizationActions.getActiveOrganization(updatedActiveOrganization))
        window.localStorage.setItem(authConfig.selectedOrganizationId, updatedActiveOrganization.id)

        const updatedActiveProject = updatedActiveOrganization.projects.find(proj => proj.id === projectId)
        if (updatedActiveProject) {
          setActiveProject(updatedActiveProject)
          dispatch(activeProjectActions.getActiveProject(updatedActiveProject))
          window.localStorage.setItem(authConfig.selectedProjectId, updatedActiveProject.id)
        }
      }
    }
  }, [user, router.query.organizationId, router.query.projectId])

  const handleLogin = (params, errorCallback) => {
    // Prepare form data
    const formData = new URLSearchParams()
    formData.append('grant_type', 'password')
    formData.append('client_id', 'gendox-public-client')
    formData.append('scope', 'openid email')
    formData.append('username', params.email)
    formData.append('password', params.password)

    axios({
      method: 'post',
      url: authConfig.loginEndpoint,
      data: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(async response => {
        // Set access token in local storage
        params.rememberMe
          ? window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.access_token)
          : null

        // Set refresh token in local storage
        params.rememberMe
          ? window.localStorage.setItem(authConfig.onTokenExpiration, response.data.refresh_token)
          : null
        const returnUrl = router.query.returnUrl

        // Fetch user data from getProfile
        setLoading(true)
        await axios
          .get(authConfig.getProfile, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + response.data.access_token
            }
          })
          .then(async userDataResponse => {
            // Add 'role': 'admin' to the userDataResponse.data object
            userDataResponse.data.role = 'admin'

            // Set the user state
            setUser(userDataResponse.data)

            // Store user data in local storage
            params.rememberMe
              ? window.localStorage.setItem(authConfig.user, JSON.stringify(userDataResponse.data))
              : null

            // Store actives project and organization
            setActiveProject(userDataResponse.data.organizations[0].projects[0])
            setActiveOrganization(userDataResponse.data.organizations[0])
            window.localStorage.setItem(authConfig.selectedOrganizationId, userDataResponse.data.organizations[0].id)
            window.localStorage.setItem(
              authConfig.selectedProjectId,
              userDataResponse.data.organizations[0].projects[0].id
            )

            // Store data in redux's store
            // dispatch(userDataActions.getUserData(userDataResponse.data))
            // dispatch(activeOrganizationActions.getActiveOrganization(userDataResponse.data.organizations[0]))
            // dispatch(activeProjectActions.getActiveProject(userDataResponse.data.organizations[0].projects[0]))

            const returnUrl = router.query.returnUrl
            const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
            router.replace(redirectURL)
            setLoading(false)
          })
          .catch(userDataError => {
            console.error('Error occurred while fetching user data:', userDataError)
          })

        const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
        router.replace(redirectURL)
      })
      .catch(err => {
        console.error('Error occurred:', err)
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/login')
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    activeProject,
    activeOrganization
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
