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
 * Duplicate a Task
 * @param organizationId
 * @param projectId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<Task>>}
 */
const duplicateTask = async (organizationId, projectId, payload, token) => {
  return axios.post(apiRequests.duplicateTask(organizationId, projectId), payload, {
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

/**
 * Update Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @param updatePayload
 * @returns {Promise<axios.AxiosResponse<Task>>}
 */
const updateTask = async (organizationId, projectId, taskId, token, updatePayload) => {
  return axios.put(apiRequests.taskRequest(organizationId, projectId, taskId), updatePayload, {
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
  return axios.get(apiRequests.taskRequest(organizationId, projectId, taskId), {
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
 * Create task nodes in batch
 * @param organizationId
 * @param projectId
 * @param taskNodesPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskNode[]>>}
 * */
const createTaskNodesBatch = async (organizationId, projectId, taskNodesPayload, token) => {
  return axios.post(apiRequests.createTaskNodesBatch(organizationId, projectId), taskNodesPayload, {
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
 * @param taskId
 * @param taskNodePayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<TaskNode>>}
 */
const updateTaskNode = async (organizationId, projectId, taskId, taskNodePayload, token) => {
  return axios.put(apiRequests.updateTaskNode(organizationId, projectId, taskId), taskNodePayload, {
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
 * Get Task Nodes by Criteria
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @param page
 * @param size
 * @returns {Promise<axios.AxiosResponse<TaskNode[]>>}
 */
const getTaskNodesByCriteria = async (organizationId, projectId, taskId, criteria, token, page, size) => {
  return axios.post(apiRequests.getTaskNodesByCriteria(organizationId, projectId, taskId, page, size), criteria, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/** * Get Document Pages for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse<DocumentPage[]>>}
 */
const getDocumentPages = async (organizationId, projectId, taskId, token, page, size) => {
  return axios.get(apiRequests.getDocumentPages(organizationId, projectId, taskId, page, size), {
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

/** Get Answer Task Nodes
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param answerTaskNodePayload
 * @param token
 * @param page
 * @param size
 * @returns {Promise<axios.AxiosResponse<TaskNode[]>>}
 */
const getAnswerTaskNodes = async (organizationId, projectId, taskId, answerTaskNodePayload, token, page, size) => {
  return axios.post(
    apiRequests.getAnswerTaskNodes(organizationId, projectId, taskId, page, size),
    answerTaskNodePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }
  )
}

const executeTaskByType = async (organizationId, projectId, taskId, criteria, token) => {
  return axios.post(apiRequests.executeTaskByType(organizationId, projectId, taskId), criteria, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get jobs by criteria with query parameters
 * @param organizationId
 * @param projectId
 * @param criteria - Object containing status and matchAllParams array
 * @param token
 * @returns {Promise<axios.AxiosResponse<JobExecution[]>>}
 */
const getJobsByCriteria = async (organizationId, projectId, criteria, token) => {
  const params = new URLSearchParams()
  // Add other criteria parameters if provided
  if (criteria.jobName) {
    params.append('jobName', criteria.jobName)
  }
  if (criteria.status) {
    params.append('status', criteria.status)
  }
  if (criteria.exitCode) {
    params.append('exitCode', criteria.exitCode)
  }

  // Add jobExecutionIdsIn if provided
  if (criteria.jobExecutionIdsIn && Array.isArray(criteria.jobExecutionIdsIn)) {
    criteria.jobExecutionIdsIn.forEach(id => {
      params.append('jobExecutionIdsIn', id)
    })
  }

  // Add matchAllParams if provided
  if (criteria.matchAllParams && Array.isArray(criteria.matchAllParams)) {
    criteria.matchAllParams.forEach((param, index) => {
      if (param.paramName && param.paramValue) {
        params.append(`matchAllParams[${index}].paramName`, param.paramName)
        params.append(`matchAllParams[${index}].paramValue`, param.paramValue)
      }
    })
  }

  const url = `${apiRequests.getJobsByCriteria(organizationId, projectId)}?${params.toString()}`

  return axios.get(url, {
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

/**
 * Delete a task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>>}
 */
const deleteTask = async (organizationId, projectId, taskId, token) => {
  return axios.delete(apiRequests.deleteTask(organizationId, projectId, taskId), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Download Task CSV
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param documentId
 * @param token
 * @returns {Promise<Blob>}
 */
const documentInsightsExportAllCSV = async (organizationId, projectId, taskId, token) => {
  const response = await axios.get(
    apiRequests.documentInsightsExportAllCSV(organizationId, projectId, taskId),
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    }
  )
  return response.data
}

/**
 * Download Document Insights CSV
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param documentNodeId
 * @param token
 * @returns {Promise<Blob>}
 */
const documentInsightsExportCSV = async (organizationId, projectId, taskId, documentNodeId, token) => {
  const response = await axios.get(
    apiRequests.documentInsightsExportCSV(organizationId, projectId, taskId, documentNodeId),
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }
  )
  return response.data
}



/**
 * Export Document Digitization CSV
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param documentNodeId
 * @param token
 * @returns {Promise<Blob>}
 */
const documentDigitizationExportCSV = async (organizationId, projectId, taskId, documentNodeId, token) => {
  const response = await axios.get(
    apiRequests.documentDigitizationExportCSV(organizationId, projectId, taskId, documentNodeId),
    {
      headers: {
        Authorization: 'Bearer ' + token
      },
      responseType: 'blob' // Important for CSV files!
    }
  )
  return response.data // This is the CSV blob
}

export default {
  createTask,
  duplicateTask,
  getTasks,
  updateTask,
  getTaskById,
  getTaskNodesByTaskId,
  getTaskNodesByCriteria,
  getDocumentPages,
  getAnswerTaskNodes,
  createTaskNode,
  createTaskNodesBatch,
  updateTaskNode,
  getTaskNodeById,
  createTaskEdge,
  getTaskEdgeById,
  getTaskEdgesByCriteria,
  executeTaskByType,
  getJobsByCriteria,
  deleteTaskNode,
  deleteTask,
  documentInsightsExportAllCSV,
  documentInsightsExportCSV,
  documentDigitizationExportCSV
}
