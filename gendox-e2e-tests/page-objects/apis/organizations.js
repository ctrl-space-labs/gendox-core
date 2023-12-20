
const getOrganizationById = async (request, token, organizationId) => {

    const response = await request.get(`/organizations/${organizationId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

const getOrganizationByCriteria = async (request, token, criteria) => {

    let params = new URLSearchParams(criteria).toString();
    //add criteria (if any) as requests param key-value pairs
    const response = await request.get(`/organizations?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });

    return response;

}


module.exports = {
    getOrganizationById,
    getOrganizationByCriteria
}