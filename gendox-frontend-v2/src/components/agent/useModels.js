import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAiModels } from 'src/store/activeProjectAgent/activeProjectAgent'
import aiModelService from 'src/gendox-sdk/aiModelService'
import { sortModels } from 'src/utils/sortModels'
import { getToken } from 'src/components/agent/useAgent'

/**
 * The models an agent can use, by type (GET …/projects/{p}/ai-models), sorted by provider,
 * and the organization's provider keys (GET organizations/{o}/model-keys).
 */
const useModels = (organizationId, projectId) => {
  const dispatch = useDispatch()
  const { aiModels } = useSelector(state => state.activeProjectAgent)
  const [keys, setKeys] = useState([])

  useEffect(() => {
    if (!organizationId || !projectId) return
    const token = getToken()
    dispatch(fetchAiModels({ organizationId, projectId, token }))
    aiModelService
      .getModelKeysByOrganizationId(organizationId, token)
      .then(response => setKeys(response.data?.content ?? response.data ?? []))
      .catch(() => setKeys([]))
  }, [dispatch, organizationId, projectId])

  return {
    completion: sortModels(aiModels.completionModels),
    semantic: sortModels(aiModels.semanticModels),
    decision: sortModels(aiModels.decisionModels),
    moderation: sortModels(aiModels.moderationModels),
    rerank: sortModels(aiModels.rerankModels),
    keys
  }
}

export default useModels
