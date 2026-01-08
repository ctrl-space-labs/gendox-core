import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import taskService from 'src/gendox-sdk/taskService'
import { useGeneration as useGenerationContext } from 'src/views/pages/tasks/generation/GenerationContext'
import {
  setInsightsGeneratingAll,
  setDigitizationGenerating,
  setInsightsGeneratingCells,
  clearInsightsGenerationState,
  clearDigitizationGenerationState
} from 'src/store/activeTask/activeTask'

export const useJobMonitor = ({ organizationId, projectId, token, reloadAll }) => {
  const dispatch = useDispatch()
  const { startGenerationMonitor, completeGeneration, failGeneration } = useGenerationContext()

  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList } = useSelector(
    state => state.activeTaskNode
  )

  const timerRef = useRef(null)
  const activeModeRef = useRef(null) // 'criteria' | 'jobExecutionId'
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)

  const documents = useMemo(() => taskNodesDocumentList?.content || [], [taskNodesDocumentList])
  const questions = useMemo(() => taskNodesQuestionList?.content || [], [taskNodesQuestionList])
  const answers = useMemo(() => taskNodesAnswerList?.content || [], [taskNodesAnswerList])

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

      try {
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

  // const resumeStartedJobs = useCallback(
  //   async ({ taskId }) => {
  //     if (!organizationId || !projectId || !taskId || !token) return

  //     try {
  //       const criteria = {
  //         status: 'STARTED',
  //         matchAllParams: [
  //           { paramName: 'projectId', paramValue: projectId },
  //           { paramName: 'taskId', paramValue: taskId }
  //         ]
  //       }

  //       const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)
  //       const jobs = response.data?.content || []
  //       const isRunning = jobs.length > 0

  //       if (isRunning) {
  //         // digitization
  //         dispatch(setDigitizationGenerating(true))

  //         // insights
  //         const latestJobParams = jobs[0].batchJobExecutionParams || []

  //         // find parameters
  //         const getParamValues = paramName => {
  //           const param = latestJobParams.find(p => p.parameterName === paramName)
  //           // if param not found or empty, return empty array
  //           if (!param || !param.parameterValue) return []
  //           try {
  //             return JSON.parse(param.parameterValue)
  //           } catch (e) {
  //             console.error(`Error parsing ${paramName}:`, e)
  //             return []
  //           }
  //         }

  //         const documentNodeIds = getParamValues('documentNodeIds')
  //         const questionNodeIds = getParamValues('questionNodeIds')

  //         // if both are empty, it's all or new generation
  //         if (documentNodeIds.length === 0 && questionNodeIds.length === 0) {
  //           // 1. Βρίσκουμε αν το job είναι Regenerate Existing (true) ή Generate New (false)
  //           const reGenerateParam = latestJobParams.find(p => p.parameterName === 'reGenerateExistingAnswers')
  //           const reGenerateExistingAnswers = reGenerateParam ? reGenerateParam.parameterValue === 'true' : false

  //           // 2. Φτιάχνουμε ένα Set με τις υπάρχουσες απαντήσεις για γρήγορο έλεγχο
  //           const existingAnswersMap = new Set()
  //           answers.forEach(ans => {
  //             if (ans.nodeValue?.nodeDocumentId && ans.nodeValue?.nodeQuestionId) {
  //               existingAnswersMap.add(`${ans.nodeValue.nodeDocumentId}_${ans.nodeValue.nodeQuestionId}`)
  //             }
  //           })

  //           const cellsLoading = {}

  //           // 3. Ελέγχουμε ΟΛΑ τα documents και questions (αφού είναι global generation)
  //           documents.forEach(doc => {
  //             questions.forEach(q => {
  //               const cellKey = `${doc.id}_${q.id}`
  //               const hasAnswer = existingAnswersMap.has(cellKey)

  //               // Λογική:
  //               // Αν είναι regenerate=true -> Φόρτωσε τα όλα.
  //               // Αν είναι regenerate=false -> Φόρτωσε ΜΟΝΟ αν ΔΕΝ υπάρχει απάντηση.
  //               if (reGenerateExistingAnswers || !hasAnswer) {
  //                 cellsLoading[cellKey] = true
  //               }
  //             })
  //           })

  //           dispatch(setInsightsGeneratingCells(cellsLoading))
  //         } else {
  //           const cellsLoading = {}

  //           if (questionNodeIds.length === 0) {
  //             documentNodeIds.forEach(docId => {
  //               cellsLoading[`${docId}_all`] = true
  //             })
  //           } else {
  //             documentNodeIds.forEach(docId => {
  //               questionNodeIds.forEach(qId => {
  //                 cellsLoading[`${docId}_${qId}`] = true
  //               })
  //             })
  //           }

  //           dispatch(setInsightsGeneratingCells(cellsLoading))
  //         }

  //         startGenerationMonitor(taskId, null, 'resumed', {
  //           documentNames: 'Background processing...',
  //           totalDocuments: 0
  //         })

  //         startCriteriaPolling({ taskId })
  //       }
  //     } catch (error) {
  //       console.error('Failed to check running jobs:', error)
  //       dispatch(clearInsightsGenerationState())
  //       dispatch(clearDigitizationGenerationState())
  //     }
  //   },
  //   [organizationId, projectId, token, startGenerationMonitor, startCriteriaPolling, dispatch]
  // )
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
        const activeJob = response.data?.content?.[0]

        // If no active job, exit
        if (!activeJob) return

        // Digitization
        dispatch(setDigitizationGenerating(true))

        // Insights
        const params = activeJob.batchJobExecutionParams || []
        const getVal = name => params.find(p => p.parameterName === name)?.parameterValue
        const getJson = name => {
          try {
            return JSON.parse(getVal(name) || '[]')
          } catch {
            return []
          }
        }

        const docIds = getJson('documentNodeIds')
        const qIds = getJson('questionNodeIds')
        const isGlobal = docIds.length === 0 && qIds.length === 0

        // Calculate Cells Logic
        const cellsLoading = {}

        if (isGlobal) {
          // Optimization: Build existing answers Map only if not regenerate
          let existingMap = null

          existingMap = new Set()
          answers.forEach(a => {
            if (a.nodeValue?.nodeDocumentId && a.nodeValue?.nodeQuestionId) {
              existingMap.add(`${a.nodeValue.nodeDocumentId}_${a.nodeValue.nodeQuestionId}`)
            }
          })

          // Loop through Redux data
          for (const doc of documents) {
            for (const q of questions) {
              const key = `${doc.id}_${q.id}`              
              if (!existingMap?.has(key)) {
                cellsLoading[key] = true
              }
            }
          }
        } else {
          // Specific Logic (Concise)
          if (qIds.length === 0) {
            docIds.forEach(id => {
              cellsLoading[`${id}_all`] = true
            })
          } else {
            docIds.forEach(dId => {
              qIds.forEach(qId => {
                cellsLoading[`${dId}_${qId}`] = true
              })
            })
          }
        }

        
        if (Object.keys(cellsLoading).length > 0) {
          dispatch(setInsightsGeneratingCells(cellsLoading))
        }

        startGenerationMonitor(taskId, null, 'resumed', {
          documentNames: 'Background processing...',
          totalDocuments: 0
        })

        startCriteriaPolling({ taskId })
      } catch (error) {
        console.error('Failed to resume jobs:', error)
        dispatch(clearInsightsGenerationState())
        dispatch(clearDigitizationGenerationState())
      }
    },
    [
      organizationId,
      projectId,
      token,
      dispatch,
      startGenerationMonitor,
      startCriteriaPolling,
      documents,
      questions,
      answers
    ]
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
