const config = require('../../tests.config');


const getProjectMembers = async (request, token, projectId) => {

        const response = await request.get(`${config.gendox.contextPath}/projects/${projectId}/users`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
       const responseBody =  JSON.parse(await response.text())
        return response;

}

const addProjectMember = async (request, token, projectId, userId) => {

        const response = await request.post(`${config.gendox.contextPath}/projects/${projectId}/users/${userId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        return response;

}


const deleteProjectMember = async (request, token, projectId, userId) => {

        const response = await request.delete(`${config.gendox.contextPath}/projects/${projectId}/users/${userId}`, {
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