import { useEffect, useState } from 'react'
import organizationService from 'src/gendox-sdk/organizationService'
import { getToken } from 'src/components/agent/useAgent'

// one request per organization while the app is open
const cache = {}

/**
 * The organization's members ({ user, role }), for showing who did something: an organization admin who isn't
 * a member of the agent, say. Quiet: someone not allowed to list the members gets an empty list, not an error.
 */
const useOrganizationUsers = organizationId => {
  const [users, setUsers] = useState(() => cache[organizationId] ?? [])

  useEffect(() => {
    if (!organizationId) return
    if (cache[organizationId]) return setUsers(cache[organizationId])
    let current = true
    organizationService
      .getUsersInOrganizationByOrgId(organizationId, getToken())
      .then(response => {
        cache[organizationId] = response.data ?? []
        if (current) setUsers(cache[organizationId])
      })
      .catch(() => {})

    return () => {
      current = false
    }
  }, [organizationId])

  return users
}

export default useOrganizationUsers
