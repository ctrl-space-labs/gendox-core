import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Get all projects by organizationId
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<ProjectAgent>>}
 */
// size: without it the API returns its default page of 20, and the other agents are missing; 100 is its maximum
const getProjectsByOrganization = async (organizationId, token, params = { size: 100 }) => {
  let headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }
  return axios.get(apiRequests.getProjectsByOrganization(organizationId), { headers, params })
}

/**
 * How many documents and members each agent of the organization the user can see has
 * @returns {Promise<axios.AxiosResponse<{projectId, documentCount, memberCount}[]>>}
 */
const getProjectStatistics = async (organizationId, token) => {
  return axios.get(apiRequests.getProjectStatistics(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * The agent's definition (its setup, not its content) as a file, in the format the Accept header asks for
 * @param format - 'json' | 'yaml'
 * @returns {Promise<axios.AxiosResponse<Blob>>}
 */
const getAgentDefinition = async (organizationId, projectId, format, token) => {
  return axios.get(apiRequests.getAgentDefinition(organizationId, projectId), {
    headers: {
      Accept: format === 'yaml' ? 'application/yaml' : 'application/json',
      Authorization: 'Bearer ' + token
    },
    responseType: 'blob'
  })
}

/**
 * Get project by id
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Project>>}
 */
const getProjectById = async (organizationId, projectId, token) => {
  return axios.get(apiRequests.getProjectById(organizationId, projectId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    params: {
      projectId: projectId
    }
  })
}

/**
 * Get All Project Members
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse<ProjectMembers[]>>}
 */
const getProjectMembers = async (organizationId, projectId, token) => {
  return axios.get(apiRequests.getAllProjectMembers(organizationId, projectId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    params: {
      projectId: projectId
    }
  })
}

/**
 * update project
 * @param organizationId
 * @param projectId
 * @param updatedProjectPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const updateProject = async (organizationId, projectId, updatedProjectPayload, token) => {
  return axios.put(apiRequests.updateProject(organizationId, projectId), updatedProjectPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * create project
 * @param organizationId
 * @param newProjectPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<Project>>}
 */
const createProject = async (organizationId, newProjectPayload, token) => {
  return axios.post(apiRequests.createProject(organizationId), newProjectPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * add Project Members
 * @param organizationId
 * @param projectId
 * @param userIds
 * @param token
 * @returns {Promise<axios.AxiosResponse<List<ProjectMembers>>}
 */
const addProjectMember = async (organizationId, projectId, userIds, token) => {
  return axios.post(apiRequests.addProjectMember(organizationId, projectId), userIds, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * delete Project Members
 * @param organizationId
 * @Param projectId
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const removeProjectMember = async (organizationId, projectId, userId, token) => {
  return axios.delete(apiRequests.removeProjectMember(organizationId, projectId, userId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * get Ai models by categories
 * @param organizationId
 * @param projectId
 * @param aiModelCategories
 * @param token
 * @returns {Promise<axios.AxiosResponse<Map<String, List<AiModel>}
 */
const getAiModelByCategory = async (organizationId, projectId, categories, token) => {
  return axios.get(
    apiRequests.getAiModelByCategory(organizationId, projectId),
    { categories },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  )
}

/**
 * get Ai models
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Map<String, List<AiModel>}
 */
const getAiModels = async (organizationId, projectId, token) => {
  return axios.get(apiRequests.getAiModels(organizationId, projectId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Deactivate project by ID
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse>}
 */
const deactivateProjectById = async (organizationId, projectId, token) => {
  return axios.put(apiRequests.deactivateProjectById(organizationId, projectId), null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getProjectsByOrganization,
  getProjectStatistics,
  getAgentDefinition,
  getProjectById,
  getProjectMembers,
  updateProject,
  createProject,
  addProjectMember,
  removeProjectMember,
  getAiModels,
  getAiModelByCategory,
  deactivateProjectById
}
