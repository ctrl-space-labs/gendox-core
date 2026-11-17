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
 * Creates a project whose agent uses the given models: by default the mock models, so the
 * tests need no provider key and cost nothing. config/models.js lists the others.
 *
 * @param {Function} [afterCreate] - Called with the new project's id before its agent is changed.
 * @param {{completion: string, embedding: string}} [profile] - `model` names from the catalog.
 * @returns {Promise<string>} The id of the new project.
 */
const createProjectWithModels = async (request, token, organizationId, name, afterCreate, profile = require('../../config/models').mock) => {

    const setupRequest = operation => require('./fixtureSetup').setupRequest(request, token, operation);
    const created = await setupRequest(() => createProject(request, token, { organizationId, name, description: 'Created by the tests' }));
    if (!created.ok()) {
        throw new Error(`Creating project failed: ${created.status()}`);
    }
    const project = await created.json();
    // The caller can wait here until the new project is visible to the user.
    if (afterCreate) await afterCreate(project.id);

    const available = await setupRequest(() => getAiModels(request, token, organizationId, project.id));
    if (!available.ok()) throw new Error(`Reading fixture models failed: ${available.status()} ${await available.text()}`);
    const models = await available.json();
    const pick = (name, kind) => {
        const model = models.find(candidate => candidate.model === name);
        if (!model) {
            const offered = models.filter(candidate => candidate.aiModelType?.name === kind).map(candidate => candidate.model);
            throw new Error(`This environment offers no ${kind} "${name}" to the project. It offers: ${offered.join(', ')}`);
        }
        return model;
    };
    project.projectAgent.semanticSearchModel = pick(profile.embedding, 'SEMANTIC_SEARCH_MODEL');
    project.projectAgent.completionModel = pick(profile.completion, 'COMPLETION_MODEL');

    const updated = await setupRequest(() => updateProject(request, token, project));
    if (!updated.ok()) {
        throw new Error(`Setting the models ${profile.completion} and ${profile.embedding} failed: ${updated.status()} ${(await updated.text()).slice(0, 300)}`);
    }
    return project.id;
}

const createProjectWithMockModels = (request, token, organizationId, name, afterCreate) =>
    createProjectWithModels(request, token, organizationId, name, afterCreate);


module.exports = {
    getProjectById,
    getProjectsByOrganization,
    updateProject,
    createProject,
    createProjectWithModels,
    createProjectWithMockModels,
    deactivateProject,
    getAiModels
}
