import { useEffect, useState } from 'react'
import artifactService from 'src/gendox-sdk/artifactService'
import { getToken } from 'src/components/agent/useAgent'

/**
 * The artifacts others shared with the user in an organization, newest share first (gendox-core#523); searching
 * waits for a pause in typing. Loads only while `enabled`, so a page loads it when its tab opens.
 * @param projectId - one agent's only; every agent's when absent
 * @param kind - html | svg | markdown | code, or '' for every kind
 * @returns {{ shares, total, failed }} `shares` is null while it loads
 */
const useSharedWithMe = ({ organizationId, projectId, search = '', kind = '', enabled = true, size = 50 }) => {
  const [result, setResult] = useState({ shares: null, total: 0, failed: false })

  useEffect(() => {
    if (!enabled || !organizationId) return
    let current = true
    const timer = setTimeout(
      () =>
        artifactService
          .getSharedWithMe(organizationId, { projectId, search: search.trim() || undefined, artifactType: kind ? kind.toUpperCase() : undefined }, getToken(), 0, size)
          .then(response => {
            if (current) setResult({ shares: response.data?.content ?? [], total: response.data?.totalElements ?? 0, failed: false })
          })
          .catch(() => current && setResult({ shares: [], total: 0, failed: true })),
      search ? 250 : 0
    )

    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [enabled, organizationId, projectId, search, kind, size])

  // another scope's list is not shown while this one's loads
  useEffect(() => {
    setResult({ shares: null, total: 0, failed: false })
  }, [organizationId, projectId])

  return result
}

export default useSharedWithMe
