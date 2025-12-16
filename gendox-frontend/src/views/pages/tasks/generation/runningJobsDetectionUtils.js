import taskService from 'src/gendox-sdk/taskService'

export const checkJobStatus = async (organizationId, projectId, taskId, token) => {
  if (!organizationId || !projectId || !taskId || !token) return

  try {
    const criteria = {
      status: 'STARTED',
      matchAllParams: [
        { paramName: 'projectId', paramValue: projectId },
        { paramName: 'taskId', paramValue: taskId }
      ]
    }

    const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)
    return response.data?.content || []
  } catch (error) {
    console.error('Failed to check job status:', error)
    return []
  }
}

export const startJobCompletionPolling = ({
  organizationId,
  projectId,
  taskId,
  token,
  onTick,
  onComplete,
  onError,
  intervalMs = 3000
}) => {
  if (!organizationId || !projectId || !taskId || !token) {
    // no-op cleanup
    return () => {}
  }

  let stopped = false

  async function tick() {
    // const pollInterval = setInterval(async () => {
    try {
      const jobs = await checkJobStatus(organizationId, projectId, taskId, token)
      onTick?.(jobs)


      const isStillRunning = Array.isArray(jobs) && jobs.length > 0
      if (!isStillRunning) {
        onComplete?.()
      }
      if (!stopped) {
        setTimeout(tick, intervalMs)
      }
    } catch (err) {
      console.error('Error polling job completion:', err)
      onError?.(err)
    }
  }

  tick()

  return () => {
    stopped = true
  }
}


export const checkAndResumeRunningJob = async ({
  organizationId,
  projectId,
  taskId,
  token,
  onResume,
  onTick,
  onComplete,
  onError,
  intervalMs
}) => {
  const jobs = await checkJobStatus(organizationId, projectId, taskId, token)
  const wasRunning = Array.isArray(jobs) && jobs.length > 0

  if (!wasRunning) {
    return { wasRunning: false, stopPolling: () => {} }
  }

  // Notify the UI that we resumed a background job
  onResume?.(jobs)

  const stopPolling = startJobCompletionPolling({
    organizationId,
    projectId,
    taskId,
    token,
    onTick,
    onComplete,
    onError,
    intervalMs
  })

  return { wasRunning: true, stopPolling }
}
