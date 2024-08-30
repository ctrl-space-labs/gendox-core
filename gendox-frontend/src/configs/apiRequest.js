// const url = "http://localhost:5000/gendox/api/v1/"; // Local Environment
//const url= 'https://gendox-api.ctrlspace.dev/gendox/api/v1/' // Production Environment (AWS)
//  const url= 'http://localhost:8080/gendox/api/v1/' // Local Environment
//const url = 'https://dev.gendox.ctrlspace.dev/gendox/api/v1/' // Development Environment (Hetzner)
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

  getDocumentsByProject: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents`,

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

  documentSection: (documentId, sectionId) =>
    `${url}documents/${documentId}/sections/${sectionId}`,

  getDocumentById: (documentId) => `${url}documents/${documentId}`,

  uploadDocument: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents/upload`,

  triggerJobs: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/splitting/training`,

  getOrganizationById: (organizationId) =>
    `${url}organizations/${organizationId}`,

  addProjectMember: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/members`,

  deleteProjectMember: (organizationId, projectId, userId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users/${userId}`,

  inviteProjectMember: (organizationId) =>
    `${url}organizations/${organizationId}/invitations`,

  addOrganizationMember: (organizationId) =>
    `${url}organizations/${organizationId}/users`,

  getAiModelByCategory: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/ai-models/categories`,

  getAiModels: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/ai-models`,

  acceptInvitation: (email, token) =>
    `${url}invitations/acceptance?email=${email}&token=${token}`,



};
