import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Create EOScript for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param eoScriptPayload {title, description, scriptContent}
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOScript>>}
 */
const createEOScript = async (organizationId, projectId, taskId, eoScriptPayload, token) => {
  return axios.post(apiRequests.createEOScript(organizationId, projectId, taskId), eoScriptPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get all EOScripts for a Task (ordered by createdAt desc)
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOScript[]>>}
 */
const getEOScripts = async (organizationId, projectId, taskId, token) => {
  return axios.get(apiRequests.getEOScripts(organizationId, projectId, taskId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get latest EOScript for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOScript>>}
 */
const getLatestEOScript = async (organizationId, projectId, taskId, token) => {
  return axios.get(apiRequests.getLatestEOScript(organizationId, projectId, taskId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create EO geometry for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param geometryPayload {type, coordinates}
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOGeometry>>}
 *
 */
const createEOGeometry = async (organizationId, projectId, taskId, geometryPayload, token) => {
  return axios.post(apiRequests.createEOGeometry(organizationId, projectId, taskId), geometryPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Update EO geometry by ID for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param geometryId
 * @param geometryPayload {type, coordinates}
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOGeometry>>}
 */
const updateEOGeometry = async (organizationId, projectId, taskId, geometryId, geometryPayload, token) => {
  return axios.put(apiRequests.updateEOGeometry(organizationId, projectId, taskId, geometryId), geometryPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}


/**
 * Get EO geometries for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOGeometry[]>>}
 */
const getEOGeometries = async (organizationId, projectId, taskId, token) => {
  return axios.get(apiRequests.getEOGeometries(organizationId, projectId, taskId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete EO geometry by ID for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param geometryId
 * @param token
 * @returns {Promise<axios.AxiosResponse>}
 */
const deleteEOGeometry = async (organizationId, projectId, taskId, geometryId, token) => {
  return axios.delete(apiRequests.deleteEOGeometry(organizationId, projectId, taskId, geometryId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete all EO geometries for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse>}
 */
const deleteEOGeometries = async (organizationId, projectId, taskId, token) => {
  return axios.delete(apiRequests.deleteEOGeometries(organizationId, projectId, taskId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  createEOScript,
  getEOScripts,
  getLatestEOScript,
  createEOGeometry,
  updateEOGeometry,
  getEOGeometries,
  deleteEOGeometry,
  deleteEOGeometries
}
