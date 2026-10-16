import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'

/**
 * Returns whether the signed-in user has at least one authority in `roles` for the
 * effective organization id: `organizationId` prop, else `router.query.organizationId`,
 * else `localStorage` selected org.
 *
 * @param {{ organizationId?: string, roles: string[] }} params
 * @returns {boolean} `true` if `roles` is empty (no gate); otherwise match against `user.organizations[].authorities`.
 */
export default function useHasOrgRole({ organizationId, roles }) {
  const router = useRouter()
  const { user } = useAuth()

  return useMemo(() => {
    const roleList = Array.isArray(roles) ? roles : []
    if (roleList.length === 0) return true

    const organizations = Array.isArray(user?.organizations) ? user.organizations : []
    if (organizations.length === 0) return false

    const orgIdFromQuery = router.query?.organizationId
    const orgIdFromStorage =
      typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.selectedOrganizationId) : null

    const effectiveOrgId = organizationId || orgIdFromQuery || orgIdFromStorage
    if (!effectiveOrgId) return false

    const org = organizations.find(o => o?.id === effectiveOrgId)
    const authorities = Array.isArray(org?.authorities) ? org.authorities : []

    return roleList.some(r => authorities.includes(r))
  }, [organizationId, roles, router.query?.organizationId, user?.organizations])
}

