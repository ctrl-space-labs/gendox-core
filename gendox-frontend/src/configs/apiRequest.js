const url = process.env.NEXT_PUBLIC_GENDOX_URL;



export default {
  getProfile: url + "profile",
  deleteProfileCaches: () =>
    `${url}profile/caches`,

  getAllUsers: () => `${url}users`,

  getPublicUsers: (page = 0, size = 10000) => `${url}users/public?page=${page}&size=${size}`,

  getProjectById: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}`,
  getProjectsByOrganization: (organizationId) =>
    `${url}organizations/${organizationId}/projects`,  

  getDocumentsByProject: (organizationId, projectId, page, sort = "createdAt,desc") =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents?page=${page}&sort=${sort}`,  

  getUsersInOrganizationByOrgId: (organizationId) =>
    `${url}organizations/${organizationId}/users`,

  getAllProjectMembers: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users`,

  updateProject: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}`,

  updateOrganization: (organizationId) =>
    `${url}organizations/${organizationId}`,

  createProject: (organizationId) =>
    `${url}organizations/${organizationId}/projects`,

  createOrganization: () => `${url}organizations`,

  postCompletionModel: (projectId) =>
    `${url}messages/semantic-completion?projectId=${projectId}`,

  // getThreadsByCriteria: (projectIdIn) => {
  //   const projectIds = projectIdIn.join(",");
  //   return `${url}threads?projectIdIn=${projectIds}`;
  // },

  getThreadsByCriteria: (projectIdIn, threadIdIn) => {
    let urlWithParams = `${url}threads?size=100&sort=createdAt,desc`;

    if (projectIdIn?.length > 0) {
      const projectIds = projectIdIn.join(",");
      urlWithParams += `&projectIdIn=${projectIds}`;
    }

    if (threadIdIn?.length > 0) {
      const threadIds = threadIdIn.join(",");
      urlWithParams += `&threadIdIn=${threadIds}`;
    }

    return urlWithParams;
  },

  getThreadMessagesByCriteria: (
    threadId,
    page = 0,
    size = 10,
    sort = "createdAt,desc"
  ) =>
    `${url}threads/${threadId}/messages?page=${page}&size=${size}&sort=${sort}`,

  documentSections: (documentId) => `${url}documents/${documentId}/sections`,

  documentInstance: (organizationId, projectId, documentId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/${documentId}`,

  documentSection: (documentId, sectionId) =>
    `${url}documents/${documentId}/sections/${sectionId}`,

  getDocumentById: (documentId) => `${url}documents/${documentId}`,

  updateSectionsOrder: (documentId) => 
    `${url}documents/${documentId}/sections-order`,

  uploadDocument: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/upload`,

  triggerJobs: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/splitting/training`,

  getOrganizationById: (organizationId) =>
    `${url}organizations/${organizationId}`,

  addProjectMember: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/members`,

  removeProjectMember: (organizationId, projectId, userId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users/${userId}`,

  inviteProjectMember: (organizationId) =>
    `${url}organizations/${organizationId}/invitations`,

  addOrganizationMember: (organizationId) =>
    `${url}organizations/${organizationId}/users`,

  removeOrganizationMember: (organizationId, userId) =>
    `${url}organizations/${organizationId}/users/${userId}`,

  updateOrganizationMember: (organizationId, userId) =>
    `${url}organizations/${organizationId}/users/${userId}/roles`,

  getAiModelByCategory: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/ai-models/categories`,

  getAiModels: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/ai-models`,

  getAiModelProviders: (organizationId) =>
    `${url}organizations/${organizationId}/ai-models/providers`,

  aiModelKeys: (organizationId) =>
    `${url}organizations/${organizationId}/model-keys`,

  updateAiModelKey: (organizationId, modelProviderKeyId) =>
    `${url}organizations/${organizationId}/model-keys/${modelProviderKeyId}`,

  deleteAiModelKey: (organizationId, modelProviderKeyId) =>
    `${url}organizations/${organizationId}/model-keys/${modelProviderKeyId}`,

  acceptInvitation: (email, token) =>
    `${url}invitations/acceptance?email=${email}&token=${token}`,

  organizationPlans: (organizationId) =>
    `${url}organizations/${organizationId}/organization-plans`,

  cancelSubscriptionPlan: (organizationPlanId, organizationId,) =>
    `${url}organizations/${organizationId}/organization-plans/${organizationPlanId}/cancel`,

  subscriptionPlans: (organizationId) =>
    `${url}organizations/${organizationId}/subscription-plans`,

  getThreadMessageMetadata: (threadId, messageId) =>
    `${url}threads/${threadId}/message-metadata/${messageId}`,
  
  deactivateUserById: (userId) =>
    `${url}users/${userId}/deactivate`,

  deactivateOrganizationById: (organizationId) =>
    `${url}organizations/${organizationId}/deactivate`,

  deactivateProjectById: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/deactivate`,

  aiApiKeys: (organizationId) =>
    `${url}organizations/${organizationId}/api-keys`,

  deleteApiKey: (organizationId, apiKeyId) =>
    `${url}organizations/${organizationId}/api-keys/${apiKeyId}`,

  updateApiKey: (organizationId, apiKeyId) =>
    `${url}organizations/${organizationId}/api-keys/${apiKeyId}`,

  organizationWebSite: (organizationId) =>
    `${url}organizations/${organizationId}/websites`,

  updateOrganizationWebSite: (organizationId, organizationWebSiteId) =>
    `${url}organizations/${organizationId}/websites/${organizationWebSiteId}`,

  deleteOrganizationWebSite: (organizationId, organizationWebSiteId) =>
    `${url}organizations/${organizationId}/websites/${organizationWebSiteId}`,

  userLogout: () => `${url}users/logout`


};
