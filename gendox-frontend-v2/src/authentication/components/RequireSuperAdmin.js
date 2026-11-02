import useIsSuperAdmin from 'src/authentication/hooks/useIsSuperAdmin'

/**
 * Renders `children` only for Gendox super admins (see {@link useIsSuperAdmin}).
 *
 * @param {{ children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 * @returns {import('react').ReactNode}
 */
export default function RequireSuperAdmin({ children, fallback = null }) {
  return useIsSuperAdmin() ? children : fallback
}
