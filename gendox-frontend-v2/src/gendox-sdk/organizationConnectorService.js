import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Connector type constants — keep in sync with backend ConnectorTypesConstants.java.
 */
export const CONNECTOR_TYPES = {
  GOOGLE_EARTH_ENGINE: 'GOOGLE_EARTH_ENGINE'
}

/**
 * Fetch all connectors configured for an organization.
 * @param {string} organizationId
 * @param {string} token
 * @returns {Promise<axios.AxiosResponse<Array>>}
 */
const getOrganizationConnectors = async (organizationId, token) => {
  return axios.get(apiRequests.getOrganizationConnectors(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Fetch a single connector by type.
 * @param {string} organizationId
 * @param {string} connectorType
 * @param {string} token
 */
const getOrganizationConnector = async (organizationId, connectorType, token) => {
  return axios.get(apiRequests.getOrganizationConnector(organizationId, connectorType), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Upsert a connector for the given organization and type.
 * @param {string} organizationId
 * @param {string} connectorType
 * @param {object} payload  e.g. { connectorType, isActive, config: { projectId: '...' } }
 * @param {string} token
 */
const upsertOrganizationConnector = async (organizationId, connectorType, payload, token) => {
  return axios.put(apiRequests.upsertOrganizationConnector(organizationId, connectorType), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Delete a connector configuration.
 */
const deleteOrganizationConnector = async (organizationId, connectorType, token) => {
  return axios.delete(apiRequests.deleteOrganizationConnector(organizationId, connectorType), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

export default {
  getOrganizationConnectors,
  getOrganizationConnector,
  upsertOrganizationConnector,
  deleteOrganizationConnector
}
