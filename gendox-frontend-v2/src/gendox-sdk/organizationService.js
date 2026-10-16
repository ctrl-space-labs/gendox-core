import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Get all organization users
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getUsersInOrganizationByOrgId = async (organizationId, token) => {
  return axios.get(apiRequests.getUsersInOrganizationByOrgId(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get all organization users
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Organization>>}
 */
const getOrganizationById = async (organizationId, token) => {
  return axios.get(apiRequests.getOrganizationById(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * create Organization
 * @param newOrganizationPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<Organization>>}
 */
const createOrganization = async (newOrganizationPayload, token) => {
  return axios.post(apiRequests.createOrganization(), newOrganizationPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * update Organization
 * @param organizationId
 * @param updatedOrganizationPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<Organization>>}
 */
const updateOrganization = async (organizationId, updatedOrganizationPayload, token) => {
  return axios.put(apiRequests.updateOrganization(organizationId), updatedOrganizationPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * update members role
 * @param organizationId
 * @param userId
 * @param data
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const updateMembersRole = async (organizationId, userId, data, token) => {
  return axios.put(apiRequests.updateOrganizationMember(organizationId, userId), data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * add organization member
 * @param organizationId
 * @param userOrganization
 * @param token
 * @returns {Promise<axios.AxiosResponse<List<UserOrganization>>}
 */
const addOrganizationMember = async (organizationId, userOrganization, token) => {
  return axios.post(apiRequests.addOrganizationMember(organizationId), userOrganization, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * remove organization member
 * @param organizationId
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const removeOrganizationMember = async (organizationId, userId, token) => {
  return axios.delete(apiRequests.removeOrganizationMember(organizationId, userId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Deactivate organization by ID
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse>}
 */
const deactivateOrganizationById = async (organizationId, token) => {
  // Sends a PUT request to deactivate the organization identified by organizationId
  return axios.put(apiRequests.deactivateOrganizationById(organizationId), null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getUsersInOrganizationByOrgId,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateMembersRole,
  addOrganizationMember,
  removeOrganizationMember,
  deactivateOrganizationById
}
