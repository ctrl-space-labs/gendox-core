import axios from 'axios'
import apiRequest from 'src/configs/apiRequest'

/**
 * Get an integration by its id
 * @param integrationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Integration>}
 */
const getIntegration = async (integrationId, token) => {
  return axios.get(apiRequest.integration(integrationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get every integration of an organization
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Integration[]>}
 */
const getIntegrationsByOrganizationId = async (organizationId, token) => {
  return axios.get(apiRequest.integrationsByOrganization(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Turn an integration on or off, leaving everything else about it alone
 * @param organizationId
 * @param integrationId
 * @param payload { active }
 * @param token
 * @returns {Promise<axios.AxiosResponse<Integration>}
 */
const setIntegrationActive = async (organizationId, integrationId, payload, token) => {
  return axios.put(apiRequest.integrationActive(organizationId, integrationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getIntegration,
  getIntegrationsByOrganizationId,
  setIntegrationActive
}