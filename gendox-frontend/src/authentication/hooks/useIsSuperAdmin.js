import { useAuth } from 'src/authentication/useAuth'

export const GENDOX_SUPER_ADMIN = 'GENDOX_SUPER_ADMIN'

/**
 * Whether the signed-in user is a Gendox super admin (a system administrator, not an organization
 * admin). The backend checks the same role (SecurityUtils.isSuperAdmin); this only hides the UI.
 *
 * @returns {boolean}
 */
export default function useIsSuperAdmin() {
  const { user } = useAuth()

  return user?.globalUserRoleType?.name === GENDOX_SUPER_ADMIN
}
