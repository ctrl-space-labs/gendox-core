const config = require('../../tests.config');

const getOrganizationUsersByOrgId = async (request, token, organizationId) => {

    const response = await request.get(`${config.gendox.contextPath}/organizations/${organizationId}/users`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}


module.exports = {
    getOrganizationUsersByOrgId
}