const config = require('../../tests.config');

const getOrganizationById = async (request, token, organizationId) => {

    const response = await request.get(`${config.gendox.contextPath}/organizations/${organizationId}`, {
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
    const response = await request.get(`${config.gendox.contextPath}/organizations?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });

    return response;

}


const createOrganization = async (request, token, orgData ) => {

    const response = await request.post(`${config.gendox.contextPath}/organizations`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: orgData
    });
    return response;
}


module.exports = {
    getOrganizationById,
    getOrganizationByCriteria,
    createOrganization
}