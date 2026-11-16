import { useEffect, useState } from 'react'
import artifactService from 'src/gendox-sdk/artifactService'
import { getToken } from 'src/components/agent/useAgent'

/**
 * The artifacts of the user's own conversations with one agent, newest change first (gendox-core#523); searching
 * waits for a pause in typing.
 * @param kind - html | svg | markdown | code, or '' for every kind
 * @returns {{ artifacts, total, failed }} `artifacts` is null while it loads
 */
const useProjectArtifacts = ({ organizationId, projectId, search = '', kind = '', size = 50 }) => {
  const [result, setResult] = useState({ artifacts: null, total: 0, failed: false })

  useEffect(() => {
    if (!organizationId || !projectId) return
    let current = true
    const criteria = { search: search.trim() || undefined, artifactType: kind ? kind.toUpperCase() : undefined }
    const timer = setTimeout(
      () =>
        artifactService
          .getProjectArtifacts(organizationId, projectId, criteria, getToken(), 0, size)
          .then(response => {
            if (current) setResult({ artifacts: response.data?.content ?? [], total: response.data?.totalElements ?? 0, failed: false })
          })
          .catch(() => current && setResult({ artifacts: [], total: 0, failed: true })),
      search ? 250 : 0
    )

    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [organizationId, projectId, search, kind, size])

  // another agent's list is not shown while this one's loads
  useEffect(() => {
    setResult({ artifacts: null, total: 0, failed: false })
  }, [projectId])

  return result
}

export default useProjectArtifacts
