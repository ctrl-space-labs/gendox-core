const url = 'http://localhost:5000/gendox/api/v1/'

export default {
  getProfile: url + 'profile',

  getProjectById: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,

  getDocumentsByProject: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/documents`,

  getUsersInOrganizationByOrgId: (organizationId, projectId) => `${url}organizations/${organizationId}/users`,

  getAllProjectMembers: (organizationId, projectId) =>
    `${url}organizations/${organizationId}/projects/${projectId}/users`,

  updateProject: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`
}
