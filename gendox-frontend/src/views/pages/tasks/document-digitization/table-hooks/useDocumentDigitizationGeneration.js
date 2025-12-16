import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { executeTaskByType } from 'src/store/activeTask/activeTask'
import { toast } from 'react-hot-toast'
import { useGeneration } from '../../generation/GenerationContext'

export default function useDocumentDigitizationGeneration({
  organizationId,
  projectId,
  taskId,
  documents,
  pollJobStatus,
  showTimeoutDialog,
  token,
  setSelectedDocuments,
  documentPages,
  onGenerationComplete = () => {}
}) {
  const dispatch = useDispatch()
  const { startGeneration, updateProgress, completeGeneration, failGeneration } = useGeneration()
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingNew, setGeneratingNew] = useState(false)
  const [generatingSelected, setGeneratingSelected] = useState(false)
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

  // Helper function to execute generation with proper state management
  const executeGeneration = useCallback(
    async (
      docs,
      generationType,
      reGenerateExistingAnswers = false,
      pageFrom = null,
      pageTo = null,
      allPages = null
    ) => {
      let setLoading
      switch (generationType) {
        case 'all':
          setLoading = setGeneratingAll
          break
        case 'new':
          setLoading = setGeneratingNew
          break
        case 'selected':
          setLoading = setGeneratingSelected
          break
        default:
          setLoading = () => {}
      }

      const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]
      const documentId = docIds.length === 1 ? docIds[0] : null

      // Start global generation tracking with document info
      const documentNames = docs.map(doc => doc.name).join(', ')
      const metadataForContext = {
        documentNames,
        totalDocuments: docs.length,
        // retry metadata
        selectedIds: docIds,
        reGenerateExistingAnswers,
        pageFrom: pageFrom ?? null,
        pageTo: pageTo ?? null,
        allPages: allPages ?? null,
        generationType
      }

      startGeneration(taskId, documentId, generationType, metadataForContext)

      // Set individual document loading states
      setGeneratingDocuments(prev => new Set([...prev, ...docIds]))
      setLoading(true)

      try {
        const criteria = { taskId, documentNodeIds: docIds, reGenerateExistingAnswers }

        // Add page range if provided
        if (pageFrom !== null && pageFrom !== undefined && pageFrom !== '') {
          criteria.pageFrom = parseInt(pageFrom, 10)
        }
        if (pageTo !== null && pageTo !== undefined && pageTo !== '') {
          criteria.pageTo = parseInt(pageTo, 10)
        }

        const jobExecutionId = await dispatch(
          executeTaskByType({ organizationId, projectId, taskId, criteria, token })
        ).unwrap()

        const typeText =
          generationType === 'all'
            ? 'all'
            : generationType === 'new'
            ? 'new'
            : generationType === 'selected'
            ? 'selected'
            : 'single'

        // Poll job status with progress updates - Let generation context handle lifecycle
        await pollJobStatus(jobExecutionId, status => {
          // Update progress if available from job status
          if (status?.completedItems !== undefined) {
            updateProgress(taskId, documentId, status.completedItems)
          }
        })

        // Mark as completed in global context
        completeGeneration(taskId, documentId)

        toast.success(
          `${typeText.charAt(0).toUpperCase() + typeText.slice(1)} generation completed for ${
            docIds.length
          } document(s)`
        )

        // Call refresh callback to update data
        onGenerationComplete()

        if (generationType === 'selected') {
          setSelectedDocuments([])
        }
      } catch (error) {
        console.error('Failed to start generation:', error)
        const errorMessage = error.message || 'Failed to start generation'

        // Mark as failed in global context
        failGeneration(taskId, documentId, errorMessage)

        toast.error(errorMessage)
      } finally {
        // Remove individual document loading states
        setGeneratingDocuments(prev => {
          const newSet = new Set(prev)
          docIds.forEach(id => newSet.delete(id))
          return newSet
        })
        setLoading(false)
      }
    },
    [
      organizationId,
      projectId,
      taskId,
      pollJobStatus,
      token,
      dispatch,
      setSelectedDocuments,
      startGeneration,
      updateProgress,
      completeGeneration,
      failGeneration,
      onGenerationComplete
    ]
  )

  // helper για να βρούμε τα counts από το documentPages
  const getDocPageStats = useCallback(
    docId => {
      const dp = Array.isArray(documentPages)
        ? documentPages.find(p => p.taskDocumentNodeId === docId)
        : (documentPages?.content || []).find(p => p.taskDocumentNodeId === docId)

      return {
        total: dp?.documentPages ?? 0,
        generated: dp?.numberOfNodePages ?? 0
      }
    },
    [documentPages]
  )

  // Generate New: Only documents that haven't been generated yet
  const generateNew = useCallback(async () => {
    const docsWithPrompts = documents.filter(doc => doc.prompt && doc.prompt.trim())
    const newDocs = docsWithPrompts.filter(doc => !hasGeneratedContent(doc.id))

    const docsWithMissing = docsWithPrompts.filter(d => {
      const { total, generated } = getDocPageStats(d.id)
      return total > 0 && generated < total
    })
    if (docsWithMissing.length === 0) {
      toast.success('No new pages to generate. All documents are fully processed.')
      return
    }
    
    await executeGeneration(docsWithMissing, 'new', false)
  }, [documents, hasGeneratedContent, executeGeneration])

  // Generate All: All documents with prompts, regenerate existing ones
  const generateAll = useCallback(async () => {
    const docsWithPrompts = documents.filter(doc => doc.prompt && doc.prompt.trim())

    if (docsWithPrompts.length === 0) {
      toast.error('No documents with prompts found.')
      return
    }

    await executeGeneration(docsWithPrompts, 'all', true)
  }, [documents, executeGeneration])

  // Generate Selected: Only selected documents
  const generateSelected = useCallback(
    async (selectedDocuments = null) => {
      let selectedDocs

      if (selectedDocuments) {
        // If selectedDocuments array is provided, use it
        selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
      } else {
        // If no array provided, assume we're using the current selection from state
        selectedDocs = documents.filter(doc => selectedDocuments && selectedDocuments.includes(doc.id))
      }

      if (selectedDocs.length === 0) {
        toast.error('No documents selected for generation.')
        return
      }

      // Check if all selected docs have prompts
      const docsWithoutPrompts = selectedDocs.filter(doc => !doc.prompt || !doc.prompt.trim())
      if (docsWithoutPrompts.length > 0) {
        toast.error(`${docsWithoutPrompts.length} selected document(s) don't have prompts. Please add prompts first.`)
        return
      }

      // Determine if we need to regenerate (if any selected doc already has content)
      const hasExistingContent = selectedDocs.some(doc => hasGeneratedContent(doc.id))

      await executeGeneration(selectedDocs, 'selected', hasExistingContent)
    },
    [documents, hasGeneratedContent, executeGeneration]
  )

  // Generate single document (for dialog use)
  const generateSingleDocument = useCallback(
    async (document, pageFrom = null, pageTo = null) => {

      if (!document.prompt || !document.prompt.trim()) {
        toast.error('Document needs a prompt before generation.')
        return
      }

      const hasContent = hasGeneratedContent(document.id)
      await executeGeneration([document], 'single', hasContent, pageFrom, pageTo)
    },
    [hasGeneratedContent, executeGeneration]
  )

  // Helper function to check if a specific document is being generated
  const isDocumentGenerating = useCallback(
    documentId => {
      return generatingDocuments.has(documentId)
    },
    [generatingDocuments]
  )

  return {
    // New generation functions
    generateNew,
    generateAll,
    generateSelected,
    generateSingleDocument,

    // Loading states
    generatingAll,
    generatingNew,
    generatingSelected,
    generatingDocuments,

    // Helper functions
    hasGeneratedContent,
    isDocumentGenerating
  }
}
