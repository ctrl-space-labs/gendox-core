import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { useGeneration } from '../../generation/GenerationContext'
import { useRouter } from 'next/router'
import { useJobMonitor } from '../../generation/useJobMonitor'
// @ts-ignore - JS module exports
import { executeTaskByType, setDigitizationGenerating, clearDigitizationGenerationState } from 'src/store/activeTask/activeTask'

interface UseDocumentDigitizationGenerationProps {
  reloadAll: () => Promise<void> | void
  token: string | null
  setSelectedDocuments: (docs: string[]) => void
  documentPages: any
}

interface HandleGenerateParams {
  documentsToGenerate?: any[] | any
  reGenerateExistingAnswers?: boolean
}

export default function useDocumentDigitizationGeneration({
  reloadAll,
  token,
  setSelectedDocuments,
  documentPages
}: UseDocumentDigitizationGenerationProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, taskId, projectId } = router.query

  const { startGenerationMonitor, updateProgress, completeGeneration, failGeneration } = useGeneration() as any
  const { pollJobByCriteria } = useJobMonitor({
    organizationId,
    projectId,
    token,
    reloadAll
  } as any)
  const { isDigitizationGenerating } = useSelector((state: any) => state.activeTask.generationState)
  const [generatingDocuments, setGeneratingDocuments] = useState<Set<string>>(new Set())

  // Helper function to check if document has been generated
  const hasGeneratedContent = useCallback(
    (documentId: string) => {
      const docPage = Array.isArray(documentPages)
        ? documentPages.find((page: any) => page.taskDocumentNodeId === documentId)
        : (documentPages?.content || []).find((page: any) => page.taskDocumentNodeId === documentId)

      const hasContent = docPage && docPage.numberOfNodePages > 0

      return hasContent
    },
    [documentPages]
  )

  const handleGenerate = useCallback(
    async ({ documentsToGenerate = [], reGenerateExistingAnswers = true }: HandleGenerateParams) => {
      const docsArray = !documentsToGenerate
        ? []
        : Array.isArray(documentsToGenerate)
        ? documentsToGenerate
        : [documentsToGenerate]

      const documentIds = docsArray.map((d: any) => d.id)

      // Global Generation == Generate All Documents & Generate New Documents
      const isGlobalGeneration = documentIds.length === 0

      console.log('Starting digitization generation for documents:', {
        docCount: documentIds.length,
        reGenerate: reGenerateExistingAnswers
      })

      try {
        (dispatch as any)((setDigitizationGenerating as any)(true))
        const criteria = { taskId, documentNodeIds: documentIds, reGenerateExistingAnswers }

        const jobExecutionId = await (dispatch as any)(
          (executeTaskByType as any)({ organizationId, projectId, taskId, criteria, token })
        ).unwrap()

        startGenerationMonitor(taskId, null, 'all')
        await pollJobByCriteria({ jobExecutionId })

        reloadAll()
        completeGeneration(taskId, null)

        toast.success(
          isGlobalGeneration
            ? 'Generation completed for all documents'
            : `Generation completed for ${documentsToGenerate.length} document(s)`
        )

        setSelectedDocuments([])
      } catch (error: any) {
        console.error('Failed to start generation:', error)
        failGeneration(taskId, null, error.message || 'Failed to start generation')
        toast.error('Failed to start generation')
      } finally {
        (dispatch as any)((clearDigitizationGenerationState as any)())
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
      setSelectedDocuments
    ]
  )

  // Helper function to check if a specific document is being generated
  const isDocumentGenerating = useCallback(
    (documentId: string) => {
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
