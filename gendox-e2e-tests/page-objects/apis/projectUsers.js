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

module.exports = {
    getProjectMembers
}