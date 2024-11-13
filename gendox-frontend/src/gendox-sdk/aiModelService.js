import axios from "axios";
import apiRequests from "src/configs/apiRequest";


/**
 * Get all ai Model Providers
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getAllAiModelProviders = async (organizationId, storedToken) => {
    return axios.get(apiRequests.getAiModelProviders(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/**
 * Get model key by organization id
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getModelKeysByOrganizationId = async (organizationId, storedToken) => {
    return axios.get(apiRequests.aiModelKeys(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/**
 * Create a new ai model key
 * @param organizationId
 * @param storedToken
 * @param payload
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const createAiModelKey = async (organizationId, storedToken, payload) => {
    return axios.post(apiRequests.aiModelKeys(organizationId), payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}

/**
 * Update ai model key
 * @param organizationId
 * @param modelProviderKeyId
 * @param storedToken
 * @param payload
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const updateAiModelKey = async (organizationId, modelProviderKeyId, storedToken, payload) => {
    return axios.put(apiRequests.updateAiModelKey(organizationId, modelProviderKeyId), payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}


/**
 * Delete ai model key
 * @param organizationId
 * @param modelProviderKeyId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const deleteAiModelKey = async (organizationId, modelProviderKeyId, storedToken) => {
    return axios.delete(apiRequests.deleteAiModelKey(organizationId, modelProviderKeyId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        
    });
}


export default {
    getAllAiModelProviders,
    getModelKeysByOrganizationId,
    createAiModelKey,
    updateAiModelKey,
    deleteAiModelKey
}