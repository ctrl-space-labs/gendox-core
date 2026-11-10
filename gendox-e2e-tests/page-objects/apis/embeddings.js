const config = require('../../tests.config');


const semanticSearch = async (request, token, message, criteria) => {

    let params = new URLSearchParams(criteria).toString();

    const response = await request.post(`${config.gendox.contextPath}/messages/search?${params}`, {
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

    const response = await request.post(`${config.gendox.contextPath}/messages/completions?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: message
    });
    return response;
}


module.exports = {
    semanticSearch,
    semanticCompletion
}
