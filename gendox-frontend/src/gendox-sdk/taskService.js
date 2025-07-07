import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Create a Task
 * @param organizationId
 * @param projectId
 * @param taskPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<Task>>}
 */
const createTask = async (organizationId, projectId, taskPayload, token) => {
  return axios.post(apiRequests.createTask(organizationId, projectId), taskPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get all tasks for a project
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Task[]>>}
 */
const getTasks = async (organizationId, projectId, token) => {
  return axios.get(apiRequests.getTasks(organizationId, projectId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/** Get Task by ID
 * @param organizationId
 * @param projectId
 * @param id
 * @param token
 * @returns {Promise<axios.AxiosResponse<Task>>}
 * */
const getTaskById = async (organizationId, projectId, taskId, token) => {
  return axios.get(apiRequests.getTaskById(organizationId, projectId, taskId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create Task Node
 * @param organizationId
 * @param projectId
 * @param taskNodePayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskNode>>}
 */
const createTaskNode = async (organizationId, projectId, taskNodePayload, token) => {
  return axios.post(apiRequests.createTaskNode(organizationId, projectId), taskNodePayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Update Task Node
 * @param organizationId
 * @param projectId
 * @param taskNodePayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskNode>>}
 */
const updateTaskNode = async (organizationId, projectId, taskNodePayload, token) => {
  return axios.put(apiRequests.updateTaskNode(organizationId, projectId), taskNodePayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get Task Node by ID
 * @param organizationId
 * @param projectId
 * @param id
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskNode>>}
 */
const getTaskNodeById = async (organizationId, projectId, id, token) => {
  return axios.get(apiRequests.getTaskNodeById(organizationId, projectId, id), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get TaskNodes by Task ID with pagination
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @param page
 * @param size
 * @returns {Promise<axios.AxiosResponse<TaskNode[]>>}
 */
const getTaskNodesByTaskId = async (organizationId, projectId, taskId, token, page = 0, size = 20) => {
  return axios.get(apiRequests.getTaskNodesByTaskId(organizationId, projectId, taskId, page, size), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create Task Edge
 * @param organizationId
 * @param projectId
 * @param taskEdgePayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskEdge>>}
 */
const createTaskEdge = async (organizationId, projectId, taskEdgePayload, token) => {
  return axios.post(apiRequests.createTaskEdge(organizationId, projectId), taskEdgePayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get Task Edge by ID
 * @param organizationId
 * @param projectId
 * @param id
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskEdge>>}
 */
const getTaskEdgeById = async (organizationId, projectId, id, token) => {
  return axios.get(apiRequests.getTaskEdgeById(organizationId, projectId, id), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get Task Edges by Criteria (POST)
 * @param organizationId
 * @param projectId
 * @param criteria {relationType, fromNodeIds, toNodeIds}
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskEdge[]>>}
 */
const getTaskEdgesByCriteria = async (organizationId, projectId, criteria, token) => {
  return axios.post(apiRequests.getTaskEdgesByCriteria(organizationId, projectId), criteria, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

const executeTaskByType = async (organizationId, projectId, taskId, criteria, token) => {
  return axios.post(apiRequests.executeTaskByType(organizationId, projectId, taskId), criteria, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

const getJobStatus = async (organizationId, projectId, jobExecutionId, token) => {
  return axios.get(apiRequests.getJobStatus(organizationId, projectId, jobExecutionId), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Delete a task node and its connected nodes
 * @param organizationId
 * @param projectId
 * @param taskNodeId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>>}
 */
const deleteTaskNode = async (organizationId, projectId, taskNodeId, token) => {
  return axios.delete(apiRequests.deleteTaskNode(organizationId, projectId, taskNodeId), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}


export default {
  createTask,
  getTasks,
  getTaskById,
  getTaskNodesByTaskId,
  createTaskNode,
  updateTaskNode,
  getTaskNodeById,
  createTaskEdge,
  getTaskEdgeById,
  getTaskEdgesByCriteria,
  executeTaskByType,
  getJobStatus,
  deleteTaskNode
}
