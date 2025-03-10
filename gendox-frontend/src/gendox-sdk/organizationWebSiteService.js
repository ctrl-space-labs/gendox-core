import axios from 'axios'
import apiRequest from 'src/configs/apiRequest'

/**
 * Get organization web site by organization id
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const getOrganizationWebSitesByOrganizationId = async (organizationId, token) => {
  return axios.get(apiRequest.organizationWebSite(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create organization web site
 * @param organizationId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const createOrganizationWebSite = async (organizationId, payload, token) => {
  return axios.post(apiRequest.organizationWebSite(organizationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Update organization web site by organization web site id
 * @param organizationId
 * @param organizationWebSiteId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const updateOrganizationWebSite = async (organizationId, organizationWebSiteId, payload, token) => {
  return axios.put(apiRequest.updateOrganizationWebSite(organizationId, organizationWebSiteId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete organization web site by organization web site id
 * @param organizationId
 * @param organizationWebSiteId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const deleteOrganizationWebSite = async (organizationId, organizationWebSiteId, token) => {
  return axios.delete(apiRequest.deleteOrganizationWebSite(organizationId, organizationWebSiteId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getOrganizationWebSitesByOrganizationId,
  createOrganizationWebSite,
  updateOrganizationWebSite,
  deleteOrganizationWebSite
}
