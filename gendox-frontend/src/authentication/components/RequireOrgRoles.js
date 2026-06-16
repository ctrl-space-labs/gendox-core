import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'

/**
 * Renders `children` only when the signed-in user has at least one of `roles`
 * for the active organization (see {@link useHasOrgRole} for resolution order).
 *
 * @param {{ organizationId?: string, roles: string[], children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 * @returns {import('react').ReactNode}
 */
export default function RequireOrgRoles({ organizationId, roles, children, fallback = null }) {
  const allowed = useHasOrgRole({ organizationId, roles })

  if (!allowed) return fallback

  return children
}

