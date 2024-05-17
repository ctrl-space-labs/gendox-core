const config = require('../../tests.config');


const getProjectEmbeddings = async (request, token,  projectId) => {

    const response = await request.post(`${config.gendox.contextPath}/embeddings/projects/${projectId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

module.exports =
{
    getProjectEmbeddings
}