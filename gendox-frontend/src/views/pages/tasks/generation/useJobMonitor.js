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

  /**
   * Polls backend jobs until the matching execution reaches `COMPLETED`, using either a known `jobExecutionId` or discovering one via `taskId`.
   * Dynamically adjusts polling interval over time and stops on timeout; invokes `onCompleted` on success or `onTerminalError` for non-running terminal statuses.
   */
  const pollJobByCriteria = useCallback(
    async ({
             jobExecutionId,
             taskId,

             timeout = 14400000, // 4h
             onCompleted,        // optional: ({ status, job }) => void
             onTerminalError,    // optional: ({ status, job, error }) => void
             onTimeout           // optional: () => void
           } = {}) => {
      if (!organizationId || !projectId || !token) return
      if (!jobExecutionId && !taskId) return

      stop()
      activeModeRef.current = 'criteria'

      const startTime = Date.now()


      const normalizeStatus = (s) =>
        typeof s === 'string' ? s.trim().toUpperCase() : undefined

      const chooseInterval = (elapsedMs) => {
        if (elapsedMs < 60000) return 2000
        if (elapsedMs < 600000) return 5000
        return 10000
      }

      const pickLatestJob = (content = []) => {
        if (!Array.isArray(content) || content.length === 0) return null
        const started = content.find((j) => normalizeStatus(j.status) === 'STARTED')
        return started || content[0]
      }

      // 1) Resolve execution id (either provided or discovered)
      let resolvedExecutionId = jobExecutionId

      const buildDiscoveryCriteria = () => ({
        status: 'STARTED', // reduce result set for discovery
        matchAllParams: [
          { paramName: 'projectId', paramValue: projectId },
          { paramName: 'taskId', paramValue: taskId }
        ]
      })

      const buildIdCriteria = (id) => ({
        jobExecutionIdsIn: [id]
      })

      const terminalFail = (status, job, error) => {
        stop()
        dispatch(clearInsightsGenerationState())
        dispatch(clearDigitizationGenerationState())
        onTerminalError?.(error)
        // throw error instanceof Error
        //   ? error
        //   : new Error(`Job ended with status: ${status}`)
      }


      try {
        while (activeModeRef.current === 'criteria') {
          const elapsed = Date.now() - startTime

          if (elapsed > timeout) {
            setShowTimeoutDialog(true)
            dispatch(clearInsightsGenerationState())
            dispatch(clearDigitizationGenerationState())
            onTimeout?.()
            stop()
            return 'TIMEOUT'
          }

          await sleep(chooseInterval(elapsed))

          let response
          try {
            // 2) If we don't have jobExecutionId yet, discover it (STARTED only)
            if (!resolvedExecutionId) {
              response = await taskService.getJobsByCriteria(
                organizationId,
                projectId,
                buildDiscoveryCriteria(),
                token
              )

              const job = pickLatestJob(response.data?.content || [])
              if (!job) {
                // nothing STARTED yet (or already finished before we could see it)
                // keep polling until timeout (your rules said: stop only on COMPLETED)
                continue
              }

              // If API uses a different field name, adjust here
              resolvedExecutionId = job.jobExecutionId ?? job.id
              if (!resolvedExecutionId) {
                // Can't continue without an id -> treat as failed scenario
                terminalFail(
                  'FAILED',
                  job,
                  new Error('Could not resolve jobExecutionId from discovery result.')
                )
              }

              // Continue loop; next iteration will poll by id
              continue
            }

            // 3) Poll by jobExecutionId
            response = await taskService.getJobsByCriteria(
              organizationId,
              projectId,
              buildIdCriteria(resolvedExecutionId),
              token
            )
          } catch (error) {
            // Request-level failure (500, network, etc.) => terminal FAILED scenario
            terminalFail(
              'FAILED',
              null,
              new Error(
                `Job polling request failed (treating as FAILED). ExecutionId=${resolvedExecutionId ?? 'unknown'}`
              )
            )
          }

          const content = response.data?.content || []
          const job = pickLatestJob(content)

          // if the backend returns nothing for an id query, we can't see status -> keep waiting
          if (!job) continue

          const status = normalizeStatus(job.status)

          if (status === 'COMPLETED') {
            setShowTimeoutDialog(false)
            dispatch(clearInsightsGenerationState())
            dispatch(clearDigitizationGenerationState())
            onCompleted?.({ status, job })
            stop()
            return status
          }

          if (!['STARTED', 'STARTING', 'STOPPING'].includes(status)) {
            terminalFail(status || 'UNKNOWN', job, new Error(`Job ended with status: ${status || 'UNKNOWN'}`))
            return status
          }

          // otherwise keep polling
        }
      } catch (err) {
        stop()
        throw err
      }
    },
    [organizationId, projectId, token, stop, dispatch]
  )

  /**
   * Resume STARTED jobs on component mount
   */

  const resumeStartedJobs = useCallback(
    async ({ taskId }) => {
      if (!organizationId || !projectId || !taskId || !token) return

      let timestamp = new Date().toISOString()
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

        const targetDocs = docIds.length > 0 ? docIds : documents.map(d => d.id)
        const targetQuestions = qIds.length > 0 ? qIds : questions.map(q => q.id)

        const isGlobal = docIds.length === 0 && qIds.length === 0

        // Calculate Cells Logic
        const cellsLoading = {}
        let existingMap = null

        existingMap = new Set()
        answers.forEach(a => {
          if (a.nodeValue?.nodeDocumentId && a.nodeValue?.nodeQuestionId) {
            existingMap.add(`${a.nodeValue.nodeDocumentId}_${a.nodeValue.nodeQuestionId}`)
          }
        })

        console.log("Target Docs:", targetDocs)
        console.log("Target Questions:", targetQuestions)
        console.log("Existing Map:", existingMap)

        for (const docId of targetDocs) {
          for (const qId of targetQuestions) {
            const key = `${docId}_${qId}`
            if (!existingMap?.has(key)) {
              cellsLoading[key] = true
            }
          }
        }

        console.log("Cells Loading:", cellsLoading)

        // if (isGlobal) {
        //   // Optimization: Build existing answers Map only if not regenerate
        //   let existingMap = null
        //
        //   existingMap = new Set()
        //   answers.forEach(a => {
        //     if (a.nodeValue?.nodeDocumentId && a.nodeValue?.nodeQuestionId) {
        //       existingMap.add(`${a.nodeValue.nodeDocumentId}_${a.nodeValue.nodeQuestionId}`)
        //     }
        //   })
        //   console.log('IsGlobal Answers:', answers)
        //
        //   // Loop through Redux data
        //   for (const doc of documents) {
        //     for (const q of questions) {
        //       const key = `${doc.id}_${q.id}`
        //       if (!existingMap?.has(key)) {
        //         cellsLoading[key] = true
        //       }
        //     }
        //   }
        // } else {
        //   // Specific Logic (Concise)
        //   if (qIds.length === 0) {
        //     docIds.forEach(id => {
        //       cellsLoading[`${id}_all`] = true
        //     })
        //   } else {
        //     docIds.forEach(dId => {
        //       qIds.forEach(qId => {
        //         cellsLoading[`${dId}_${qId}`] = true
        //       })
        //     })
        //   }
        // }


        if (Object.keys(cellsLoading).length > 0) {
          dispatch(setInsightsGeneratingCells(cellsLoading))
        }

        startGenerationMonitor(taskId, null, 'resumed', {
          documentNames: 'Background processing...',
          totalDocuments: 0
        })

        // startCriteriaPolling({ taskId })
        pollJobByCriteria({
          taskId,
          onCompleted: () => {
            completeGeneration(taskId, null)
            reloadAll?.()
          },
          onTerminalError: (error) => {
            // TODO: check is failGeneration needs to be called here
            completeGeneration(taskId, null)
            reloadAll?.()
          }
        })
      } catch (error) {
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
    pollJobByCriteria, // for generate flow
    showTimeoutDialog,
    setShowTimeoutDialog
  }
}
