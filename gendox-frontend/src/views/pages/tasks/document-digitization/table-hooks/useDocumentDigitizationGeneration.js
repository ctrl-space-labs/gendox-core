import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  executeTaskByType,
} from 'src/store/activeTask/activeTask'
import { toast } from 'react-hot-toast'


export default function useGeneration({
  organizationId,
  projectId,
  taskId,
  documents,
  pollJobStatus,
  token,
  setSelectedDocuments,
}) {
  const dispatch = useDispatch()
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingCells, setGeneratingCells] = useState({})

  const generateDocumentAnswers = useCallback(async ({ docs, pagesToGenerate, reGenerateExistingAnswers, isAll = false }) => {
    if (isAll) setGeneratingAll(true)
    try {
      const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]
      const criteria = { taskId, documentNodeIds: docIds, reGenerateExistingAnswers }
      const jobExecutionId = await dispatch(
        executeTaskByType({ organizationId, projectId, taskId, criteria, token })
      ).unwrap()

      toast.success(`Started generation for ${docIds.length} document(s)`)
      await pollJobStatus(jobExecutionId)
      
      toast.success(`Generation completed for ${docIds.length} document(s)`)
      setSelectedDocuments([])
    } catch (error) {
      console.error('Failed to start generation:', error)
      toast.error('Failed to start generation')
    } finally {
      if (isAll) setGeneratingAll(false)
    }
  }, [organizationId, projectId, taskId, documents, pollJobStatus, token, dispatch])

  const generateAnswerForCell = useCallback(async (doc, docPage) => {
    if (!doc || !docPage) {
      toast.error('Document and page are required to generate an answer.')
      return
    }
    const key = `${doc.id}_${docPage.id}`
    setGeneratingCells(cells => ({ ...cells, [key]: true }))
    try {
      await generateDocumentAnswers({ docs: doc, pagesToGenerate: docPage, reGenerateExistingAnswers: true })
    } finally {
      setGeneratingCells(cells => {
        const { [key]: _, ...rest } = cells
        return rest
      })
    }
  }, [generateDocumentAnswers])

  const generateSelectedDocuments = useCallback(async (docs, selectedDocuments) => {
    const selectedDocs = docs.filter(doc => selectedDocuments.includes(doc.id))
    if (selectedDocs.length === 0) {
      toast.error('No documents selected for generation.')
      return
    }
    await generateDocumentAnswers({ docs: selectedDocs, isAll: false })
  }, [generateDocumentAnswers])

  return {
    generateDocumentAnswers,
    generateAnswerForCell,
    generatingAll,
    generateSelectedDocuments
  }
}
