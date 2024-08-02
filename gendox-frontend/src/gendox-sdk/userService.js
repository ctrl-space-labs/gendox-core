import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";


/**
 * Get all users 
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<List<User>>}
 */
const getAllUsers = async (organizationId, storedToken) => {
    return axios.get(apiRequests.getAllUsers(), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        params: {
          organizationId: organizationId
        }
    });
}

/**
 * Get all users public API
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<List<User>>}
 */
const getPublicUsers = async (storedToken) => {
    return axios.get(apiRequests.getPublicUsers(), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        params: {
          fetchAll: true
        }
    });
}

const deleteProfileCaches = async (storedToken) => {
    return axios.delete(apiRequests.deleteProfileCaches(), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    });
}



  




  


export default {
   getAllUsers,
   getPublicUsers
}