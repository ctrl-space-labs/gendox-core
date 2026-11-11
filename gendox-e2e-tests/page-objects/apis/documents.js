const config = require('../../tests.config');
const fs = require('fs');
const path = require('path');

const documentsPath = (organizationId, projectId) =>
    `${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}/documents`;

const uploadDocument = async (request, token, organizationId, projectId, filePath) => {

    const response = await request.post(`${documentsPath(organizationId, projectId)}/upload`, {
        headers: {
            'Authorization': 'Bearer ' + token
        },
        multipart: {
            file: {
                name: path.basename(filePath),
                mimeType: 'text/plain',
                buffer: fs.readFileSync(filePath)
            }
        }
    });
    return response;
}

const getProjectDocuments = async (request, token, organizationId, projectId) => {

    const response = await request.get(documentsPath(organizationId, projectId), {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

const splitDocumentSections = async (request, token, organizationId, projectId) => {
    let params = new URLSearchParams({ projectId }).toString();

    const response = await request.post(`${documentsPath(organizationId, projectId)}/split?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });

    return response;
}

const createDocumentInstance = async (request, token, projectId, documentInstanceData ) => {

    const response = await request.post(documentsPath(documentInstanceData.organizationId, projectId), {
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
        data: documentInstanceData
    });
    return response;
}


const deleteDocumentInstance = async (request, token, organizationId, projectId, documentInstanceId ) => {

    const response = await request.delete(`${documentsPath(organizationId, projectId)}/${documentInstanceId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }

    });
    return response;
}

module.exports = {
    uploadDocument,
    getProjectDocuments,
    splitDocumentSections,
    createDocumentInstance,
    updateDocumentInstance,
    deleteDocumentInstance

}
