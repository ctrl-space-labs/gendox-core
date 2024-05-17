const config = require('../../tests.config');
const fs = require('fs');
//npm install form-data
const FormData = require('form-data');

const uploadDocuments = async (request, token, uploadParams) => {
const formData = new FormData();
   console.log(uploadParams);
   formData.append('projectId', uploadParams.projectId);
    formData.append('organizationId', uploadParams.organizationId);
    formData.append('file', fs.createReadStream(uploadParams.file));

// projectId, organizationId, file
    const response = await request.post(`${config.gendox.contextPath}/documents/upload`, formData, {
        headers: {
//             ...formData.getHeaders(),
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'multipart/form-data; boundary=' + formData.getBoundary()
//            'Content-Type':'multipart/form-data'

}
    });
    return response;
}

const splitDocumentSections = async (request, token, criteria) => {
    let params = new URLSearchParams(criteria).toString();// Pass projectId as an object

    const response = await request.post(`${config.gendox.contextPath}/documents/split?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });

    return response;
}

const createDocumentInstance = async (request, token, documentInstanceData ) => {

    const response = await request.post(`${config.gendox.contextPath}/documents`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: documentInstanceData
    });
    return response;
}


const updateDocumentInstance = async (request, token, documentInstanceData, documentInstanceId ) => {

    const response = await request.put(`${config.gendox.contextPath}/documents/${documentInstanceId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: organizationData
    });
    return response;
}


const deleteDocumentInstance = async (request, token, documentInstanceId ) => {

    const response = await request.delete(`${config.gendox.contextPath}/documents/${documentInstanceId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }

    });
    return response;
}

module.exports = {
    uploadDocuments,
    splitDocumentSections,
    createDocumentInstance,
    updateDocumentInstance,
    deleteDocumentInstance

}