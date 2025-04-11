import axios from 'axios'
import apiRequests from 'src/configs/apiRequest'

const getThreadMessagesByCriteria = async (chatThreadId, token) => {
  let headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }
  return axios.get(apiRequests.getThreadMessagesByCriteria(chatThreadId, 0, 100), { headers })
}

const getThreadsByCriteria = async (projectIdIn, threadIdIn, token) => {
  let headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }
  return axios.get(apiRequests.getThreadsByCriteria(projectIdIn, threadIdIn), { headers })
}

/**
 * Get Thread Message Metadata By Message Id
 * @param threadId
 * @param messageId
 * @param token
 * @returns {Promise<axios.AxiosResponse<ThreadMessageMetadata>>}
 */
const getThreadMessageMetadataByMessageId = async (threadId, messageId, token) => {
  let headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }
  return axios.get(apiRequests.getThreadMessageMetadata(threadId, messageId), { headers })

}

/**
 * Update Chat Thread
 * @param organizationId
 * @param threadId
 * @param updatedChatThreadPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<ChatThread>>}
 */
const updateChatThread = async (organizationId, threadId, updatedChatThreadPayload, token) => {
  return axios.put(apiRequests.chatThread(organizationId, threadId), updatedChatThreadPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete Chat Thread
 * @param organizationId
 * @param threadId
 * @param token
 * @returns {Promise<axios.AxiosResponse<ChatThread>>}
 */
const deleteChatThread = async (organizationId, threadId, token) => {
  return axios.delete(apiRequests.chatThread(organizationId, threadId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getThreadMessagesByCriteria,
  getThreadsByCriteria,
  getThreadMessageMetadataByMessageId,
  updateChatThread,
  deleteChatThread
}
