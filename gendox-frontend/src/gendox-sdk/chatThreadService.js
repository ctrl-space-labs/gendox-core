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


    /**
     * Get Thread Message Metadata By Message Id
     * @param threadId
     * @param messageId
     * @param storedToken
     * @returns {Promise<axios.AxiosResponse<ThreadMessageMetadata>>}
     */
    const getThreadMessageMetadataByMessageId = async (threadId, messageId, storedToken) => {
        return axios.get(apiRequests.getThreadMessageMetadata(threadId, messageId), {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + storedToken
            }
        });
    }






export default {
    getThreadMessagesByCriteria,
    getThreadsByCriteria,
    getThreadMessageMetadataByMessageId
}