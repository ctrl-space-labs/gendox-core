// const url = 'http://localhost:5000/gendox/api/v1/'  // Local Environment
//const url= 'https://gendox.ctrlspace.dev/gendox/api/v1/' // Production Environment (AWS)
const url= 'http://localhost:8080/gendox/api/v1/' // Development Environment (Hetzner)

export default {
    getProfile: url + 'profile',

    getProjectById: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,
    getProjectsByOrganization: (organizationId) => `${url}organizations/${organizationId}/projects`,

    getDocumentsByProject: (organizationId, projectId) =>
        `${url}organizations/${organizationId}/projects/${projectId}/documents`,

    getUsersInOrganizationByOrgId: (organizationId, projectId) => `${url}organizations/${organizationId}/users`,

    getAllProjectMembers: (organizationId, projectId) =>
        `${url}organizations/${organizationId}/projects/${projectId}/users`,

    updateProject: (organizationId, projectId) => `${url}organizations/${organizationId}/projects/${projectId}`,

    getThreadsByCriteria: (projectIdIn) => {
        const projectIds = projectIdIn.join(',');
        return `${url}threads?projectIdIn=${projectIds}`;
    },

    getThreadMessagesByCriteria: (threadId, page = 0, size = 10, sort = 'createdAt,desc') =>
        `${url}threads/${threadId}/messages?page=${page}&size=${size}&sort=${sort}`,
}
