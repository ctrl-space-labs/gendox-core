import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import taskService from "src/gendox-sdk/taskService"
import { useGeneration as useGenerationContext } from "src/views/pages/tasks/generation/GenerationContext"
import {
  setDigitizationGenerating,
  setInsightsGeneratingCells,
  removeInsightsGeneratingCells,
  clearInsightsGenerationState,
  clearDigitizationGenerationState,
} from "src/store/activeTask/activeTask"

import { fetchAnswerTaskNodes } from "src/store/activeTaskNode/activeTaskNode"

interface UseJobMonitorParams {
  organizationId: string
  projectId: string
  token: string
  reloadAll?: () => void
}

interface PollJobByCriteriaParams {
  jobExecutionId?: string
  taskId?: string
  timeout?: number
  onCompleted?: (data: { status: string; job: any }) => void
  onTerminalError?: (error: any) => void
  onTimeout?: () => void
  onReload?: () => void
  selectedDocumentIds?: string[]
  selectedQuestionIds?: string[]
  forceLoader?: boolean
}

interface BuildCellsLoadingMapParams {
  documents?: any[]
  questions?: any[]
  answers?: any[]
  selectedDocumentIds?: string[]
  selectedQuestionIds?: string[]
  forceLoader?: boolean
}

export const useJobMonitor = ({
  organizationId,
  projectId,
  token,
  reloadAll,
}: UseJobMonitorParams) => {
  const dispatch = useDispatch()
  const { startGenerationMonitor, completeGeneration, failGeneration } =
    useGenerationContext()

  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList } =
    useSelector((state: any) => state.activeTaskNode)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeModeRef = useRef<string | null>(null) // 'criteria' | 'jobExecutionId'
  const runIdRef = useRef(0)
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)

  const documents = useMemo(
    () => taskNodesDocumentList?.content || [],
    [taskNodesDocumentList]
  )
  const questions = useMemo(
    () => taskNodesQuestionList?.content || [],
    [taskNodesQuestionList]
  )
  const answers = useMemo(
    () => taskNodesAnswerList?.content || [],
    [taskNodesAnswerList]
  )

  const documentsRef = useRef(documents)
  const questionsRef = useRef(questions)

  useEffect(() => {
    documentsRef.current = documents
    questionsRef.current = questions
  }, [documents, questions])

  const stop = useCallback(() => {
    runIdRef.current += 1
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    activeModeRef.current = null
  }, [])

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

  /**
   * Polls backend jobs until the matching execution reaches `COMPLETED`, using either a known `jobExecutionId` or discovering one via `taskId`.
   * Dynamically adjusts polling interval over time and stops on timeout; invokes `onCompleted` on success or `onTerminalError` for non-running terminal statuses.
   */
  const pollJobByCriteria = useCallback(
    async ({
      jobExecutionId,
      taskId,
      timeout = 14400000, // 4h
      onCompleted, // optional: ({ status, job }) => void
      onTerminalError, // optional: ({ status, job, error }) => void
      onTimeout, // optional: () => void
      onReload, // optional: () => void
      selectedDocumentIds,
      selectedQuestionIds,
      forceLoader,
    }: PollJobByCriteriaParams = {}) => {
      if (!organizationId || !projectId || !token) return
      if (!jobExecutionId && !taskId) return

      stop()
      const myRunId = runIdRef.current
      activeModeRef.current = "criteria"

      const startTime = Date.now()

      const normalizeStatus = (s: any) =>
        typeof s === "string" ? s.trim().toUpperCase() : undefined

      const chooseInterval = (elapsedMs: number) => {
        if (elapsedMs < 60000) return 2000
        if (elapsedMs < 600000) return 5000
        return 10000
      }

      const pickLatestJob = (content: any[] = []) => {
        if (!Array.isArray(content) || content.length === 0) return null
        const started = content.find(
          (j: any) => normalizeStatus(j.status) === "STARTED"
        )
        return started || content[0]
      }

      // 1) Resolve execution id (either provided or discovered)
      let resolvedExecutionId = jobExecutionId

      const buildDiscoveryCriteria = () => ({
        status: "STARTED", // reduce result set for discovery
        matchAllParams: [
          { paramName: "projectId", paramValue: projectId },
          { paramName: "taskId", paramValue: taskId },
        ],
      })

      const buildIdCriteria = (id: string) => ({
        jobExecutionIdsIn: [id],
      })

      const terminalFail = (status: string, job: any, error: any) => {
        stop()
        ;(dispatch as any)(clearInsightsGenerationState())
        ;(dispatch as any)(clearDigitizationGenerationState())
        onTerminalError?.(error)
      }

      const terminateComplete = (status: string, job: any) => {
        setShowTimeoutDialog(false)
        ;(dispatch as any)(clearInsightsGenerationState())
        ;(dispatch as any)(clearDigitizationGenerationState())
        onCompleted?.({ status, job })
        stop()
      }

      try {
        while (
          runIdRef.current === myRunId &&
          activeModeRef.current === "criteria"
        ) {
          let elapsed = Date.now() - startTime

          if (elapsed > timeout) {
            setShowTimeoutDialog(true)
            ;(dispatch as any)(clearInsightsGenerationState())
            ;(dispatch as any)(clearDigitizationGenerationState())
            onTimeout?.()
            stop()
            return "TIMEOUT"
          }

          await sleep(chooseInterval(elapsed))

          let response: any

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
                terminateComplete("UNKNOWN", job)
                return "UNKNOWN"
              }

              // If API uses a different field name, adjust here
              resolvedExecutionId = job.jobExecutionId ?? job.id
              if (!resolvedExecutionId) {
                // Can't continue without an id -> treat as failed scenario
                terminalFail(
                  "FAILED",
                  job,
                  new Error(
                    "Could not resolve jobExecutionId from discovery result."
                  )
                )
              }

              // Continue loop; next iteration will poll by id
              continue
            }

            // TODO: The onReload MUST re-calculate the loaders of the cells based on current documents/questions/answers state
            // onReload?.()  // run the reload callback if provided

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
              "FAILED",
              null,
              new Error(
                `Job polling request failed (treating as FAILED). ExecutionId=${resolvedExecutionId ?? "unknown"}`
              )
            )
          }

          const content = response?.data?.content || []
          const job = pickLatestJob(content)

          // if the backend returns nothing for an id query, we can't see status -> keep waiting
          if (!job) continue

          const status = normalizeStatus(job.status)

          if (
            job.batchJobExecutionParams?.some(
              (p: any) =>
                p.parameterName === "jobName" &&
                p.parameterValue === "documentInsightsJob"
            )
          ) {
            await checkIntermediateAnswers(
              taskId!,
              documentsRef.current,
              questionsRef.current,
              selectedDocumentIds,
              selectedQuestionIds,
              forceLoader
            )
          }

          if (status === "COMPLETED") {
            terminateComplete(status, job)
            return status
          }

          if (!["STARTED", "STARTING", "STOPPING"].includes(status!)) {
            terminalFail(
              status || "UNKNOWN",
              job,
              new Error(`Job ended with status: ${status || "UNKNOWN"}`)
            )
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
    async ({ taskId }: { taskId: string }) => {
      if (!organizationId || !projectId || !taskId || !token) return

      let timestamp = new Date().toISOString()
      try {
        const criteria = {
          status: "STARTED",
          matchAllParams: [
            { paramName: "projectId", paramValue: projectId },
            { paramName: "taskId", paramValue: taskId },
          ],
        }

        const response = await taskService.getJobsByCriteria(
          organizationId,
          projectId,
          criteria,
          token
        )
        const activeJob = response.data?.content?.[0]

        // If no active job, exit
        if (!activeJob) return

        // Digitization
        if (
          activeJob.batchJobExecutionParams?.some(
            (p: any) =>
              p.parameterName === "jobName" &&
              p.parameterValue === "documentDigitizationJob"
          )
        ) {
          ;(dispatch as any)(setDigitizationGenerating(true))
        }

        const params = activeJob.batchJobExecutionParams || []
        const getVal = (name: string) =>
          params.find((p: any) => p.parameterName === name)?.parameterValue
        const getJson = (name: string) => {
          try {
            return JSON.parse(getVal(name) || "[]")
          } catch {
            return []
          }
        }

        const docIds = getJson("documentNodeIds")
        const qIds = getJson("questionNodeIds")

        // Insights
        if (
          activeJob.batchJobExecutionParams?.some(
            (p: any) =>
              p.parameterName === "jobName" &&
              p.parameterValue === "documentInsightsJob"
          )
        ) {
          let cellsLoading = buildCellsLoadingMap({
            documents,
            questions,
            answers,
            selectedDocumentIds: docIds,
            selectedQuestionIds: qIds,
          })

          ;(dispatch as any)(setInsightsGeneratingCells(cellsLoading))
        }

        startGenerationMonitor(taskId, null, "resumed", {
          documentNames: "Background processing...",
          totalDocuments: 0,
        })

        // startCriteriaPolling({ taskId })
        pollJobByCriteria({
          taskId,
          onCompleted: () => {
            completeGeneration(taskId, null)
            reloadAll?.()
          },
          onTerminalError: (error: any) => {
            // TODO: check is failGeneration needs to be called here
            completeGeneration(taskId, null)
            reloadAll?.()
          },
          selectedDocumentIds: docIds,
          selectedQuestionIds: qIds,
          forceLoader: false,
          // onReload: reloadAll
        })
      } catch (error) {
        ;(dispatch as any)(clearInsightsGenerationState())
        ;(dispatch as any)(clearDigitizationGenerationState())
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
      answers,
    ]
  )

  const buildCellsLoadingMap = ({
    documents = [],
    questions = [],
    answers = [],
    selectedDocumentIds = [],
    selectedQuestionIds = [],
    forceLoader = false,
  }: BuildCellsLoadingMapParams) => {
    const targetDocIds =
      selectedDocumentIds && selectedDocumentIds.length > 0
        ? selectedDocumentIds
        : documents.map((d: any) => d.id)
    const targetQuestionIds =
      selectedQuestionIds && selectedQuestionIds.length > 0
        ? selectedQuestionIds
        : questions.map((q: any) => q.id)

    const existing = new Set<string>()
    if (!forceLoader) {
      for (const a of answers || []) {
        const dId = a?.nodeValue?.nodeDocumentId
        const qId = a?.nodeValue?.nodeQuestionId
        if (dId && qId) existing.add(`${dId}_${qId}`)
      }
    }

    const cellsLoading: Record<string, boolean> = {}
    for (const dId of targetDocIds) {
      for (const qId of targetQuestionIds) {
        const key = `${dId}_${qId}`
        if (!existing.has(key)) cellsLoading[key] = true
      }
    }

    return cellsLoading
  }

  const checkIntermediateAnswers = async (
    currentTaskId: string,
    currentDocs: any[],
    currentQuestions: any[],
    selectedDocumentIds?: string[],
    selectedQuestionIds?: string[],
    forceLoader?: boolean
  ) => {
    if (
      !currentTaskId ||
      !currentDocs ||
      currentDocs.length === 0 ||
      !currentQuestions ||
      currentQuestions.length === 0
    ) {
      return
    }

    try {
      const answerPayload = {
        documentNodeIds: currentDocs.map((d: any) => d.id),
        questionNodeIds: currentQuestions.map((q: any) => q.id),
      }

      // Fetch answers
      const ansResult = await (dispatch as any)(
        (fetchAnswerTaskNodes as any)({
          organizationId,
          projectId,
          taskId: currentTaskId,
          answerTaskNodePayload: answerPayload,
          token,
          page: 0,
          size: 2147483647,
        })
      ).unwrap()

      const newAns = ansResult.content || []

      const cellsLoading = buildCellsLoadingMap({
        documents: currentDocs,
        questions: currentQuestions,
        answers: newAns,
        selectedDocumentIds,
        selectedQuestionIds,
        forceLoader,
      })

      if (Object.keys(cellsLoading).length > 0) {
        ;(dispatch as any)(setInsightsGeneratingCells(cellsLoading))
      }
    } catch (e) {
      console.warn("Intermediate fetch skipped:", e)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stop()
  }, [stop])

  return {
    resumeStartedJobs, // for table
    pollJobByCriteria, // for generate flow
    showTimeoutDialog,
    setShowTimeoutDialog,
    buildCellsLoadingMap,
  }
}
