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

    /**
     * Update Chat Thread
     * @param organizationId
     * @param threadId
     * @param updatedChatThreadPayload
     * @param storedToken
     * @returns {Promise<axios.AxiosResponse<ChatThread>>}
     */
    const updateChatThread = async (organizationId, threadId, updatedChatThreadPayload, storedToken) => {
        return axios.put(apiRequests.chatThread(organizationId, threadId), updatedChatThreadPayload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + storedToken
            }
        });
    }

    /**
     * Delete Chat Thread
     * @param organizationId
     * @param threadId
     * @param storedToken
     * @returns {Promise<axios.AxiosResponse<ChatThread>>}
     */
    const deleteChatThread = async (organizationId, threadId, storedToken) => {
        return axios.delete(apiRequests.chatThread(organizationId, threadId), {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + storedToken
            }
        });
    }






export default {
    getThreadMessagesByCriteria,
    getThreadsByCriteria,
    getThreadMessageMetadataByMessageId,
    updateChatThread,
    deleteChatThread
}