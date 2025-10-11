import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { executeTaskByType } from 'src/store/activeTask/activeTask'
import { toast } from 'react-hot-toast'
import { useGeneration as useGenerationContext } from '../../generation/GenerationContext'

export default function useGeneration({
  organizationId,
  projectId,
  taskId,
  documents,
  questions,
  pollJobStatus,
  token,
  selectedDocuments,
  setSelectedDocuments,
  fetchAnswers
}) {
  const dispatch = useDispatch()
  const { startGeneration, updateProgress, completeGeneration, failGeneration } = useGenerationContext()
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [isGeneratingCells, setIsGeneratingCells] = useState({})

   const handleGenerate = useCallback(
    async ({ docs, questionsToGenerate, reGenerateExistingAnswers, isAll = false }) => {
     console.log('Starting generation for documents:', docs, 'with questions:', questionsToGenerate, 'reGenerate:', reGenerateExistingAnswers, 'isAll:', isAll)
      if (isAll) setIsGeneratingAll(true)

      try {
        const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]

        const questionIds = questionsToGenerate
          ? Array.isArray(questionsToGenerate)
            ? questionsToGenerate.map(q => q.id)
            : [questionsToGenerate.id]
          : questions.map(q => q.id)

        const criteria = {
          taskId,
          documentNodeIds: docIds,
          questionNodeIds: questionIds,
          reGenerateExistingAnswers
        }

        const jobExecutionId = await dispatch(
          executeTaskByType({ organizationId, projectId, taskId, criteria, token })
        ).unwrap()

        // Start tracking generation in GlobalGenerationStatus
        const generationType = isAll ? 'all' : selectedDocuments?.length > 0 ? 'selected' : 'new'
        startGeneration(taskId, null, generationType, docIds.length)


        await pollJobStatus(jobExecutionId)
        fetchAnswers()

        // Complete generation tracking
        completeGeneration(taskId, null)
        toast.success(`Generation completed for ${docIds.length} document(s)`)
        setSelectedDocuments([])
      } catch (error) {
        console.error('Failed to start generation:', error)
        // Fail generation tracking
        failGeneration(taskId, null, error.message || 'Generation failed')
        toast.error('Failed to start generation')
      } finally {
        if (isAll) setIsGeneratingAll(false)
      }
    },
    [dispatch, documents, questions, organizationId, projectId, taskId, pollJobStatus, token, setSelectedDocuments]
  )

  const handleGenerateSelected = useCallback(async () => {
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    if (selectedDocs.length === 0) {
      toast.error('No documents selected!')
      return
    }
    const newCells = {}
    selectedDocs.forEach(doc => {
      questions.forEach(q => {
        newCells[`${doc.id}_${q.id}`] = true
      })
    })
    setIsGeneratingCells(cells => ({ ...cells, ...newCells }))

    try {
      await handleGenerate({ docs: selectedDocs, reGenerateExistingAnswers: true })
    } finally {
      // Clean up just those cells
      setIsGeneratingCells(cells => {
        const copy = { ...cells }
        selectedDocs.forEach(doc => {
          questions.forEach(q => {
            delete copy[`${doc.id}_${q.id}`]
          })
        })
        return copy
      })
    }
  }, [documents, questions, selectedDocuments, handleGenerate])

  const handleGenerateSingleAnswer = useCallback(
    async (doc, question) => {
      if (!doc || !question) {
        toast.error('Document and question are required to generate an answer.')
        return
      }
      const key = `${doc.id}_${question.id}`
      setIsGeneratingCells(cells => ({ ...cells, [key]: true }))
      try {
        await handleGenerate({ docs: doc, questionsToGenerate: question, reGenerateExistingAnswers: true })
      } finally {
        setIsGeneratingCells(cells => {
          const { [key]: _, ...rest } = cells
          return rest
        })
      }
    }, [handleGenerate])



  return {
    handleGenerateSelected,
    handleGenerateSingleAnswer,
    handleGenerate,
    isGeneratingAll,
    isGeneratingCells
  }
}
