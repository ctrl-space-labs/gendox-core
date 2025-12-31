import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { useGeneration } from '../../generation/GenerationContext'
import { useRouter } from 'next/router'
import { useJobMonitor } from '../../generation/useJobMonitor'
import {
  executeTaskByType,
  setDigitizationGenerating,
  clearDigitizationGenerationState
} from 'src/store/activeTask/activeTask'

export default function useDocumentDigitizationGeneration({ reloadAll, token, setSelectedDocuments, documentPages }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, taskId, projectId } = router.query

  const { startGenerationMonitor, updateProgress, completeGeneration, failGeneration } = useGeneration()
  const { pollJobExecution } = useJobMonitor({
    organizationId,
    projectId,
    token,
    reloadAll
  })
  const { isDigitizationGenerating } = useSelector(state => state.activeTask.generationState)
  const [generatingDocuments, setGeneratingDocuments] = useState(new Set())

  // Helper function to check if document has been generated
  const hasGeneratedContent = useCallback(
    documentId => {
      const docPage = Array.isArray(documentPages)
        ? documentPages.find(page => page.taskDocumentNodeId === documentId)
        : (documentPages?.content || []).find(page => page.taskDocumentNodeId === documentId)

      const hasContent = docPage && docPage.numberOfNodePages > 0

      return hasContent
    },
    [documentPages]
  )

  const handleGenerate = useCallback(
    async ({ documentsToGenerate = [], reGenerateExistingAnswers = true }) => {
      const docsArray = !documentsToGenerate
        ? []
        : Array.isArray(documentsToGenerate)
        ? documentsToGenerate
        : [documentsToGenerate]

      const documentIds = docsArray.map(d => d.id)

      // Global Generation == Generate All Documents & Generate New Documents
      const isGlobalGeneration = documentIds.length === 0

      console.log('Starting digitization generation for documents:', {
        docCount: documentIds.length,
        reGenerate: reGenerateExistingAnswers
      })

      try {
        dispatch(setDigitizationGenerating(true))
        const criteria = { taskId, documentNodeIds: documentIds, reGenerateExistingAnswers }

        const jobExecutionId = await dispatch(
          executeTaskByType({ organizationId, projectId, taskId, criteria, token })
        ).unwrap()

        startGenerationMonitor(taskId, null, 'all', 2000)
        await pollJobExecution(jobExecutionId)

        reloadAll()
        completeGeneration(taskId, null)

        toast.success(
          isGlobalGeneration
            ? 'Generation completed for all documents'
            : `Generation completed for ${documentsToGenerate.length} document(s)`
        )

        setSelectedDocuments([])
      } catch (error) {
        console.error('Failed to start generation:', error)
        failGeneration(taskId, null, error.message || 'Failed to start generation')
        toast.error('Failed to start generation')
      } finally {
        dispatch(clearDigitizationGenerationState())
      }
    },
    [
      dispatch,
      organizationId,
      projectId,
      taskId,
      pollJobExecution,
      startGenerationMonitor,
      completeGeneration,
      failGeneration,
      reloadAll,
      setSelectedDocuments
    ]
  )

  // Helper function to check if a specific document is being generated
  const isDocumentGenerating = useCallback(
    documentId => {
      return generatingDocuments.has(documentId)
    },
    [generatingDocuments]
  )

  return {
    // Generation functions
    handleGenerate,

    // Loading states
    isDigitizationGenerating,
    generatingDocuments,

    // Helper functions
    hasGeneratedContent,
    isDocumentGenerating
  }
}
