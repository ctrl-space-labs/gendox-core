
/**
 * Checks if the given ID is a valid UUID.
 * @param {string} id - The ID to validate.
 * @returns {boolean}
 */
export const isValidUUID = id => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validates that the organizationId is present, not 'null', is a valid UUID,
 * and exists in the authenticated user's organizations.
 *
 * @param {string} orgId - The organization ID to validate.
 * @param {object} user - The current authenticated user object.
 * @returns {boolean}
 */
export const isValidOrganization = (orgId, user) => {
  if (!orgId || orgId === 'null') return false
  if (!isValidUUID(orgId)) return false
  if (!user || !user.organizations || user.organizations.length === 0) return false
  return Boolean(user.organizations.find(o => o.id === orgId))
}

/**
 * Validates that both the organizationId and projectId are present, not 'null',
 * are valid UUIDs, that the organization exists in the user's organizations,
 * and that the project exists within that organization.
 *
 * @param {string} orgId - The organization ID to validate.
 * @param {string} projectId - The project ID to validate.
 * @param {object} user - The current authenticated user object.
 * @returns {boolean} - Returns true if both are valid and found, otherwise false.
 */
export const isValidOrganizationAndProject = (orgId, projectId, user) => {

  // Check if both IDs are present and not the string "null"
  if (!orgId || orgId === 'null' || !projectId || projectId === 'null') {
    return false;
  }

  // Check if both IDs are valid UUIDs
  if (!isValidUUID(orgId) || !isValidUUID(projectId)) {
    return false;
  }

  // Validate that the user exists and has organizations
  if (!user || !user.organizations || user.organizations.length === 0) {
    return false;
  }

  // Find the organization from the user's organizations
  const organization = user.organizations.find(o => o.id === orgId);
  if (!organization) return false;

  // Validate that the organization has projects and that the project exists within it
  if (!organization.projects || organization.projects.length === 0) {
    return false;
  }

  return Boolean(organization.projects.find(p => p.id === projectId));
};