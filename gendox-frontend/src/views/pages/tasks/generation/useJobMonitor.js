import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import taskService from 'src/gendox-sdk/taskService'
import { useGeneration as useGenerationContext } from 'src/views/pages/tasks/generation/GenerationContext'
import { 
  setInsightsGeneratingAll,
  setDigitizationGenerating,
  clearInsightsGenerationState,
  clearDigitizationGenerationState
} from 'src/store/activeTask/activeTask'

export const useJobMonitor = ({ organizationId, projectId, token, reloadAll }) => {
  const dispatch = useDispatch()
  const { startGenerationMonitor, completeGeneration, failGeneration } = useGenerationContext()

  const timerRef = useRef(null)
  const activeModeRef = useRef(null) // 'criteria' | 'jobExecutionId'
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    activeModeRef.current = null
  }, [])

  const sleep = ms => new Promise(res => setTimeout(res, ms))

  const pollJobExecution = useCallback(
    async (jobExecutionId, { timeout = 14400000 } = {}) => {
      if (!organizationId || !projectId || !token) return

      // Set active mode
      stop()
      activeModeRef.current = 'jobExecutionId'

      const startTime = Date.now()

      try{

      while (activeModeRef.current === 'jobExecutionId') {
        const elapsed = Date.now() - startTime

        if (elapsed > timeout) {
          setShowTimeoutDialog(true)
          dispatch(clearInsightsGenerationState())
          dispatch(clearDigitizationGenerationState())
          // stop()
          // throw new Error('Job polling timed out')
        }

        let currentInterval
        if (elapsed < 60000) currentInterval = 2000
        // first minute
        else if (elapsed < 600000) currentInterval = 5000
        // first 10 minutes
        else currentInterval = 10000 // after 10 minutes

        await sleep(currentInterval)

        const criteria = { jobExecutionIdsIn: [jobExecutionId] }
        const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)

        let status = response.data?.content?.[0]?.status
        if (typeof status === 'string') status = status.trim().toUpperCase()

        if (status === 'COMPLETED') {
          setShowTimeoutDialog(false)
          stop()
          dispatch(clearInsightsGenerationState())
          dispatch(clearDigitizationGenerationState())
          return status
        }

        if (['FAILED', 'STOPPED', 'ABANDONED'].includes(status)) {
          stop()
          dispatch(clearInsightsGenerationState())
          dispatch(clearDigitizationGenerationState())
          throw new Error(`Job ended with status: ${status}`)
        }
      }
      } catch (error) {
        stop()
        throw error
      }
    },
    [organizationId, projectId, token, stop]
  )

  /**
   * Poll for jobs matching criteria until none are found
   * (used for "criteria" mode monitoring)
   * without jobExecutionId
   */
  const startCriteriaPolling = useCallback(
    ({ taskId }) => {
      if (!organizationId || !projectId || !taskId || !token) return
      if (timerRef.current) return

      activeModeRef.current = 'criteria'

      const executePoll = async () => {
        try {
          // if mode changed, exit
          if (activeModeRef.current !== 'criteria') return

          const criteria = {
            status: 'STARTED',
            matchAllParams: [
              { paramName: 'projectId', paramValue: projectId },
              { paramName: 'taskId', paramValue: taskId }
            ]
          }

          const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)
          const isStillRunning = (response.data?.content?.length || 0) > 0

          if (!isStillRunning) {
            // completed
            completeGeneration(taskId, null)
            dispatch(clearInsightsGenerationState())
            dispatch(clearDigitizationGenerationState())
            reloadAll?.()
            stop()
            return
          }

          timerRef.current = setTimeout(executePoll, 3000)
        } catch (error) {
          console.error('Error polling job completion:', error)
          stop()
        }
      }

      executePoll()
    },
    [organizationId, projectId, token, reloadAll, completeGeneration, stop]
  )

  /**
   * Resume STARTED jobs on component mount
   */
  const resumeStartedJobs = useCallback(
    async ({ taskId }) => {
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
        const isRunning = (response.data?.content?.length || 0) > 0

        if (isRunning) {
          dispatch(setInsightsGeneratingAll(true))
          dispatch(setDigitizationGenerating(true))
          
          // Resume monitoring
          startGenerationMonitor(taskId, null, 'resumed', {
            documentNames: 'Background processing...',
            totalDocuments: 0
          })

          startCriteriaPolling({ taskId })
        }
      } catch (error) {
        console.error('Failed to check running jobs:', error)
        dispatch(clearInsightsGenerationState())
        dispatch(clearDigitizationGenerationState())
      }
    },
    [organizationId, projectId, token, startGenerationMonitor, startCriteriaPolling]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => stop()
  }, [stop])

  return {
    resumeStartedJobs, // for table
    pollJobExecution, // for generate flow
    showTimeoutDialog,
    setShowTimeoutDialog
  }
}
