import axios from "axios";
import apiRequest from "src/configs/apiRequest";

/**
 * Get organization web site by organization id
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const getOrganizationWebSitesByOrganizationId = async (organizationId, storedToken) => {
    return axios.get(apiRequest.organizationWebSite(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
        
    });
}

/** 
 * Create organization web site
 * @param organizationId
 * @param payload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const createOrganizationWebSite = async (organizationId, payload, storedToken) => {
    return axios.post(apiRequest.organizationWebSite(organizationId), payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/** 
 * Update organization web site by organization web site id
 * @param organizationId
 * @param organizationWebSiteId
 * @param payload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const updateOrganizationWebSite = async (organizationId, organizationWebSiteId, payload, storedToken) => {
    return axios.put(apiRequest.updateOrganizationWebSite(organizationId, organizationWebSiteId), payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/**
 * Delete organization web site by organization web site id
 * @param organizationId
 * @param organizationWebSiteId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>}
 */
const deleteOrganizationWebSite = async (organizationId, organizationWebSiteId, storedToken) => {
    return axios.delete(apiRequest.deleteOrganizationWebSite(organizationId, organizationWebSiteId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

export default {
    getOrganizationWebSitesByOrganizationId,
    createOrganizationWebSite,
    updateOrganizationWebSite,
    deleteOrganizationWebSite
}
