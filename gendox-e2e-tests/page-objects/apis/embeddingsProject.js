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

const getSectionEmbedding = async (request, token, projectId, sectionId) => {

    let params = new URLSearchParams({ projectId }).toString();

    const response = await request.post(`${config.gendox.contextPath}/embeddings/sections/${sectionId}?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

module.exports =
{
    getProjectEmbeddings,
    getSectionEmbedding
}
