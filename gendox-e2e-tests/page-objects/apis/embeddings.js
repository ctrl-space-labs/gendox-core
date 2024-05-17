const config = require('../../tests.config');



const getEmbeddings = async (request, token, botRequest, aiModel) => {

    let params = new URLSearchParams(aiModel).toString();

    const response = await request.post(`${config.gendox.contextPath}/embeddings?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: botRequest
    });
    return response;
}


const semanticSearch = async (request, token, message, criteria) => {

    let params = new URLSearchParams(criteria).toString();

    const response = await request.post(`${config.gendox.contextPath}/messages/semantic-search?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: message
    });
    return response;
}

const semanticCompletion = async (request, token, message, criteria) => {

    let params = new URLSearchParams(criteria).toString();

    const response = await request.post(`${config.gendox.contextPath}/messages/semantic-search?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: message
    });
    return response;
}


module.exports = {
    getEmbeddings,
    semanticSearch,
    semanticCompletion
}