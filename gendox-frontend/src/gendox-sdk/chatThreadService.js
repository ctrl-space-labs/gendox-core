import axios from "axios";
import apiRequests from "src/configs/apiRequest";

const getThreadMessagesByCriteria = async (chatThreadId, storedToken) => {
    let headers = {
        'Content-Type': 'application/json',
    };
    if (storedToken) {
        headers.Authorization = 'Bearer ' + storedToken;
    }
    return axios.get(
        apiRequests.getThreadMessagesByCriteria(chatThreadId, 0, 100),
        { headers }
    );
}

const getThreadsByCriteria = async (projectIdIn, threadIdIn, storedToken) => {
    let headers = {
        'Content-Type': 'application/json',
    };
    if (storedToken) {
        headers.Authorization = 'Bearer ' + storedToken;
    }
    return axios.get(
        apiRequests.getThreadsByCriteria(projectIdIn, threadIdIn),
        { headers }
    );
}


export default {
    getThreadMessagesByCriteria,
    getThreadsByCriteria
}