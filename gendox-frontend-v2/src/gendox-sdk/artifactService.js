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

/**
 * The artifacts of the user's own conversations with an agent, newest change first, without their content;
 * each names its conversation (threadName).
 * @param criteria - { search, artifactType } — a title fragment, and HTML | SVG | MARKDOWN | CODE
 */
const getProjectArtifacts = async (organizationId, projectId, criteria = {}, token, page = 0, size = 50) => {
  const { search, artifactType } = criteria

  return axios.get(apiRequests.projectArtifacts(organizationId, projectId), {
    params: { page, size, ...(search ? { search } : {}), ...(artifactType ? { artifactType } : {}) },
    headers: headers(token)
  })
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
  getProjectArtifacts,
  getArtifact,
  getArtifactVersion
}
