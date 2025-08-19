import commonConfig from 'src/configs/common.config.js'

const url = commonConfig.gendoxUrl

export default {
  getProfile: url + 'profile',
  deleteProfileCaches: () => `${url}profile/caches`,

  getAllUsers: () => `${url}users`,

  getPublicUsers: (page = 0, size = 10000) => `${url}users/public?page=${page}&size=${size}`,

  getProjectById: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,
  getProjectsByOrganization: organizationId => `${url}organizations/${organizationId}/projects`,

  getDocumentsByCriteriaProjectId: (organizationId, projectId, page, sort = 'createdAt,desc') =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents?page=${page}&sort=${sort}`,

  findDocumentsByCriteria: (organizationId, projectId, page, size, sort = 'createdAt,desc') =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/search?page=${page}&size=${size}&sort=${sort}`,

  getUsersInOrganizationByOrgId: organizationId => `${url}organizations/${organizationId}/users`,

  getAllProjectMembers: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users`,

  updateProject: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,

  updateOrganization: organizationId => `${url}organizations/${organizationId}`,

  createProject: organizationId => `${url}organizations/${organizationId}/projects`,

  createOrganization: () => `${url}organizations`,

  postCompletionModel: projectId => `${url}messages/completions?projectId=${projectId}`,

  // getThreadsByCriteria: (projectIdIn) => {
  //   const projectIds = projectIdIn.join(",");
  //   return `${url}threads?projectIdIn=${projectIds}`;
  // },

  postSearchModel: (projectId, size, page) => `${url}messages/search?projectId=${projectId}&page=${page}&size=${size}`,

  getThreadsByCriteria: (projectIdIn, threadIdIn) => {
    let urlWithParams = `${url}threads?size=100&sort=latestMessage,desc&minMessages=2`

    if (projectIdIn?.length > 0) {
      const projectIds = projectIdIn.join(',')
      urlWithParams += `&projectIdIn=${projectIds}`
    }

    if (threadIdIn?.length > 0) {
      const threadIds = threadIdIn.join(',')
      urlWithParams += `&threadIdIn=${threadIds}`
    }

    return urlWithParams
  },

  getThreadMessagesByCriteria: (threadId, page = 0, size = 10, sort = 'createdAt,desc') =>
    `${url}threads/${threadId}/messages?page=${page}&size=${size}&sort=${sort}`,

  documentSections: documentId => `${url}documents/${documentId}/sections`,

  documentInstance: (organizationId, projectId, documentId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/${documentId}`,

  documentSection: (documentId, sectionId) => `${url}documents/${documentId}/sections/${sectionId}`,

  getDocumentById: documentId => `${url}documents/${documentId}`,

  updateSectionsOrder: documentId => `${url}documents/${documentId}/sections-order`,

  uploadDocument: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/upload`,

  uploadSingleDocument: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/upload-single`,

  triggerJobs: (organizationId, projectId, jobName, projectIdParam) => {
    let urlWithParams = `${url}organizations/${organizationId}/projects/${projectId}/splitting/training?jobName=${jobName}`

    if (projectIdParam) {
      urlWithParams += `&projectId=${projectIdParam}`
    }

    return urlWithParams
  },

  getOrganizationById: organizationId => `${url}organizations/${organizationId}`,

  addProjectMember: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/members`,

  removeProjectMember: (organizationId, projectId, userId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users/${userId}`,

  inviteProjectMember: organizationId => `${url}organizations/${organizationId}/invitations`,

  addOrganizationMember: organizationId => `${url}organizations/${organizationId}/users`,

  removeOrganizationMember: (organizationId, userId) => `${url}organizations/${organizationId}/users/${userId}`,

  updateOrganizationMember: (organizationId, userId) => `${url}organizations/${organizationId}/users/${userId}/roles`,

  getAiModelByCategory: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/ai-models/categories`,

  getAiModels: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}/ai-models`,

  getAiModelProviders: organizationId => `${url}organizations/${organizationId}/ai-models/providers`,

  aiModelKeys: organizationId => `${url}organizations/${organizationId}/model-keys`,

  updateAiModelKey: (organizationId, modelProviderKeyId) =>
    `${url}organizations/${organizationId}/model-keys/${modelProviderKeyId}`,

  deleteAiModelKey: (organizationId, modelProviderKeyId) =>
    `${url}organizations/${organizationId}/model-keys/${modelProviderKeyId}`,

  acceptInvitation: (email, token) => `${url}invitations/acceptance?email=${email}&token=${token}`,

  organizationPlans: organizationId => `${url}organizations/${organizationId}/organization-plans`,

  cancelSubscriptionPlan: (organizationPlanId, organizationId) =>
    `${url}organizations/${organizationId}/organization-plans/${organizationPlanId}/cancel`,

  subscriptionPlans: organizationId => `${url}organizations/${organizationId}/subscription-plans`,

  getThreadMessageMetadata: (threadId, messageId) => `${url}threads/${threadId}/message-metadata/${messageId}`,

  deactivateUserById: userId => `${url}users/${userId}/deactivate`,

  deactivateOrganizationById: organizationId => `${url}organizations/${organizationId}/deactivate`,

  deactivateProjectById: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/deactivate`,

  aiApiKeys: organizationId => `${url}organizations/${organizationId}/api-keys`,

  deleteApiKey: (organizationId, apiKeyId) => `${url}organizations/${organizationId}/api-keys/${apiKeyId}`,

  updateApiKey: (organizationId, apiKeyId) => `${url}organizations/${organizationId}/api-keys/${apiKeyId}`,

  organizationWebSite: organizationId => `${url}organizations/${organizationId}/websites`,

  updateOrganizationWebSite: (organizationId, organizationWebSiteId) =>
    `${url}organizations/${organizationId}/websites/${organizationWebSiteId}`,

  deleteOrganizationWebSite: (organizationId, organizationWebSiteId) =>
    `${url}organizations/${organizationId}/websites/${organizationWebSiteId}`,

  chatThread: (organizationId, threadId) => `${url}organizations/${organizationId}/threads/${threadId}`,

  userLogout: () => `${url}users/logout`,

  getToolExamples: () => `${url}types/ai-tool-examples`,

  createTask: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}/tasks`,

  getTasks: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}/tasks`,

  taskRequest: (organizationId, projectId, taskId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`,

  createTaskNode: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-nodes`,

  createTaskNodesBatch: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-nodes/batch`,

  updateTaskNode: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-nodes`,

  updateTaskNodeForDocumentDigitization: (organizationId, projectId, taskId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/task-nodes/document-digitization`,

  getTaskNodeById: (organizationId, projectId, id) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-nodes?id=${id}`,

  getTaskNodesByTaskId: (organizationId, projectId, taskId, page = 0, size = 20) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/task-nodes?page=${page}&size=${size}`,

  getDocumentPages: (organizationId, projectId, taskId, page, size) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/document-pages?page=${page}&size=${size}`,

  getTaskNodesByCriteria: (organizationId, projectId, taskId, page , size) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/task-nodes/search?page=${page}&size=${size}`,

  getAnswerTaskNodes: (organizationId, projectId, taskId, page , size ) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/answers/batch?page=${page}&size=${size}`,

  createTaskEdge: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-edges`,

  getTaskEdgeById: (organizationId, projectId, id) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-edges?id=${id}`,

  getTaskEdgesByCriteria: (organizationId, projectId, page = 0, size = 20) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-edges/search?page=${page}&size=${size}`,

  executeTaskByType: (organizationId, projectId, taskId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/execute`,

  getJobStatus: (organizationId, projectId, jobExecutionId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/jobs/${jobExecutionId}/status`,

  deleteTaskNode: (organizationId, projectId, taskNodeId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/task-nodes/${taskNodeId}`,

  deleteTask: (organizationId, projectId, taskId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`,

  exportTaskCsv: (organizationId, projectId, taskId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/export-csv`,

  documentDigitizationExportCSV: (organizationId, projectId, taskId, documentNodeId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/documents/${documentNodeId}/export-csv`,


}
