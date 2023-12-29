const config = require('../../tests.config');

const getUserById = async (request, token, userId) => {

    const response = await request.get(`${config.gendox.contextPath}/users/${userId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

const createUser = async (request, token, userData ) => {

    const response = await request.post(`${config.gendox.contextPath}/users`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: userData
    });
    return response;
}



module.exports = {
    getUserById,
    createUser
}