import { useEffect, useCallback, useRef } from 'react'
import taskService from 'src/gendox-sdk/taskService'
import { useGeneration as useGenerationContext } from './GenerationContext'
import { toast } from 'react-hot-toast'

export const useActiveJobMonitor = ({ organizationId, projectId, taskId, token, reloadAll }) => {
  const { startGeneration, completeGeneration } = useGenerationContext()

  const timerRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    // If polling is already in progress, do not start a new one
    if (timerRef.current) return

    const executePoll = async () => {
      try {
        const criteria = {
          status: 'STARTED',
          matchAllParams: [
            { paramName: 'projectId', paramValue: projectId },
            { paramName: 'taskId', paramValue: taskId }
          ]
        }

        const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)
        const isStillRunning = response.data?.content?.length > 0

        if (!isStillRunning) {
          // CASE: completed
          completeGeneration(taskId, null)
          reloadAll()

          // Clear the ref and DO NOT call setTimeout again. The loop ends here.
          timerRef.current = null
        } else {
          // CASE: still running
          // Schedule the next check after the current request completes
          timerRef.current = setTimeout(executePoll, 3000)
        }
      } catch (error) {
        console.error('Error polling job completion:', error)
        // In case of error, stop to avoid spamming the server
        stopPolling()
      }
    }
    // Start the first execution
    executePoll()
  }, [organizationId, projectId, taskId, token, completeGeneration, reloadAll, stopPolling])

  const checkAndResumeJobs = useCallback(async () => {
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
      const isRunning = response.data?.content?.length > 0

      if (isRunning) {
        // Start generation tracking for running job (UI state only)
        startGeneration(taskId, null, 'resumed', {
          documentNames: 'Background processing...',
          totalDocuments: 0
        })

        // Start polling to detect when the job completes
        startPolling()
      }
    } catch (error) {
      console.error('Failed to check running jobs:', error)
    }
  }, [organizationId, projectId, taskId, token, startGeneration])

  // Effects
  useEffect(() => {
    checkAndResumeJobs()

    // Cleanup on unmount
    return () => stopPolling()
  }, [checkAndResumeJobs])

  return {
    isMonitoring: !!timerRef.current
  }
}
