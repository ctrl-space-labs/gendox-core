import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";


/**
 * Get all organization users
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getUsersInOrganizationByOrgId = async (organizationId, storedToken) => {
    return axios.get(apiRequests.getUsersInOrganizationByOrgId(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
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

/**
 * create Organization
 * @param newOrganizationPayload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Organization>>}
 */
const createOrganization = async (newOrganizationPayload, storedToken) => {
    return axios.post(apiRequests.createOrganization(), newOrganizationPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      }
    });
  };

  /**
 * update Organization
 * @param organizationId
 * @param updatedOrganizationPayload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Organization>>}
 */
const updateOrganization = async (organizationId, updatedOrganizationPayload, storedToken) => {
  return axios.put(apiRequests.updateOrganization(organizationId), updatedOrganizationPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
    
  });
};

/**
 * update members role
 * @param organizationId
 * @param userId
 * @param data
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const updateMembersRole = async (organizationId, userId, data, storedToken) => {
  return axios.put(apiRequests.updateOrganizationMember(organizationId, userId), data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
}


/**
 * add organization member
 * @param organizationId
 * @param userOrganization 
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<List<UserOrganization>>}
 */
const addOrganizationMember = async (organizationId, userOrganization, storedToken) => {
  return axios.post(apiRequests.addOrganizationMember(organizationId), userOrganization, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
};


/**
 * remove organization member
 * @param organizationId
 * @param userId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const removeOrganizationMember = async (organizationId, userId, storedToken) => {  
  return axios.delete(apiRequests.removeOrganizationMember(organizationId, userId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
}


/**
 * Deactivate organization by ID
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse>}
 */
const deactivateOrganizationById = async (organizationId, storedToken) => {
  // Sends a PUT request to deactivate the organization identified by organizationId
  return axios.put(apiRequests.deactivateOrganizationById(organizationId), null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + storedToken,
    },
  });
};




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