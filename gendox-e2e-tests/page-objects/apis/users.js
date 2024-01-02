const config = require('../../tests.config');

const getUsersbyCriteria = async (request, token, criteria) => {

        let params = new URLSearchParams(criteria).toString();

        //add criteria (if any) as requests param key-value pairs
        const response = await request.get(`${config.gendox.contextPath}/users?${params}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
       const responseBody =  JSON.parse(await response.text())
        return response;
}

const getUserById = async (request, token, userId) => {

    const response = await request.get(`${config.gendox.contextPath}/users/${userId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

const getUserProfileById = async (request, token, userId) => {
    const response = await request.get(`${config.gendox.contextPath}/profile/${userId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
};

const createUser = async (request, token, userData ) => {

    const response = await request.post(`${config.gendox.contextPath}/users`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: userData
    });
    return response;
}

const updateUser = async (request, token, userData, userId ) => {

    const response = await request.put(`${config.gendox.contextPath}/users/${userId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: userData
    });
    return response;
}

module.exports = {
    getUserById,
    createUser,
    updateUser,
    getUserProfileById,
    getUsersbyCriteria
}