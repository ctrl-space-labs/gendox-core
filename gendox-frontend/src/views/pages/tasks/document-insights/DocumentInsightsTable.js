import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Modal } from '@mui/material'
import Paper from '@mui/material/Paper'
import QuestionsDialog from './table-dialogs/QuestionsDialog'
import DocumentsDialog from './table-dialogs/DocumentsDialog'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import { useQuestionDialog } from 'src/utils/tasks/useQuestionDialog'
import { saveQuestion } from 'src/utils/tasks/taskUtils'
import {
  fetchTaskNodesByTaskId,
  executeTaskByType,
  deleteTaskNode,
  fetchTaskNodesByCriteria
} from 'src/store/activeTask/activeTask'
import { fetchDocumentsByCriteria } from 'src/store/activeDocument/activeDocument'
import DocumentInsightsGrid from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsGrid'
import HeaderSection from './table-components/HeaderSection'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'

const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList, isLoading, isLoadingAnswers } =
    useSelector(state => state.activeTask)
  const isBlurring = useSelector(state => state.activeDocument.isBlurring)

  const [documents, setDocuments] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteNodeId, setDeleteNodeId] = useState(null)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const { showDialog, questionText, setQuestionText, editingQuestion, openAddDialog, openEditDialog, closeDialog } =
    useQuestionDialog()

  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })

  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return

    dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['DOCUMENT'] },
        token
      })
    )
      .unwrap()
      .catch(error => {
        toast.error('Failed to load documents')
        console.error(error)
      })

    dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['QUESTION'] },
        token
      })
    )
      .unwrap()
      .catch(error => {
        toast.error('Failed to load questions')
        console.error(error)
      })
  }, [organizationId, projectId, taskId, token, dispatch])

  useEffect(() => {
    if (!taskNodesDocumentList?.content) return

    const documentIds = taskNodesDocumentList.content
      .map(node => node.documentId)
      .filter(id => id !== undefined && id !== null)

    console.log('Fetching documents for IDs:', documentIds)

    dispatch(fetchDocumentsByCriteria({ organizationId, projectId, documentIds, token }))
      .unwrap()
      .then(fullDocuments => {
        console.log('Fetched full documents:', fullDocuments)
        if (!Array.isArray(fullDocuments)) {
          console.error('Expected array but got:', fullDocuments)
          setDocuments(
            taskNodesDocumentList.content.map(node => ({
              id: node.id,
              documentId: node.documentId,
              name: 'Unknown Document'
            }))
          )
          return
        }

        setDocuments(
          taskNodesDocumentList.content.map(node => {
            const fullDoc = fullDocuments.find(d => d.id === node.documentId)
            return {
              id: node.id,
              documentId: node.documentId,
              name: fullDoc?.title || 'Unknown Document'
            }
          })
        )
      })
      .catch(error => {
        toast.error('Failed to load full document details')
        console.error(error)
      })
  }, [taskNodesDocumentList, organizationId, projectId, token, dispatch])

  useEffect(() => {
    if (!taskNodesQuestionList?.content) return
    setQuestions(
      taskNodesQuestionList.content.map(node => ({
        id: node.id,
        text: node.nodeValue?.message || '',
        order: node.nodeValue?.order || 0
      }))
    )
  }, [taskNodesQuestionList, taskId, organizationId, projectId, token, dispatch])

  useEffect(() => {
    if (!documents.length || !questions.length) return
    if (!(organizationId && projectId && taskId && token)) return

    dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['ANSWER'] },
        token
      })
    )
      .unwrap()
      .catch(error => {
        toast.error('Failed to load answers')
        console.error(error)
      })
  }, [documents, questions, organizationId, projectId, taskId, token, dispatch])

  useEffect(() => {
    if (!taskNodesAnswerList?.content) {
      setAnswers([])
      return
    }

    const answerNodes = taskNodesAnswerList.content
    setAnswers(
      answerNodes.map(node => ({
        id: node.id,
        documentNodeId: node.nodeValue?.nodeDocumentId || '',
        questionNodeId: node.nodeValue?.nodeQuestionId || '',
        message: node.nodeValue?.message || '',
        answerValue: node.nodeValue?.answerValue || '',
        answerFlagEnum: node.nodeValue?.answerFlagEnum || ''
      }))
    )
  }, [taskNodesAnswerList])

  const openUploader = () => setShowUploader(true)

  const handleAddQuestion = () => {
    saveQuestion({
      dispatch,
      organizationId,
      projectId,
      taskId,
      token,
      questionText,
      editingQuestion,
      closeDialog
    })
  }

  const handleGenerate = async (docs, reGenerateExistingAnswers) => {
    try {
      const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]

      const criteria = {
        taskId,
        documentNodeIds: docIds,
        questionNodeIds: questions.map(q => q.id),
        reGenerateExistingAnswers
      }
      console.log('Criteria for generation:', criteria)

      const jobExecutionId = await dispatch(
        executeTaskByType({ organizationId, projectId, taskId, criteria, token })
      ).unwrap()

      toast.success(`Started generation for ${docIds.length === 1 ? 'document ' + docs.name : 'all documents'}`)

      await pollJobStatus(jobExecutionId)
      dispatch(
        fetchTaskNodesByCriteria({
          organizationId,
          projectId,
          taskId,
          criteria: { taskId, nodeTypeNames: ['ANSWER'] },
          token
        })
      )
      toast.success(`Generation completed for ${docIds.length === 1 ? 'document ' + docs.name : 'all documents'}`)
    } catch (error) {
      console.error('Failed to start generation:', error)
      toast.error('Failed to start generation')
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

  const handleExportCsv = () => {
    if (documents.length === 0 || questions.length === 0) {
      toast.error('No documents or questions to export')
      return
    }

    setIsExportingCsv(true)

    try {
      // CSV header row: first column is "Document Name", then questions
      const headerRow = ['Document Name', ...questions.map(q => `"${q.text.replace(/"/g, '""')}"`)]

      // Each document forms a row
      const rows = documents.map(doc => {
        const row = [doc.name]

        // For each question, find the answer for this document-question pair
        questions.forEach(q => {
          const answerObj = answers.find(a => a.documentNodeId === doc.id && a.questionNodeId === q.id)

          const answerText = answerObj ? `${answerObj.answerValue || ''} - ${answerObj.message || ''}`.trim() : ''

          // Escape quotes by doubling them and wrap field in quotes
          row.push(`"${answerText.replace(/"/g, '""')}"`)
        })

        return row.join(',')
      })

      const csvContent = [headerRow.join(','), ...rows].join('\n')

      // Create a blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fileName = `${selectedTask?.title?.replace(/\s+/g, '_') || 'document_insights'}.csv`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

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
          onGenerate={reGenerateExistingAnswers => handleGenerate(documents, reGenerateExistingAnswers)}
          disableGenerateAll={documents.length === 0 || questions.length === 0}
          isLoading={isLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={handleExportCsv}
        />

        <Box
          sx={{
            minWidth: 800,
            filter: isLoading || isBlurring? 'blur(6px)' : 'none'
          }}
        >
          <DocumentInsightsGrid
            documents={documents}
            questions={questions}
            answers={answers}
            onGenerate={docs => handleGenerate(docs, true)}
            onDeleteQuestionOrDocumentNode={confirmDeleteQuestionOrDocumentNode}
            isLoadingAnswers={isLoadingAnswers}
            isLoading={isLoading}
            isBlurring={isBlurring}
          />
        </Box>
      </Paper>

      <Modal
        open={showUploader}
        onClose={() => setShowUploader(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ outline: 'none', p: 2, bgcolor: 'background.paper' }}>
          <DocumentsDialog
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

      <QuestionsDialog
        open={showDialog}
        onClose={closeDialog}
        questionText={questionText}
        setQuestionText={setQuestionText}
        onConfirm={handleAddQuestion}
        editing={!!editingQuestion}
      />
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

export default DocumentInsightsTable
