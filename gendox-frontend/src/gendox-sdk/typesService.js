import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Get Tool Examples
 *
 */
const getToolExamples = async (token) => {
  return axios.get(apiRequests.getToolExamples(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}


export default {
  getToolExamples,
}
