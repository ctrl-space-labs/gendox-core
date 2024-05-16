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

const deleteProfileCaches = async (storedToken) => {
    return axios.delete(apiRequests.deleteProfileCaches(), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    });
}



  




  


export default {
   getAllUsers
}