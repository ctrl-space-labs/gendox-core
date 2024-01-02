const config = require('../../tests.config');

const getProjectById = async (request, token, projectId) => {


    const response = await request.get(`${config.gendox.contextPath}/projects/${projectId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

/**
 * Get Projects by criteria.
 *
 * @async
 * @function
 * @param {Request} request - The Playwright request object.
 * @param {string} token - A string token for authentication or other purposes.
 * @param {Object} criteria - An object containing the criteria for the operation.
 * @param {string[]} criteria.projectIdIn - A list of project identifiers.
 * @param {string} criteria.organizationId - The organization identifier that all projects belong to.
 * @param {string} criteria.name - The name of the project.
 * @param {string} criteria.userId - The user identifier that created projects.
 * @returns {Promise<[Response]>} Description of the return value.
 */
const getProjectByCriteria = async (request, token, criteria) => {

        let params = new URLSearchParams(criteria).toString();

        //add criteria (if any) as requests param key-value pairs
        const response = await request.get(`${config.gendox.contextPath}/projects?${params}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
       const responseBody =  JSON.parse(await response.text())
        return response;


}




module.exports = {
    getProjectById,
    getProjectByCriteria
}