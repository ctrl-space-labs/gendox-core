const config = require('../../tests.config');


const uploadDocument = async (request, token, uploadParams) => {

// projectId, organizationId, filePath
    const response = await request.post(`${config.gendox.contextPath}/documents/upload`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: uploadParams
    });
    return response;
}

module.exports = {
    uploadDocument
}