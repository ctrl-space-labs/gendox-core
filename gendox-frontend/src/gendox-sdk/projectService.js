import axios from "axios";
import apiRequests from "../configs/apiRequest";


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