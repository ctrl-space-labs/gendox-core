const config = require('../../tests.config');

const getProjectById = async (request, token, organizationId, projectId) => {


    const response = await request.get(`${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

/**
 * Get the projects of an organization that the user is a member of.
 *
 * @async
 * @function
 * @param {Request} request - The Playwright request object.
 * @param {string} token - A string token for authentication or other purposes.
 * @param {string} organizationId - The organization identifier that all projects belong to.
 * @returns {Promise<[Response]>} Description of the return value.
 */
const getProjectsByOrganization = async (request, token, organizationId) => {

        const response = await request.get(`${config.gendox.contextPath}/organizations/${organizationId}/projects`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        return response;


}

const createProject = async (request, token, projectData ) => {

    const response = await request.post(`${config.gendox.contextPath}/organizations/${projectData.organizationId}/projects`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: projectData
    });
    return response;
}

const updateProject = async (request, token, projectData ) => {

    const response = await request.put(`${config.gendox.contextPath}/organizations/${projectData.organizationId}/projects/${projectData.id}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: projectData
    });
    return response;
}

const deactivateProject = async (request, token, organizationId, projectId ) => {

    const response = await request.put(`${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}/deactivate`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }

    });
    return response;
}

const getAiModels = async (request, token, organizationId, projectId) => {

    const response = await request.get(`${config.gendox.contextPath}/organizations/${organizationId}/projects/${projectId}/ai-models`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    return response;
}

/**
 * Creates a project whose agent uses the mock models, so the tests need no provider key and cost nothing.
 *
 * @param {Function} [afterCreate] - Called with the new project's id before its agent is changed.
 * @returns {Promise<string>} The id of the new project.
 */
const createProjectWithMockModels = async (request, token, organizationId, name, afterCreate) => {

    const created = await createProject(request, token, { organizationId, name, description: 'Created by the tests' });
    if (!created.ok()) {
        throw new Error(`Creating project failed: ${created.status()}`);
    }
    const project = await created.json();
    // The caller can wait here until the new project is visible to the user.
    if (afterCreate) await afterCreate(project.id);

    const models = await (await getAiModels(request, token, organizationId, project.id)).json();
    project.projectAgent.semanticSearchModel = models.find(model => model.model === 'mock-gemini-embedding');
    project.projectAgent.completionModel = models.find(model => model.model === 'mock-gemini-2.0-flash');

    const updated = await updateProject(request, token, project);
    if (!updated.ok()) {
        throw new Error(`Setting the mock models failed: ${updated.status()}`);
    }
    return project.id;
}


module.exports = {
    getProjectById,
    getProjectsByOrganization,
    updateProject,
    createProject,
    createProjectWithMockModels,
    deactivateProject,
    getAiModels
}
