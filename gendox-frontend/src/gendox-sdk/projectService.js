import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";


/**
 * Get all projects by organizationId
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<ProjectAgent>>}
 */
const getProjectsByOrganization = async (organizationId, storedToken) => {
    return axios.get(apiRequests.getProjectsByOrganization(organizationId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    });
}

/**
 * Get project by id
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Project>>}
 */
const getProjectById = async (organizationId, projectId, storedToken) => {
    return axios.get(apiRequests.getProjectById(organizationId, projectId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        params: {
          projectId: projectId
        }
    });
}

/**
 * Get All Project Members
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<ProjectMembers[]>>}
 */
const getProjectMembers = async (organizationId, projectId, storedToken) => {
    return axios.get(apiRequests.getAllProjectMembers(organizationId, projectId), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        },
        params: {
          projectId: projectId
        }
    });
}

/**
 * update project
 * @param organizationId
 * @param projectId
 * @param updatedProjectPayload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const updateProject = async (organizationId, projectId, updatedProjectPayload, storedToken) => {
    return axios.put(apiRequests.updateProject(organizationId, projectId), updatedProjectPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      }
    });
  };

  /**
 * update project
 * @param organizationId
 * @param projectId
 * @param userIds
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<List<ProjectMembers>>}
 */
const addProjectMember = async (organizationId, projectId, userIds, storedToken) => {
    return axios.post(apiRequests.addProjectMember(organizationId, projectId), userIds, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      }
    });
  };


  addProjectMember


export default {
    getProjectsByOrganization,
    getProjectById,
    getProjectMembers,
    updateProject,
    addProjectMember
}