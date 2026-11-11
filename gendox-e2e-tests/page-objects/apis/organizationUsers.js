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

/**
 * Adds an existing user to an organization.
 *
 * @param {string} roleName - ROLE_ADMIN, ROLE_EDITOR or ROLE_READER.
 */
const addOrganizationUser = async (request, token, organizationId, userId, roleName) => {

    const response = await request.post(`${config.gendox.contextPath}/organizations/${organizationId}/users`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: {
            user: { id: userId },
            organization: { id: organizationId },
            role: { name: roleName }
        }
    });
    return response;
}


module.exports = {
    getOrganizationUsersByOrgId,
    addOrganizationUser
}
