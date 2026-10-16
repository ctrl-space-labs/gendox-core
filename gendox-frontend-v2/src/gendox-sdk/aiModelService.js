import axios from 'axios'
import apiRequests from 'src/configs/apiRequest'

/**
 * Get all ai Model Providers
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getAllAiModelProviders = async (organizationId, token) => {
  return axios.get(apiRequests.getAiModelProviders(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get model key by organization id
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getModelKeysByOrganizationId = async (organizationId, token) => {
  return axios.get(apiRequests.aiModelKeys(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create a new ai model key
 * @param organizationId
 * @param token
 * @param payload
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const createAiModelKey = async (organizationId, token, payload) => {
  return axios.post(apiRequests.aiModelKeys(organizationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Update ai model key
 * @param organizationId
 * @param modelProviderKeyId
 * @param token
 * @param payload
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const updateAiModelKey = async (organizationId, modelProviderKeyId, token, payload) => {
  return axios.put(apiRequests.updateAiModelKey(organizationId, modelProviderKeyId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete ai model key
 * @param organizationId
 * @param modelProviderKeyId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const deleteAiModelKey = async (organizationId, modelProviderKeyId, token) => {
  return axios.delete(apiRequests.deleteAiModelKey(organizationId, modelProviderKeyId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getAllAiModelProviders,
  getModelKeysByOrganizationId,
  createAiModelKey,
  updateAiModelKey,
  deleteAiModelKey
}
