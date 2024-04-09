/**
 * @typedef {Object} GendoxUserProfile
 * @property {string} id - The user's ID.
 * @property {string} email - The user's email.
 * @property {string|null} firstName - The user's first name.
 * @property {string|null} lastName - The user's last name.
 * @property {string|null} userName - The user's username.
 * @property {string|null} phone - The user's phone number.
 * @property {string} userTypeId - The user's type ID.
 * @property {string} name - The user's name.
 * @property {Array<UserProfileOrganization>} organizations - The user's organizations.
 * @property {string} role - The user's role.
 */


/**
 * @typedef {Object} UserProfileOrganization
 * @property {string} id - The organization's ID.
 * @property {string} name - The organization's name.
 * @property {string} displayName - The organization's display name.
 * @property {string} phone - The organization's phone number.
 * @property {string} address - The organization's address.
 * @property {Array<string>} authorities - The organization's authorities.
 * @property {Array<UserProfileProject>} projects - The organization's projects.
 * @property {string|null} createdAt - The creation date of the organization.
 * @property {string|null} updatedAt - The last update date of the organization.
 */

/**
 * @typedef {Object} UserProfileProject
 * @property {string} id - The project's ID.
 * @property {string} name - The project's name.
 * @property {string} description - The project's description.
 * @property {string} createdAt - The creation date of the project.
 * @property {string} updatedAt - The last update date of the project.
 */

