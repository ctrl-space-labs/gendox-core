const config = require('../../tests.config');

const getProjectById = async (request, token, projectId) => {


    const response = await request.get(`/projects/${projectId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}



module.exports = {
    getProjectById
}