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
             ...formData.getHeaders(),
            'Authorization': 'Bearer ' + token
//            'Content-Type':'multipart/form-data'

}
    });
    return response;
}

module.exports = {
    uploadDocuments
}