const config = require('../../tests.config');


const getProjectMembers = async (request, token, organizationId, projectId) => {

        const response = await request.get(`${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}/users`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        return response;

}

const addProjectMember = async (request, token, organizationId, projectId, userId) => {

        const response = await request.post(`${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}/users/${userId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        return response;

}


const deleteProjectMember = async (request, token, organizationId, projectId, userId) => {

        const response = await request.delete(`${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}/users/${userId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        return response;

}
module.exports = {
    getProjectMembers,
    addProjectMember,
    deleteProjectMember
}
