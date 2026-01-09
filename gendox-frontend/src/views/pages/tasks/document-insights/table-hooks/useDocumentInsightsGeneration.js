import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  executeTaskByType,
  setInsightsGeneratingCells,
  clearInsightsGenerationState
} from 'src/store/activeTask/activeTask'
import { toast } from 'react-hot-toast'
import { useGeneration as useGenerationContext } from '../../generation/GenerationContext'
import { useRouter } from 'next/router'
import { useJobMonitor } from '../../generation/useJobMonitor'

export default function useGeneration({ setSelectedDocuments, reloadAll, token }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, taskId, projectId } = router.query
  const { startGenerationMonitor, completeGeneration, failGeneration } = useGenerationContext()

  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList } = useSelector(
    state => state.activeTaskNode
  )

  const { isInsightsGeneratingAll, isInsightsGeneratingNew, isInsightsGeneratingCells } = useSelector(
    state => state.activeTask.generationState
  )

  const { pollJobByCriteria } = useJobMonitor({
    organizationId,
    projectId,
    token,
    reloadAll
  })

  const documents = useMemo(() => taskNodesDocumentList?.content || [], [taskNodesDocumentList])
  const questions = useMemo(() => taskNodesQuestionList?.content || [], [taskNodesQuestionList])
  const answers = useMemo(() => taskNodesAnswerList?.content || [], [taskNodesAnswerList])

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

      const targetDocs = documentIds.length > 0 ? docsArray : documents
      const targetQuestions = questionIds.length > 0 ? questionsArray : questions

      const isGlobal = documentIds.length === 0 && questionIds.length === 0

      // Answers key: documentNodeId_questionNodeId
      const existingAnswersMap = new Set()
      answers.forEach(ans => {
        if (ans.nodeValue?.nodeDocumentId && ans.nodeValue?.nodeQuestionId) {
          existingAnswersMap.add(`${ans.nodeValue.nodeDocumentId}_${ans.nodeValue.nodeQuestionId}`)
        }
      })

      // Determine which cells need generation
      const cellsLoading = {}

      targetDocs.forEach(doc => {
        targetQuestions.forEach(q => {
          const cellKey = `${doc.id}_${q.id}`
          const hasAnswer = existingAnswersMap.has(cellKey)

          if (!isGlobal || !hasAnswer) {
            cellsLoading[cellKey] = true
          }
        })
      })

      dispatch(setInsightsGeneratingCells(cellsLoading))

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
        startGenerationMonitor(taskId, null, 'all', 2000)
        await pollJobByCriteria({jobExecutionId})

        reloadAll()
        completeGeneration(taskId, null)

        toast.success(`Generation completed`)

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
