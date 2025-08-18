import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  executeTaskByType,
} from 'src/store/activeTask/activeTask'
import { toast } from 'react-hot-toast'


export default function useDocumentDigitizationGeneration({
  organizationId,
  projectId,
  taskId,
  documents,
  pollJobStatus,
  token,
  setSelectedDocuments,
  documentPages,
  onGenerationComplete = () => {}
}) {
  const dispatch = useDispatch()
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingNew, setGeneratingNew] = useState(false)
  const [generatingSelected, setGeneratingSelected] = useState(false)
  const [generatingDocuments, setGeneratingDocuments] = useState(new Set())

  // Helper function to check if document has been generated
  const hasGeneratedContent = useCallback((documentId) => {
    const docPage = Array.isArray(documentPages) 
      ? documentPages.find(page => page.taskDocumentNodeId === documentId)
      : (documentPages?.content || []).find(page => page.taskDocumentNodeId === documentId)
    return docPage && docPage.numberOfNodePages > 0
  }, [documentPages])

  // Helper function to execute generation with proper state management
  const executeGeneration = useCallback(async (docs, generationType, reGenerateExistingAnswers = false, pageFrom = null, pageTo = null) => {
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

      const typeText = generationType === 'all' ? 'all' : generationType === 'new' ? 'new' : 'selected'
      toast.success(`Started ${typeText} generation for ${docIds.length} document(s)`)
      
      await pollJobStatus(jobExecutionId)
      
      toast.success(`${typeText.charAt(0).toUpperCase() + typeText.slice(1)} generation completed for ${docIds.length} document(s)`)
      
      // Add a small delay to ensure backend processing is complete
      setTimeout(() => {
        // Call refresh callback to update data
        onGenerationComplete()
      }, 1000)
      
      if (generationType === 'selected') {
        setSelectedDocuments([])
      }
    } catch (error) {
      console.error('Failed to start generation:', error)
      toast.error('Failed to start generation')
    } finally {
      // Remove individual document loading states
      setGeneratingDocuments(prev => {
        const newSet = new Set(prev)
        docIds.forEach(id => newSet.delete(id))
        return newSet
      })
      setLoading(false)
    }
  }, [organizationId, projectId, taskId, pollJobStatus, token, dispatch, setSelectedDocuments])

  // Generate New: Only documents that haven't been generated yet
  const generateNew = useCallback(async () => {
    const docsWithPrompts = documents.filter(doc => doc.prompt && doc.prompt.trim())
    const newDocs = docsWithPrompts.filter(doc => !hasGeneratedContent(doc.id))
    
    if (newDocs.length === 0) {
      toast.info('No new documents to generate. All documents with prompts have already been generated.')
      return
    }

    await executeGeneration(newDocs, 'new', false)
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
  const generateSelected = useCallback(async (selectedDocuments = null) => {
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
  }, [documents, hasGeneratedContent, executeGeneration])

  // Generate single document (for dialog use)
  const generateSingleDocument = useCallback(async (document, pageFrom = null, pageTo = null) => {
    if (!document.prompt || !document.prompt.trim()) {
      toast.error('Document needs a prompt before generation.')
      return
    }

    const hasContent = hasGeneratedContent(document.id)
    await executeGeneration([document], 'selected', hasContent, pageFrom, pageTo)
  }, [hasGeneratedContent, executeGeneration])

  // Helper function to check if a specific document is being generated
  const isDocumentGenerating = useCallback((documentId) => {
    return generatingDocuments.has(documentId)
  }, [generatingDocuments])

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
