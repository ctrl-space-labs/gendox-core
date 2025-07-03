import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Typography, Stack, Modal } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Paper from '@mui/material/Paper'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DocumentRows from './table-components/DocumentRows'
import QuestionsHeader from './table-components/QuestionsHeader'
import AddEditQuestionDialog from './table-dialogs/AddEditQuestionDialog'
import UploaderDocumentInsights from './table-dialogs/UploaderDocumentInsigths'

import {
  fetchTaskNodesByTaskId,
  fetchTaskEdgesByCriteria,
  createTaskNode,
  updateTaskNode
} from 'src/store/activeTask/activeTask'

const DocumentInsightsTable = ({ selectedTask, organizationId }) => {
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const projectId = selectedTask?.projectId || null
  const taskId = selectedTask?.id || null

  const { taskNodesList, taskEdgesList } = useSelector(state => state.activeTask)

  const [documents, setDocuments] = useState([])
  const [questions, setQuestions] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)


  useEffect(() => {
    if (organizationId && projectId && taskId && token) {
      dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token }))
    }
  }, [organizationId, projectId, taskId, token, dispatch])

  useEffect(() => {
    if (taskNodesList && taskNodesList.content && taskNodesList.content.length > 0) {
      const documentNodes = taskNodesList.content.filter(node => node.nodeType.name === 'DOCUMENT')
      const questionNodes = taskNodesList.content.filter(node => node.nodeType.name === 'QUESTION')

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
      // Prepare toNodeIds = documentNodeIds + questionNodeIds
      const toNodeIds = [...documentNodes.map(node => node.id), ...questionNodes.map(node => node.id)]
      if (toNodeIds.length > 0) {
        // Dispatch to fetch TaskEdges with relationType "ANSWERS" and these toNodeIds
        dispatch(
          fetchTaskEdgesByCriteria({
            organizationId,
            projectId,
            criteria: {
              relationType: 'ANSWERS',
              toNodeIds
            },
            token
          })
        )
      }
    } else {
      setDocuments([])
      setQuestions([])
    }
  }, [taskNodesList, dispatch, organizationId, selectedTask, token])



  const handleAddDocument = () => {
    setDocuments(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        answers: questions.map(() => ''),
        documentId: null
      }
    ])
  }

  const openAddQuestionDialog = () => {
    setEditingQuestion(null)
    setNewQuestionText('')
    setShowAddQuestionDialog(true)
  }

  const openUploader = () => setShowUploader(true)

  const openEditQuestionDialog = question => {
    setEditingQuestion({ id: question.id, text: question.text })
    setNewQuestionText(question.text)
    setShowAddQuestionDialog(true)
  }

  const closeAddQuestionDialog = () => {
    setShowAddQuestionDialog(false)
    setNewQuestionText('')
    setEditingQuestion(null)
  }

  const handleAddOrEditQuestionConfirm = async () => {
    if (!newQuestionText.trim()) return

    try {
      const nodeValuePayload = {
        message: newQuestionText.trim()
      }
      if (editingQuestion) {
        const updatedPayload = {
          id: editingQuestion.id,
          taskId,
          nodeType: 'QUESTION',
          nodeValue: nodeValuePayload
        }
        await dispatch(updateTaskNode({ organizationId, projectId, taskNodePayload: updatedPayload, token })).unwrap()
      } else {
        const newPayload = {
          taskId,
          nodeType: 'QUESTION',
          nodeValue: nodeValuePayload
        }
        await dispatch(createTaskNode({ organizationId, projectId, taskNodePayload: newPayload, token })).unwrap()
      }
      await dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token }))
      closeAddQuestionDialog()
    } catch (error) {
      console.error('Failed to add/edit question node:', error)
    }
  }

  return (
    <>
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', gap: 1 }}>
            <Icon icon='mdi:clipboard-check-outline' fontSize='1.5rem' />
            <Typography variant='h6' fontWeight={600}>
              {selectedTask?.title || 'Document Insights'}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              px: 2,
              py: 1,
              boxShadow: 1,
              fontSize: '1rem',
              color: 'text.primary',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}
            title={selectedTask?.description || 'Analyze and manage your document insights'}
          >
            {selectedTask?.description || 'Analyze and manage your document insights'}
          </Box>

          <Stack direction='row' spacing={2} justifyContent='flex-end' sx={{ mb: 2 }}>
            <Button variant='outlined' startIcon={<AddIcon />} onClick={handleAddDocument}>
              Add Document
            </Button>
            <Button variant='outlined' startIcon={<AddIcon />} onClick={openAddQuestionDialog}>
              Add QUESTION
            </Button>
          </Stack>
        </Box>

        <Box sx={{ minWidth: 800 }}>
          <QuestionsHeader
            questions={questions}
            openEditQuestionDialog={openEditQuestionDialog}
            generateAnswers={() => {}}
          />
          <DocumentRows
            documents={documents}
            questions={questions}
            onAnswerChange={(docIdx, qIdx, value) => {
              setDocuments(prev => {
                const updated = [...prev]
                updated[docIdx].answers[qIdx] = value
                return updated
              })
            }}
            openUploader={openUploader}
            taskEdgesList={taskEdgesList}
          />
        </Box>
      </Paper>

      <Modal
        open={showUploader}
        onClose={() => setShowUploader(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ outline: 'none', p: 2, bgcolor: 'background.paper' }}>
          <UploaderDocumentInsights closeUploader={() => setShowUploader(false)} taskId={taskId} />
        </Box>
      </Modal>

      <AddEditQuestionDialog
        open={showAddQuestionDialog}
        onClose={closeAddQuestionDialog}
        questionText={newQuestionText}
        setQuestionText={setNewQuestionText}
        onConfirm={handleAddOrEditQuestionConfirm}
        editing={!!editingQuestion}
      />
    </>
  )
}

export default DocumentInsightsTable
