import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  executeTaskByType,
  setInsightsGeneratingAll,
  setInsightsGeneratingCells,
  clearInsightsGenerationState
} from 'src/store/activeTask/activeTask'
import { toast } from 'react-hot-toast'
import { useGeneration as useGenerationContext } from '../../generation/GenerationContext'
import { useRouter } from 'next/router'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'

export default function useGeneration({ setSelectedDocuments, reloadAll, token }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, taskId, projectId } = router.query
  const { startGeneration, completeGeneration, failGeneration } = useGenerationContext()
  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })

  const { isInsightsGeneratingAll, isInsightsGeneratingCells } = useSelector(state => state.activeTask.generationState)

  const handleGenerate = useCallback(
    async ({ documentsToGenerate = [], questionsToGenerate = [], reGenerateExistingAnswers = true }) => {
      // Normalization of inputs to arrays
      const docsArray = !documentsToGenerate
        ? []
        : Array.isArray(documentsToGenerate)
        ? documentsToGenerate
        : [documentsToGenerate]

      const questionsArray = !questionsToGenerate
        ? []
        : Array.isArray(questionsToGenerate)
        ? questionsToGenerate
        : [questionsToGenerate]

      // Preparation & Validation
      const documentIds = docsArray.map(d => d.id)
      const questionIds = questionsArray.map(q => q.id)

      // Global Generation == Generate All Documents & Generate New Documents
      const isGlobalGeneration = documentIds.length === 0 && questionIds.length === 0

      if (isGlobalGeneration) {
        // Generate ALL documents
        if (reGenerateExistingAnswers) {
          dispatch(setInsightsGeneratingAll(true))
        } else {
          // Generate only NEW documents
          null
        }
      } else {
        const cellsLoading = {}
        // Generate single Document
        if (questionsArray.length === 0) {
          docsArray.forEach(doc => {
            cellsLoading[`${doc.id}_all`] = true
          })
        } else {
          // Generate Single Answer
          docsArray.forEach(doc => {
            questionsArray.forEach(q => {
              cellsLoading[`${doc.id}_${q.id}`] = true
            })
          })
        }

        dispatch(setInsightsGeneratingCells(cellsLoading))
      }

      try {
        const criteria = {
          taskId,
          documentNodeIds: documentIds, // Empty array means all documents
          questionNodeIds: questionIds, // Empty array means all questions
          reGenerateExistingAnswers
        }

        const jobExecutionId = await dispatch(
          executeTaskByType({ organizationId, projectId, taskId, criteria, token })
        ).unwrap()

        // Polling & Feedback
        startGeneration(taskId, null, 'all', 2000)
        await pollJobStatus(jobExecutionId)

        reloadAll()
        completeGeneration(taskId, null)

        toast.success(
          isGlobalGeneration
            ? 'Generation completed for all documents'
            : `Generation completed for ${documentsToGenerate.length} document(s)`
        )

        setSelectedDocuments([])
      } catch (error) {
        console.error('Generation Failed to start generation:', error)
        failGeneration(taskId, null, error.message || 'Failed to start generationd')
        toast.error('Failed to start generation')
      } finally {
        dispatch(clearInsightsGenerationState())
      }
    },
    [
      dispatch,
      organizationId,
      projectId,
      taskId,
      pollJobStatus,
      startGeneration,
      completeGeneration,
      failGeneration,
      reloadAll,
      setSelectedDocuments
    ]
  )

  return {
    handleGenerate,
    isInsightsGeneratingAll,
    isInsightsGeneratingCells
  }
}
