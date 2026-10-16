// Organization roles, highest first: [title, what it allows]
export const ROLES = {
  ROLE_OWNER: ['Owner', 'Everything, including billing and deleting the organization.'],
  ROLE_ADMIN: ['Admin', 'Manages members, agents and settings.'],
  ROLE_EDITOR: ['Editor', 'Adds knowledge and changes agents.'],
  ROLE_READER: ['Reader', 'Chats with agents and reads their knowledge.']
}

// the roles someone may give, by their own role
const GRANTABLE = {
  ROLE_OWNER: ['ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_READER'],
  ROLE_ADMIN: ['ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_READER'],
  ROLE_EDITOR: ['ROLE_EDITOR', 'ROLE_READER'],
  ROLE_READER: ['ROLE_READER']
}

export const grantableRoles = role => GRANTABLE[role] ?? []

export const roleTitle = role => ROLES[role]?.[0] ?? 'Unknown'

// the user's own role in an organization, from the profile's authorities
export const roleInOrganization = organization =>
  Object.keys(ROLES).find(role => organization?.authorities?.includes(role)) ?? null
