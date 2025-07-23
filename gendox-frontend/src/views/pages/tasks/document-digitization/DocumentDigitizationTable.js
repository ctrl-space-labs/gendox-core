import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Modal } from '@mui/material'
import Paper from '@mui/material/Paper'
import DocumentsAddNewDialog from './table-dialogs/DocumentsAddNewDialog'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import {
  fetchTaskNodesByTaskId,
  executeTaskByType,
  deleteTaskNode,
  fetchTaskNodesByCriteria,
  fetchAnswerTaskNodes,
  createTaskNodesBatch
} from 'src/store/activeTask/activeTask'
import { fetchDocumentsByCriteria } from 'src/store/activeDocument/activeDocument'
import DocumentDigitizationGrid from './table-components/DocumentDigitizationGrid'
import HeaderSection from './table-components/HeaderSection'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import taskService from 'src/gendox-sdk/taskService'
import { downloadBlobForCSV } from 'src/utils/tasks/downloadBlobForCSV'

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

const MAX_PAGE_SIZE = 2147483647

const DocumentDigitizationTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesAnswerList, isLoading, isLoadingAnswers } = useSelector(
    state => state.activeTask
  )
  const isBlurring = useSelector(state => state.activeDocument.isBlurring)

  const [documents, setDocuments] = useState([])
  const [answers, setAnswers] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteNodeId, setDeleteNodeId] = useState(null)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [showDialog, setShowDialog] = useState(false)
  const [questionsDialogTexts, setQuestionsDialogTexts] = useState([''])
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [isSavingQuestions, setIsSavingQuestions] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [isGeneratingCells, setIsGeneratingCells] = useState({})

  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })

  console.log('taskNodesDocumentList', taskNodesDocumentList)

  // 1️⃣ **Reset all local state when switching tasks/orgs/projects**
  useEffect(() => {
    setDocuments([])
    setAnswers([])
    setSelectedDocuments([])
    setPage(0)
  }, [taskId, organizationId, projectId])

  // 2️⃣ **Fetch task nodes documents when taskId changes**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return

    dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['DOCUMENT'] },
        token,
        page,
        size: pageSize
      })
    )
      .unwrap()
      .catch(() => toast.error('Failed to load documents'))
  }, [organizationId, projectId, taskId, token, dispatch, page, pageSize])

  // 4️⃣ **Fetch task nodes answers when task nodes document list changes**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['ANSWER'] },
        token,
        page: 0,
        size: MAX_PAGE_SIZE
      })
    )
      .unwrap()
      .catch(() => toast.error('Failed to load answers'))
  }, [organizationId, projectId, taskId, token, dispatch])

  // 3️⃣ **Sync documents to local state**
  useEffect(() => {
    let isCancelled = false

    const nodes = taskNodesDocumentList?.content || []
    const documentIds = nodes.map(n => n.documentId).filter(Boolean)
    if (!documentIds.length) {
      setDocuments([])
      return
    }

    dispatch(fetchDocumentsByCriteria({ organizationId, projectId, documentIds, token }))
      .unwrap()
      .then(fullDocuments => {
        if (isCancelled) return
        setDocuments(
          nodes.map(node => {
            const fullDoc = (fullDocuments || []).find(d => d.id === node.documentId)
            return {
              id: node.id,
              documentId: node.documentId,
              name: fullDoc?.title || 'Unknown Document',
              prompt: node.nodeValue?.documentMetadata?.prompt || '',
              structure: node.nodeValue?.documentMetadata?.structure || '',
            }
          })
        )
      })
      .catch(() => {
        if (!isCancelled) {
          setDocuments([])
          toast.error('Failed to load full document details')
        }
      })
    return () => {
      isCancelled = true
    }
  }, [taskNodesDocumentList, organizationId, projectId, token, dispatch])

 

  // 6️⃣ **Sync answers to local state**
  useEffect(() => {
    setAnswers(
      (taskNodesAnswerList?.content || []).map(node => ({
        id: node.id,
        documentNodeId: node.nodeValue?.documentNodeId || '',
        message: node.nodeValue?.message || '',
        answerValue: node.nodeValue?.answerValue || '',
        answerFlagEnum: node.nodeValue?.answerFlagEnum || '',
        pageNumber: node.pageNumber || 0,
        documentId: node.documentId || '',
      }))
    )
  }, [taskNodesAnswerList])

  // 7️⃣ **Update URL query params when page or pageSize changes**
  useEffect(() => {
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          page: String(page),
          size: String(pageSize)
        }
      },
      undefined,
      { shallow: true }
    )
    setSelectedDocuments([])
  }, [page, pageSize])

  const openUploader = () => setShowUploader(true)

  const handleAddQuestions = async () => {
    const validQuestions = (Array.isArray(questionsDialogTexts) ? questionsDialogTexts : [questionsDialogTexts])
      .map(q => (typeof q === 'string' ? q.trim() : ''))
      .filter(q => q.length > 0)

    if (validQuestions.length === 0) {
      toast.error('No questions to save!')
      return
    }
    setIsSavingQuestions(true)
    try {
      const payloads = validQuestions.map((questionText, idx) => ({
        taskId,
        nodeType: 'QUESTION',
        nodeValue: { message: questionText, order: idx }
      }))

      // Send in batches of 10
      const batches = chunk(payloads, 10)
      for (const batch of batches) {
        await dispatch(
          createTaskNodesBatch({
            organizationId,
            projectId,
            taskNodesPayload: batch, // <-- array of up to 10
            token
          })
        ).unwrap()
      }
      // Refresh the question list after saving all
      await dispatch(
        fetchTaskNodesByCriteria({
          organizationId,
          projectId,
          taskId,
          criteria: { taskId, nodeTypeNames: ['QUESTION'] },
          token,
          page: 0,
          size: MAX_PAGE_SIZE
        })
      )
      setIsSavingQuestions(false)
      closeDialog()
      toast.success('Questions added!')
    } catch (error) {
      toast.error('Failed to save questions')
      console.error(error)
    }
  }

  const handleSelectDocument = (docId, checked) => {
    setSelectedDocuments(prev => (checked ? [...prev, docId] : prev.filter(id => id !== docId)))
  }

  const handleGenerateSelected = async () => {
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
  }

  const handleGenerateSingleAnswer = async (doc, question) => {
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
  }

  const handleGenerate = async ({ docs, questionsToGenerate, reGenerateExistingAnswers, isAll = false }) => {
    if (isAll) setIsGeneratingAll(true)

    try {
      const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]      

      const criteria = {
        taskId,
        documentNodeIds: docIds,        
        reGenerateExistingAnswers
      }

      const jobExecutionId = await dispatch(
        executeTaskByType({ organizationId, projectId, taskId, criteria, token })
      ).unwrap()

      toast.success(`Started generation for ${docIds.length} document(s)`)

      await pollJobStatus(jobExecutionId)

      const answerTaskNodePayload = {
        documentNodeIds: documents.map(d => d.id)        
      }

      dispatch(
        fetchAnswerTaskNodes({
          organizationId,
          projectId,
          taskId,
          answerTaskNodePayload,
          token,
          page: 0,
          size: MAX_PAGE_SIZE
        })
      )

      toast.success(`Generation completed for ${docIds.length} document(s)`)
      setSelectedDocuments([])
    } catch (error) {
      console.error('Failed to start generation:', error)
      toast.error('Failed to start generation')
    } finally {
      if (isAll) setIsGeneratingAll(false)
    }
  }

  const confirmDeleteQuestionOrDocumentNode = taskNodeId => {
    setDeleteNodeId(taskNodeId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteNodeId) return

    try {
      await dispatch(deleteTaskNode({ organizationId, projectId, taskNodeId: deleteNodeId, token })).unwrap()
      toast.success('Deleted successfully.')

      // Update local state
      setQuestions(prev => prev.filter(q => q.id !== deleteNodeId))
      setDocuments(prev => prev.filter(d => d.id !== deleteNodeId))

      // Refetch updated data
      dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token }))
    } catch (error) {
      toast.error('Failed to delete the node.')
      console.error('Delete node error:', error)
    } finally {
      setDeleteDialogOpen(false)
      setDeleteNodeId(null)
    }
  }

  const openAddDialog = () => {
    setActiveQuestion(null)
    setQuestionsDialogTexts([''])
    setShowDialog(true)
  }

  const openEditDialog = question => {
    setActiveQuestion(question)
    setQuestionsDialogTexts([question.text])
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setQuestionsDialogTexts([''])
    setActiveQuestion(null)
  }

  const handleExportCsv = async () => {
    if (documents.length === 0 || questions.length === 0) {
      toast.error('No documents or questions to export')
      return
    }
    setIsExportingCsv(true)
    try {
      const csvBlob = await taskService.exportTaskCsv(organizationId, projectId, taskId, token)
      downloadBlobForCSV(csvBlob, `${selectedTask?.title?.replace(/\s+/g, '_') || 'document_insights'}.csv`)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Failed to export CSV:', error)
      toast.error('Failed to export CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }

  return (
    <>
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <HeaderSection
          title={selectedTask?.title}
          description={selectedTask?.description}
          onAddQuestion={openAddDialog}
          openUploader={openUploader}
          onGenerate={reGenerateExistingAnswers =>
            handleGenerate({ docs: documents, reGenerateExistingAnswers: reGenerateExistingAnswers, isAll: true })
          }
          disableGenerateAll={documents.length === 0}
          isLoading={isLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={handleExportCsv}
          onGenerateSelected={handleGenerateSelected}
          selectedDocuments={selectedDocuments}
          isGeneratingAll={isGeneratingAll}
        />

        <Box
          sx={{
            minWidth: 800,
            filter: isLoading || isBlurring ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentDigitizationGrid
            documents={documents}
            answers={answers}
            onGenerate={docs => handleGenerate({ docs: docs, reGenerateExistingAnswers: true })}
            onDeleteQuestionOrDocumentNode={confirmDeleteQuestionOrDocumentNode}
            isLoadingAnswers={isLoadingAnswers}
            isLoading={isLoading}
            isBlurring={isBlurring}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            totalDocuments={totalDocuments}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onGenerateSingleAnswer={handleGenerateSingleAnswer}
            isGeneratingAll={isGeneratingAll}
            isGeneratingCells={isGeneratingCells}
          />
        </Box>
      </Paper>

      <Modal
        open={showUploader}
        onClose={() => setShowUploader(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ outline: 'none', p: 2, bgcolor: 'background.paper' }}>
          <DocumentsAddNewDialog
            open={showUploader}
            onClose={() => setShowUploader(false)}
            taskId={taskId}
            organizationId={organizationId}
            projectId={projectId}
            token={token}
            existingDocuments={documents}
          />
        </Box>
      </Modal>

      
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title='Confirm Deletion'
        contentText='Are you sure you want to delete these generated answers? This action cannot be undone.'
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </>
  )
}

export default DocumentDigitizationTable
