const users = require('./users');

// Parallel workspaces share seeded identities. A concurrent profile refresh can cache
// stale memberships between setup calls. Only use this for fixture construction;
// requests whose authorization is being tested must never be retried here.
const setupRequest = async (api, token, operation) => {
    let response;
    for (let attempt = 0; attempt < 5; attempt++) {
        response = await operation();
        if (response.status() !== 404) return response;
        await users.clearProfileCache(api, token);
    }
    return response;
};

module.exports = { setupRequest };
