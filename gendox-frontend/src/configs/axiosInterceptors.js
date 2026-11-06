import axios from 'axios'
import apiRequests from 'src/configs/apiRequest'

let interceptorRegistered = false

/**
 * Registers a single global axios response interceptor that redirects the user
 * to the home page ('/') whenever a request fails with a 401 (expired/invalid token).
 * All gendox-sdk services use the default axios instance, so this catches every 401
 * in one place. Safe to call multiple times; it only registers once.
 */
export const registerAxiosInterceptors = () => {
  if (interceptorRegistered) return
  interceptorRegistered = true

  axios.interceptors.response.use(
    response => response,
    error => {
      // A 401 on the profile is handled by PKCEAuthProvider: a reload would send the same rejected token again, forever
      if (error?.response?.status === 401 && typeof window !== 'undefined' && error.config?.url !== apiRequests.getProfile) {
        // Full page reload (like pressing F5) to reset all app state
        window.location.href = '/'
      }

      return Promise.reject(error)
    }
  )
}
