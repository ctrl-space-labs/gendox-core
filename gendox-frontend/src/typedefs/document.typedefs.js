/**
 * @typedef {Object} Document
 * @property {string} id - The document's ID.
 * @property {string} organizationId - The organization ID associated with the document.
 * @property {string} remoteUrl -  The web address where the document is stored.
 * @property {string} createdAt - The creation date of the document.
 * @property {string} updatedAt - The last update date of the document.
 * @property {string} createdBy - The ID of the user who created the document.
 * @property {string} updatedBy - The ID of the user who last updated the document.
 * @property {DocumentInstanceSection} documentInstanceSection - The sections associated with the document.
 * @property {string} documentTemplateId - The template ID associated with the document.
 */

/**
 * @typedef {Object} DocumentInstanceSection
 * @property {string} createdAt - The creation date of the document instance section.
 * @property {string|null} createdBy - The ID of the user who created the document instance section.
 * @property {DocumentSectionMetadata} documentSectionMetadata - The metadata of the document section.
 * @property {string} id - The ID of the document instance section.
 * @property {boolean} moderationFlagged - Indicates if the section is flagged for moderation.
 * @property {string} sectionValue - The content value of the document section.
 * @property {string} updatedAt - The last update date of the document instance section.
 * @property {string|null} updatedBy - The ID of the user who last updated the document instance section.
 */

/**
 * @typedef {Object} DocumentSectionMetadata
 * @property {string} createdAt - The creation date of the document section metadata.
 * @property {string|null} createdBy - The ID of the user who created the document section metadata.
 * @property {string|null} description - The description of the document section.
 * @property {number} documentSectionTypeId - The ID for the type of the document section.
 * @property {string|null} documentTemplateId - The ID of the document template associated with this section.
 * @property {string} id - The ID of the document section metadata.
 * @property {string|null} sectionOptions - The options for the section, if any.
 * @property {number} sectionOrder - The order of the section within the document.
 * @property {string} title - The title of the document section.
 * @property {string} updatedAt - The last update date of the document section metadata.
 * @property {string|null} updatedBy - The ID of the user who last updated the document section metadata.
 */


