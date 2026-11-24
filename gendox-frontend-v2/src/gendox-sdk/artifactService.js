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
 * The user's artifacts with an agent, newest change first, without their content. Their own, each naming its
 * conversation (threadName); or, with sharedWithMe, the others' they have a role on, each naming its owner (ownerName).
 * @param criteria - { search, artifactType, sharedWithMe } — a title fragment, and HTML | SVG | MARKDOWN | CODE
 */
const getProjectArtifacts = async (organizationId, projectId, criteria = {}, token, page = 0, size = 50) => {
  const { search, artifactType, sharedWithMe } = criteria

  return axios.get(apiRequests.projectArtifacts(organizationId, projectId), {
    params: {
      page,
      size,
      ...(search ? { search } : {}),
      ...(artifactType ? { artifactType } : {}),
      ...(sharedWithMe ? { sharedWithMe: true } : {})
    },
    headers: headers(token)
  })
}

/** One artifact of a thread: its fields, its versions (number, message, date) and the content of the latest. */
const getArtifact = async (threadId, artifactId, token) => {
  return axios.get(apiRequests.artifact(threadId, artifactId), { headers: headers(token) })
}

/** The same as getArtifact, with the content of the given version. */
const getArtifactVersion = async (threadId, artifactId, version, token) => {
  return axios.get(apiRequests.artifactVersion(threadId, artifactId, version), { headers: headers(token) })
}

/**
 * One artifact by its id, for anyone with a role on it, from any conversation or none: as getArtifact, with the
 * user's role (yourRole: VIEW | INTERACT | EDIT | OWNER). Its conversation (threadId) only for its owner.
 */
const openArtifact = async (artifactId, token) => {
  return axios.get(apiRequests.artifactById(artifactId), { headers: headers(token) })
}

/** The same as openArtifact, with the content of the given version. */
const openArtifactVersion = async (artifactId, version, token) => {
  return axios.get(apiRequests.artifactVersionById(artifactId, version), { headers: headers(token) })
}

/**
 * Who has a role on an artifact: its owner, the agent's members (generalAccessRole, null for none), and the people
 * invited with their roles; with the user's own role (yourRole). Anyone with a role may read it; only the owner
 * changes it.
 */
const getSharing = async (artifactId, token) => {
  return axios.get(apiRequests.artifactSharing(artifactId), { headers: headers(token) })
}

/**
 * The role every member of the agent has on it, or null for only the owner and the people invited.
 * @param role - VIEW | INTERACT | EDIT | null
 * @returns the sharing, as getSharing
 */
const setGeneralAccess = async (artifactId, role, token) => {
  return axios.put(apiRequests.artifactGeneralAccess(artifactId), { role }, { headers: headers(token) })
}

/**
 * Invite a member of the agent with a role, or change the role of one invited.
 * @param role - VIEW | INTERACT | EDIT
 * @returns the sharing, as getSharing
 */
const setMemberRole = async (artifactId, userId, role, token) => {
  return axios.put(apiRequests.artifactMember(artifactId, userId), { role }, { headers: headers(token) })
}

/** Take an invited person's role away. @returns the sharing, as getSharing */
const removeMember = async (artifactId, userId, token) => {
  return axios.delete(apiRequests.artifactMember(artifactId, userId), { headers: headers(token) })
}

/**
 * A new conversation of the user's own on an artifact made elsewhere, where the agent can change it (EDIT and up).
 * @returns {{ threadId }}
 */
const openInNewChat = async (artifactId, token) => {
  return axios.post(apiRequests.artifactChats(artifactId), null, { headers: headers(token) })
}

export default {
  getArtifacts,
  getProjectArtifacts,
  getArtifact,
  getArtifactVersion,
  openArtifact,
  openArtifactVersion,
  getSharing,
  setGeneralAccess,
  setMemberRole,
  removeMember,
  openInNewChat
}
