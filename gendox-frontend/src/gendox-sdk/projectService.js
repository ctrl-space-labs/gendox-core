import axios from "axios";
import apiRequests from "../configs/apiRequest";


/**
 * Get all projects by organizationId
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<ProjectAgent>>}
 */
const getProjectsByOrganization = async (organizationId, storedToken) => {
    return axios.get(apiRequests.getProjectsByOrganization(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    });
}


//export projectService with methods
export default {
    getProjectsByOrganization
}