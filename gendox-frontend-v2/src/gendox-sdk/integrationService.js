import axios from 'axios'
import apiRequest from 'src/configs/apiRequest'

/**
 * Get an integration by its id
 * @param integrationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Integration>}
 */
const getIntegration = async (organizationId, integrationId, token) => {
  return axios.get(apiRequest.integration(organizationId, integrationId), {
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

/**
 * Set how often an integration runs
 * The interval is replaced, not merged: an empty payload clears it, which means
 * the integration runs on every pass of the poller.
 * @param organizationId
 * @param integrationId
 * @param payload { runIntervalMinutes }
 * @param token
 * @returns {Promise<axios.AxiosResponse<Integration>}
 */
const setIntegrationSchedule = async (organizationId, integrationId, payload, token) => {
  return axios.put(apiRequest.integrationSchedule(organizationId, integrationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Remove an integration, leaving its documents in their project
 * The website row keeps its domain, its widget and its API key; it only stops
 * pointing at this integration.
 * @param organizationId
 * @param integrationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const deleteIntegration = async (organizationId, integrationId, token) => {
  return axios.delete(apiRequest.organizationIntegration(organizationId, integrationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getIntegration,
  getIntegrationsByOrganizationId,
  setIntegrationActive,
  setIntegrationSchedule,
  deleteIntegration
}
