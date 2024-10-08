import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";


/**
 * Get all projects by organizationId
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<ProjectAgent>>}
 */
const getProjectsByOrganization = async (organizationId, storedToken) => {
    let headers = {
        'Content-Type': 'application/json',
    };
    if (storedToken) {
        headers.Authorization = 'Bearer ' + storedToken;
    }
    return axios.get(apiRequests.getProjectsByOrganization(organizationId), { headers });
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
 * create project
 * @param organizationId 
 * @param newProjectPayload
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Project>>}
 */
const createProject = async (organizationId, newProjectPayload, storedToken) => {
  return axios.post(apiRequests.createProject(organizationId ), newProjectPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
};

  /**
 * add Project Members
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


  /**
   * delete Project Members
   * @param organizationId
   * @Param projectId
   * @param userId
   * @param storedToken
   * @returns {Promise<axios.AxiosResponse<String>>}
   */
  const removeProjectMember = async (organizationId, projectId, userId, storedToken) => {
    return axios.delete(apiRequests.removeProjectMember(organizationId, projectId, userId), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      }
    });
  }

   /**
 * get Ai models by categories 
 * @param organizationId
 * @param projectId
 * @param aiModelCategories
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Map<String, List<AiModel>}
 */
const getAiModelByCategory = async (organizationId, projectId, categories, storedToken) => {  
  return axios.get(apiRequests.getAiModelByCategory(organizationId, projectId), 
   {categories},
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
};

   /**
 * get Ai models 
 * @param organizationId
 * @param projectId 
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Map<String, List<AiModel>}
 */
   const getAiModels = async (organizationId, projectId, storedToken) => {    
    return axios.get(apiRequests.getAiModels(organizationId, projectId),     
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      }
    });
  };

  /**
 * Deactivate project by ID
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse>}
 */
const deactivateProjectById = async (organizationId, projectId, storedToken) => {
  return axios.put(apiRequests.deactivateProjectById(organizationId, projectId), null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + storedToken,
    },
  });
};


  




  


export default {
    getProjectsByOrganization,
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