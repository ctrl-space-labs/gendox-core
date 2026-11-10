const config = require('../../tests.config');


const getProjectDocumentSections = async (request, token,  projectId) => {

    const response = await request.get(`${config.gendox.contextPath}/projects/${projectId}/documents/sections`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}




module.exports =
{
    getProjectDocumentSections
}
