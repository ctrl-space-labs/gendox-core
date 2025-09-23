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

  const pollInterval = setInterval(async () => {
    try {
      const jobs = await checkJobStatus(organizationId, projectId, taskId, token)
      onTick?.(jobs)
      const isStillRunning = Array.isArray(jobs) && jobs.length > 0
      if (!isStillRunning) {
        clearInterval(pollInterval)
        onComplete?.()
      }
    } catch (err) {
      console.error('Error polling job completion:', err)
      clearInterval(pollInterval)
      onError?.(err)
    }
  }, intervalMs)

  return () => clearInterval(pollInterval)
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
    return { wasRunning: false, cleanup: () => {} }
  }

  // Notify the UI that we resumed a background job
  onResume?.(jobs)

  const cleanup = startJobCompletionPolling({
    organizationId,
    projectId,
    taskId,
    token,
    onTick,
    onComplete,
    onError,
    intervalMs
  })

  return { wasRunning: true, cleanup }
}
