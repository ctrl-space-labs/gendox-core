/**
 * @typedef {Object} AIModel
 * @property {string} id - The AI model's ID.
 * @property {string} model - The AI model's model.
 * @property {string} url - The AI model's URL.
 * @property {string} name - The AI model's name.
 * @property {number} price - The AI model's price.
 * @property {string|null} createdAt - The creation date of the AI model.
 * @property {string|null} updatedAt - The last update date of the AI model.
 * @property {string} description - The AI model's description.
 */

/**
 * @typedef {Object} ProjectAgent
 * @property {string} id - The project agent's ID.
 * @property {string} userId - The user ID associated with the project agent.
 * @property {AIModel} semanticSearchModel - The semantic search model of the project agent.
 * @property {AIModel} completionModel - The completion model of the project agent.
 * @property {string} agentName - The name of the project agent.
 * @property {string|null} agentBehavior - The behavior of the project agent.
 * @property {boolean|null} privateAgent - Indicates if the agent is private.
 * @property {string|null} createdAt - The creation date of the project agent.
 * @property {string} updatedAt - The last update date of the project agent.
 * @property {string} createdBy - The ID of the user who created the project agent.
 * @property {string} updatedBy - The ID of the user who last updated the project agent.
 * @property {GendoxType} documentSplitterType - The document splitter type of the project agent.
 * @property {string} chatTemplateId - The chat template ID of the project agent.
 * @property {string} sectionTemplateId - The section template ID of the project agent.
 * @property {number} maxToken - The maximum token of the project agent.
 * @property {number} temperature - The temperature of the project agent.
 * @property {number} topP - The top P of the project agent.
 */

/**
 * @typedef {Object} Project
 * @property {string} id - The project's ID.
 * @property {string} organizationId - The organization ID associated with the project.
 * @property {string} name - The project's name.
 * @property {string} description - The project's description.
 * @property {string} createdAt - The creation date of the project.
 * @property {string} updatedAt - The last update date of the project.
 * @property {string} createdBy - The ID of the user who created the project.
 * @property {string} updatedBy - The ID of the user who last updated the project.
 * @property {ProjectAgent} projectAgent - The project agent associated with the project.
 * @property {boolean} autoTraining - Indicates if auto training is enabled for the project.
 */

/**
 * @typedef {Object} GendoxType
 * @property {number} id - The document splitter type's ID.
 * @property {string} typeCategory - The category of the document splitter type.
 * @property {string} name - The name of the document splitter type.
 * @property {string} description - The description of the document splitter type.
 */