

const getOrganizationUsersByOrgId = async (request, token, organizationId) => {

    const response = await request.get(`https://gendox.ctrlspace.dev/gendox/api/v1/organizations/${organizationId}/users`, {
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