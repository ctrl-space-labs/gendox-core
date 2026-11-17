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

/** Who an artifact is shared with now (its owner only): the agent's members, and named people. */
const getArtifactShares = async (threadId, artifactId, token) => {
  return axios.get(apiRequests.artifactShares(threadId, artifactId), { headers: headers(token) })
}

/**
 * Share an artifact; it replaces an earlier share with the same people.
 * @param share - { audience: PROJECT | USER, sharedWithUserId (USER only), version (null: follow the latest) }
 */
const shareArtifact = async (threadId, artifactId, share, token) => {
  return axios.post(apiRequests.artifactShares(threadId, artifactId), share, { headers: headers(token) })
}

/** Stop sharing; its link stops working at once. */
const stopSharingArtifact = async (threadId, artifactId, shareId, token) => {
  return axios.delete(apiRequests.artifactShare(threadId, artifactId, shareId), { headers: headers(token) })
}

/** A shared artifact as its reader sees it, with its content; never its conversation. */
const getSharedArtifact = async (shareId, token) => {
  return axios.get(apiRequests.sharedArtifact(shareId), { headers: headers(token) })
}

/**
 * The artifacts shared with the signed-in user in an organization, newest share first, without their content.
 * @param criteria - { projectId (one agent's only; every agent's when absent), search, artifactType }
 */
const getSharedWithMe = async (organizationId, { projectId, search, artifactType } = {}, token, page = 0, size = 50) => {
  return axios.get(apiRequests.sharedWithMe(organizationId), {
    params: {
      page,
      size,
      ...(projectId ? { projectId } : {}),
      ...(search ? { search } : {}),
      ...(artifactType ? { artifactType } : {})
    },
    headers: headers(token)
  })
}

export default {
  getArtifacts,
  getProjectArtifacts,
  getArtifact,
  getArtifactVersion,
  getArtifactShares,
  shareArtifact,
  stopSharingArtifact,
  getSharedArtifact,
  getSharedWithMe
}
