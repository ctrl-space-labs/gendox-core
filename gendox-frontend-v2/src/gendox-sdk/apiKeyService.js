import axios from 'axios'
import apiRequests from 'src/configs/apiRequest'

/**
 * Get Api Key by organization id
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getApiKeysByOrganizationId = async (organizationId, token) => {
  return axios.get(apiRequests.aiApiKeys(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create Api Key by organization id
 * @param organizationId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const createApiKey = async (organizationId, payload, token) => {
  return axios.post(apiRequests.aiApiKeys(organizationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Update Api Key by apiKey id
 * @param organizationId
 * @param apiKeyId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const updateApiKey = async (organizationId, apiKeyId, payload, token) => {
  return axios.put(apiRequests.updateApiKey(organizationId, apiKeyId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete Api Key by apiKey id
 * @param organizationId
 * @param apiKeyId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const deleteApiKey = async (organizationId, apiKeyId, token) => {
  return axios.delete(apiRequests.deleteApiKey(organizationId, apiKeyId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getApiKeysByOrganizationId,
  createApiKey,
  updateApiKey,
  deleteApiKey
}
