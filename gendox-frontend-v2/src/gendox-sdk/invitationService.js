import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 *
 * @param email the email of the user to be invited
 * @param invitationToken the token of the invitation
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
const acceptInvitation = async (email, invitationToken) => {
  return axios.get(apiRequests.acceptInvitation(email, invitationToken), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Invite new project member
 * @param organizationId
 * @param invitationBody
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
const inviteProjectMember = async (organizationId, token, invitationBody) => {
  return axios.post(apiRequests.inviteProjectMember(organizationId), invitationBody, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get project invitations (paged).
 * @param {string} organizationId
 * @param {string} projectId
 * @param {string} token
 * @param {object} params query params (e.g. statusName, page, size, sort)
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
const getProjectInvitations = async (organizationId, projectId, token, params) => {
  return axios.get(apiRequests.getProjectInvitations(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    params
  })
}

export default {
  acceptInvitation,
  inviteProjectMember,
  getProjectInvitations
}
