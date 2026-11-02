import { Crown, Eye, Pencil, Shield, User } from 'lucide-react'

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

// each role's icon, as in the prototype
export const ROLE_ICONS = { ROLE_OWNER: Crown, ROLE_ADMIN: Shield, ROLE_EDITOR: Pencil, ROLE_READER: Eye }

/** A role with its icon, e.g. in a members table */
export const Role = ({ role }) => {
  const Icon = ROLE_ICONS[role] ?? User

  return (
    <span className='role'>
      <Icon className='lucide' />
      {roleTitle(role)}
    </span>
  )
}

// the user's own role in an organization, from the profile's authorities
export const roleInOrganization = organization =>
  Object.keys(ROLES).find(role => organization?.authorities?.includes(role)) ?? null
