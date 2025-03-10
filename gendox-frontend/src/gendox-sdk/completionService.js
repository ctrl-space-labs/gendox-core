import axios from 'axios'
import apiRequests from 'src/configs/apiRequest'

const postCompletionMessage = async (projectId, threadId, message, localContexts, token) => {
  let headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }

  return axios.post(
    apiRequests.postCompletionModel(projectId),
    {
      value: message,
      threadId: threadId,
      localContexts: localContexts
    },
    { headers }
  )
}

export default {
  postCompletionMessage
}
