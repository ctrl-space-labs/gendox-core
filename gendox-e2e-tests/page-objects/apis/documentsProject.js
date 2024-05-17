const config = require('../../tests.config');


const getProjectDocumentSections = async (request, token,  projectId) => {

    const response = await request.get(`${config.gendox.contextPath}/documents/sections/projects/${projectId}`, {
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