import axios from 'axios'
import { readEventStream } from './sseReader'
import apiRequests from 'src/configs/apiRequest'

const postCompletionMessage = async (projectId, threadId, message, localContexts, documentInstanceIds = [], token, deepThinking = false) => {
  let headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }

  return axios.post(
    apiRequests.postCompletionModel(projectId),
    {
      value: message,
      threadId: threadId,
      localContexts: localContexts,
      documentInstanceIds: documentInstanceIds,
      deepThinking: deepThinking
    },
    { headers }
  )
}

const headersFor = (token, resumeToken) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(resumeToken ? { 'X-Gendox-Completion-Token': resumeToken } : {})
})

const postChatMessage = async (projectId, payload, token, resumeToken, onEvent) => {
  const response = await fetch(apiRequests.postCompletionModel(projectId), {
    method: 'POST', headers: headersFor(token, resumeToken), body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || `Completion failed (${response.status})`)
    error.response = { status: response.status, data }
    throw error
  }
  if (!response.headers.get('content-type')?.includes('text/event-stream'))
    return { status: response.status, data: await response.json() }
  let result
  await readEventStream(response.body, async (event, data) => {
    await onEvent(event, data)
    if (event === 'done' || event === 'waiting_for_tools') result = data
    if (event === 'error') throw new Error(data.message || 'Completion failed')
  })
  if (!result) throw new Error('Connection interrupted; recovering saved messages')
  return { status: 200, data: result }
}

const getCompletionStatus = (threadId, token, resumeToken) =>
  axios.get(apiRequests.completionStatus(threadId), { headers: headersFor(token, resumeToken) })

export default {
  postCompletionMessage,
  postChatMessage,
  getCompletionStatus
}
