import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

const postSearchMessage = async (message, projectId, size, page, token) => {
  let headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = 'Bearer ' + token
  }

  return axios.post(
    apiRequests.postSearchModel(projectId, size, page),
    {
      value: message
    },
    { headers }
  )
}

export default {
  postSearchMessage
}
