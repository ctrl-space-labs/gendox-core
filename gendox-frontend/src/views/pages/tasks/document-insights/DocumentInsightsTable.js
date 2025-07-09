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


const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocQuestionList, taskNodesAnswerList, isLoading, isLoadingAnswers } = useSelector(state => state.activeTask)
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
        criteria: { taskId, nodeTypeNames: ['DOCUMENT', 'QUESTION'] },
        token
      })
    )
      .unwrap()
      .catch(error => {
        toast.error('Failed to load documents and questions')
        console.error(error)
      })
  }, [organizationId, projectId, taskId, token, dispatch])

  

  useEffect(() => {
    if (!taskNodesDocQuestionList?.content) return

    const documentNodes = taskNodesDocQuestionList.content.filter(node => node.nodeType.name === 'DOCUMENT')
    const questionNodes = taskNodesDocQuestionList.content.filter(node => node.nodeType.name === 'QUESTION')

    setDocuments(
      documentNodes.map(node => ({
        id: node.id,
        documentId: node.document?.id,
        name: node.document?.title || 'Unknown Document',
        answers: []
      }))
    )
    setQuestions(
      questionNodes.map(node => ({
        id: node.id,
        text: node.nodeValue?.message || ''
      }))
    )
  }, [taskNodesDocQuestionList])

 

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
        documentNodeId: node.nodeValue?.documentId || '',
        questionNodeId: node.nodeValue?.questionId || '',
        message: node.nodeValue?.message || '',
        answerValue: node.nodeValue?.answerValue || '',
        answerFlagEnum: node.nodeValue?.answerFlagEnum || ''
      }))
    )
  }, [taskNodesAnswerList])

  

  const handleAddDocument = () => {
    setDocuments(prev => [
      ...prev,
      {
        id: '',
        name: '',
        answers: questions.map(() => ''),
        documentId: null
      }
    ])
  }

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

  const handleGenerate = async docs => {
    try {
      const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]

      const criteria = {
        taskId,
        documentNodeIds: docIds,
        questionNodeIds: questions.map(q => q.id)
      }
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

  return (
    <>
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <HeaderSection
          title={selectedTask?.title}
          description={selectedTask?.description}
          onAddDocument={handleAddDocument}
          onAddQuestion={openAddDialog}
          onGenerateAll={() => handleGenerate(documents)}
          disableGenerateAll={documents.length === 0 || questions.length === 0}
          isLoading={isLoading}
        />

        <Box sx={{ minWidth: 800 }}>
          <DocumentInsightsGrid
            documents={documents}
            questions={questions}
            answers={answers}
            onAnswerChange={(docIdx, qIdx, value) => {
              setDocuments(prev => {
                const updated = [...prev]
                updated[docIdx].answers[qIdx] = value
                return updated
              })
            }}
            openUploader={openUploader}
            onGenerate={handleGenerate}
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
