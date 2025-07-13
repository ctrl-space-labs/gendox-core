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
import DocumentInsightsGrid from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsGrid'
import HeaderSection from './table-components/HeaderSection'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import documentService from 'src/gendox-sdk/documentService'

const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList, isLoading, isLoadingAnswers } =
    useSelector(state => state.activeTask)

  const [documents, setDocuments] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteNodeId, setDeleteNodeId] = useState(null)
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

    const getDocumentIdsFromNodes = documentNodes => {
      return documentNodes.map(node => node.documentId).filter(id => id !== undefined && id !== null)
    }
    const documentIds = getDocumentIdsFromNodes(taskNodesDocumentList.content)

    fetchDocumentsByCriteria(organizationId, projectId, documentIds, token).then(fullDocuments => {
      if (!Array.isArray(fullDocuments)) {
        console.error('Expected an array but got:', fullDocuments)
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
  }, [taskNodesDocumentList, organizationId, projectId, token, dispatch, taskId])

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

  const fetchDocumentsByCriteria = async (organizationId, projectId, documentIds, token) => {
    if (!documentIds.length) return []

    const documentInstanceIds = documentIds.map(id => id.toString())

    const criteria = {
      organizationId,
      projectId,
      documentInstanceIds
    }

    try {
      const response = await documentService.findDocumentsByCriteria(organizationId, projectId, criteria, token)
      return response.data.content || []
    } catch (error) {
      console.error('Failed to fetch documents by criteria:', error)
      return []
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
        />

        <Box
          sx={{
            minWidth: 800,            
            filter: isLoading ? 'blur(6px)' : 'none',            
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
