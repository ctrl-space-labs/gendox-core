import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'
import taskService from 'src/gendox-sdk/taskService'
import { useGeneration } from './GenerationContext'

/**
 * Custom hook to detect and handle running jobs when a task page loads.
 * This helps restore the GlobalGenerationStatus when users refresh the page
 * or navigate back to a task that has running background jobs.
 */
export const useRunningJobsDetection = ({
  organizationId,
  projectId,
  taskId,
  token,
  refreshDataFunctions = []
}) => {
  const { startGeneration, completeGeneration } = useGeneration()
  const [pollCleanup, setPollCleanup] = useState(null)

  // Check for running jobs when task loads (for UI state only, not to block operations)
  const checkRunningJobs = useCallback(async () => {
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
        const cleanup = startJobCompletionPolling()
        setPollCleanup(() => cleanup)
      }
    } catch (error) {
      console.error('Failed to check running jobs:', error)
    }
  }, [organizationId, projectId, taskId, token, startGeneration])

  // Poll for job completion when we detect an existing running job after page refresh
  const startJobCompletionPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
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
          // Job has completed, mark as completed in context
          completeGeneration(taskId, null)
          clearInterval(pollInterval)

          // Refresh data to show results - call all provided refresh functions
          try {
            await Promise.all(
              refreshDataFunctions.map(refreshFn => 
                refreshFn().unwrap ? refreshFn().unwrap() : refreshFn()
              )
            )
          } catch (error) {
            console.error('Failed to refresh data after polling:', error)
          }

          toast.success('Generation completed successfully!')
        }
      } catch (error) {
        console.error('Error polling job completion:', error)
        // Stop polling on error
        clearInterval(pollInterval)
      }
    }, 3000) // Poll every 3 seconds

    // Clean up interval on unmount or task change
    return () => {
      clearInterval(pollInterval)
    }
  }, [organizationId, projectId, taskId, token, completeGeneration, refreshDataFunctions])

  // Cleanup function for polling
  const cleanupPolling = useCallback(() => {
    if (pollCleanup) {
      pollCleanup()
      setPollCleanup(null)
    }
  }, [pollCleanup])

  return {
    checkRunningJobs,
    cleanupPolling,
    pollCleanup
  }
}

export default useRunningJobsDetection