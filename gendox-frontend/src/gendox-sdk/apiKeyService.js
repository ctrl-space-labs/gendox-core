import axios from "axios";
import apiRequests from "src/configs/apiRequest";





/**
 * Get Api Key by organization id
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getApiKeysByOrganizationId = async (organizationId, storedToken) => {
    console.log(apiRequests.aiApiKeys(organizationId));
    return axios.get(apiRequests.aiApiKeys(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/**
 * Create Api Key by organization id
 * @param organizationId
 * @param payload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const createApiKey = async (organizationId, payload, storedToken) => {
    return axios.post(apiRequests.aiApiKeys(organizationId), payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}



/** 
 * Update Api Key by apiKey id
 * @param organizationId
 * @param apiKeyId
 * @param payload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const updateApiKey = async (organizationId, apiKeyId, payload, storedToken) => {
    return axios.put(apiRequests.updateApiKey(organizationId, apiKeyId), payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/**
 * Delete Api Key by apiKey id
 * @param organizationId
 * @param apiKeyId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const deleteApiKey = async (organizationId, apiKeyId, storedToken) => {
    return axios.delete(apiRequests.deleteApiKey(organizationId, apiKeyId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}



export default {
    getApiKeysByOrganizationId,
    createApiKey,
    updateApiKey,
    deleteApiKey
}