import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Get all users
 * @param token
 * @returns {Promise<axios.AxiosResponse<List<User>>}
 */
const getAllUsers = async (organizationId, token) => {
  return axios.get(apiRequests.getAllUsers(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    params: {
      organizationId: organizationId
    }
  })
}

/**
 * Get all users public API
 * @param token
 * @returns {Promise<axios.AxiosResponse<List<User>>}
 */
const getPublicUsers = async token => {
  return axios.get(apiRequests.getPublicUsers(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    params: {
      fetchAll: true
    }
  })
}

const deleteProfileCaches = async token => {
  return axios.delete(apiRequests.deleteProfileCaches(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Deactivate user by ID
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse>}
 */
const deactivateUserById = async (userId, token) => {
  // No data to send in the body, so we pass null
  return axios.put(apiRequests.deactivateUserById(userId), null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

const logoutUser = async (token) => {
  return axios.post(apiRequests.userLogout(), null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getAllUsers,
  getPublicUsers,
  deactivateUserById,
  logoutUser
}
