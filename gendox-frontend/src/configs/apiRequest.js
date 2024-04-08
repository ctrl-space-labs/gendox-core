// const url = 'http://localhost:5000/gendox/api/v1/'  // Local Environment
//const url= 'https://gendox.ctrlspace.dev/gendox/api/v1/' // Production Environment (AWS)
const url= 'https://dev.gendox.ctrlspace.dev/gendox/api/v1/' // Development Environment (Hetzner)


export default {
  getProfile: url + 'profile',

  getProjectById: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,

  getDocumentsByProject: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents`,

  getUsersInOrganizationByOrgId: (organizationId, projectId) => `${url}organizations/${organizationId}/users`,

  getAllProjectMembers: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users`,

  updateProject: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,

  documentSections:  (organizationId, projectId, documentId) =>
  `${url}organizations/${organizationId}/projects/${projectId}/documents/${documentId}/sections`,

  uploadDocument: (organizationId, projectId) =>
  `${url}organizations/${organizationId}/projects/${projectId}/documents/upload`,
}
