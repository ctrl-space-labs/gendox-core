import axios from "axios";
import apiRequests from "src/configs/apiRequest";


const postCompletionMessage = async (projectId, threadId, message, storedToken) => {
    let headers = {
        'Content-Type': 'application/json',
    };
    if (storedToken) {
        headers.Authorization = 'Bearer ' + storedToken;
    }

    console.log('headers:', headers);
    return axios.post(
        apiRequests.postCompletionModel(projectId),
        {
            value: message,
            threadId: threadId,
        },
        { headers }
    );
}


export default {
    postCompletionMessage
}