import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

const headers = token => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
})

/**
 * The artifacts the agent wrote in a thread, oldest first, without their content.
 * Read only: an artifact is made and changed by the agent, through the chat.
 */
const getArtifacts = async (threadId, token) => {
  return axios.get(apiRequests.artifacts(threadId), { headers: headers(token) })
}

/** One artifact: its fields, its versions (number, message, date) and the content of the latest. */
const getArtifact = async (threadId, artifactId, token) => {
  return axios.get(apiRequests.artifact(threadId, artifactId), { headers: headers(token) })
}

/** The same as getArtifact, with the content of the given version. */
const getArtifactVersion = async (threadId, artifactId, version, token) => {
  return axios.get(apiRequests.artifactVersion(threadId, artifactId, version), { headers: headers(token) })
}

export default {
  getArtifacts,
  getArtifact,
  getArtifactVersion
}
