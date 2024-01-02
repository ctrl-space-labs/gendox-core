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
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: userData
    });
    return response;
}

//const updateUser = async (request, token, userData, userId ) => {
//
//    const response = await request.put(`${config.gendox.contextPath}/users/${userId}`, {
//        headers: {
//            'Authorization': 'Bearer ' + token,
//            'Accept': 'application/json',
//            'Content-Type': 'application/json'
//        },
//        body: JSON.stringify(userData)
//    });
//    return response;
//}

module.exports = {
    getUserById,
    createUser
//    updateUser
}