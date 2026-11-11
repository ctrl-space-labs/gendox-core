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

const getUserProfile = async (request, token) => {
    const response = await request.get(`${config.gendox.contextPath}/profile`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
};

/**
 * Makes the API read the caller's profile, with its organizations and projects, again.
 */
const clearProfileCache = async (request, token) => {
    const response = await request.delete(`${config.gendox.contextPath}/profile/caches`, {
        headers: {
            'Authorization': 'Bearer ' + token
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
    getUserProfile,
    clearProfileCache,
    getUsersbyCriteria
}