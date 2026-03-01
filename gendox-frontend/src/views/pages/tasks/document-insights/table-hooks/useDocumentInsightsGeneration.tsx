import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  executeTaskByType,
  setInsightsGeneratingCells,
  clearInsightsGenerationState
} from 'src/store/activeTask/activeTask'
import { toast } from 'sonner'
import { useGeneration as useGenerationContext } from '../../generation/GenerationContext'
import { useRouter } from 'next/router'
import { useJobMonitor } from '../../generation/useJobMonitor'

interface UseGenerationProps {
  setSelectedDocuments: (docs: string[]) => void
  reloadAll: () => Promise<void> | void
  token: string | null
}

interface GenerateParams {
  documentsToGenerate?: any | any[]
  questionsToGenerate?: any | any[]
  reGenerateExistingAnswers?: boolean
}

export default function useGeneration({ setSelectedDocuments, reloadAll, token }: UseGenerationProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, taskId, projectId } = router.query as Record<string, string>

  const { startGenerationMonitor, completeGeneration, failGeneration } = useGenerationContext()

  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList } = useSelector(
    (state: any) => state.activeTaskNode
  )

  const { isInsightsGeneratingCells } = useSelector((state: any) => state.activeTask.generationState)

  const { pollJobByCriteria, buildCellsLoadingMap } = useJobMonitor({
    organizationId,
    projectId,
    token,
    reloadAll
  })

  const documents = useMemo(() => taskNodesDocumentList?.content || [], [taskNodesDocumentList])
  const questions = useMemo(() => taskNodesQuestionList?.content || [], [taskNodesQuestionList])
  const answers = useMemo(() => taskNodesAnswerList?.content || [], [taskNodesAnswerList])

  const handleGenerate = useCallback(
    async ({ documentsToGenerate = [], questionsToGenerate = [], reGenerateExistingAnswers = true }: GenerateParams) => {
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

      const selectedDocumentIds = docsArray.map((d: any) => d.id)
      const selectedQuestionIds = questionsArray.map((q: any) => q.id)

      const cellsLoading = buildCellsLoadingMap({
        documents,
        questions,
        answers,
        selectedDocumentIds,
        selectedQuestionIds,
        forceLoader: reGenerateExistingAnswers
      })

      ;(dispatch as any)(setInsightsGeneratingCells(cellsLoading))

      try {
        const criteria = {
          taskId,
          documentNodeIds: selectedDocumentIds,
          questionNodeIds: selectedQuestionIds,
          reGenerateExistingAnswers
        }

        const jobExecutionId = await (dispatch as any)(
          (executeTaskByType as any)({ organizationId, projectId, taskId, criteria, token })
        ).unwrap()

        // Polling & Feedback
        startGenerationMonitor(taskId, null, 'all')

        await pollJobByCriteria({
          jobExecutionId,
          taskId,
          onReload: reloadAll,
          selectedDocumentIds,
          selectedQuestionIds,
          forceLoader: false
        })

        reloadAll()
        completeGeneration(taskId, null)

        toast.success('Generation completed')

        setSelectedDocuments([])
      } catch (error: any) {
        console.error('Generation Failed to start generation:', error)
        failGeneration(taskId, null, error.message || 'Failed to start generation')
        toast.error('Failed to start generation')
      } finally {
        ;(dispatch as any)(clearInsightsGenerationState())
      }
    },
    [
      dispatch,
      organizationId,
      projectId,
      taskId,
      pollJobByCriteria,
      startGenerationMonitor,
      completeGeneration,
      failGeneration,
      reloadAll,
      setSelectedDocuments,
      documents,
      questions,
      answers
    ]
  )

  return {
    handleGenerate,
    isInsightsGeneratingCells
  }
}
