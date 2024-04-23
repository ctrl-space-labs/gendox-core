import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";


/**
 * Get all organization users
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getUsersInOrganizationByOrgId = async (organizationId, projectId, storedToken) => {
    return axios.get(apiRequests.getUsersInOrganizationByOrgId(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        params: { projectId }
    });
}

/**
 * Get all organization users
 * @param organizationId 
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Organization>>}
 */
const getOrganizationById = async (organizationId, storedToken) => {
    return axios.get(apiRequests.getOrganizationById(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
        
    });
}



export default {
  getUsersInOrganizationByOrgId,
  getOrganizationById
}