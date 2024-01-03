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


const createOrganization = async (request, token, organizationData ) => {

    const response = await request.post(`${config.gendox.contextPath}/organizations`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: organizationData
    });
    return response;
}


const updateOrganization = async (request, token, organizationData, organizationId ) => {

    const response = await request.put(`${config.gendox.contextPath}/organizations/${organizationId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: organizationData
    });
    return response;
}


const deleteOrganization = async (request, token, organizationId ) => {

    const response = await request.delete(`${config.gendox.contextPath}/organizations/${organizationId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }

    });
    return response;
}

module.exports = {
    getOrganizationById,
    getOrganizationByCriteria,
    createOrganization,
    updateOrganization,
    deleteOrganization
}