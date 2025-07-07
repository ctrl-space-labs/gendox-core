import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Modal } from '@mui/material'
import Paper from '@mui/material/Paper'
import AddEditQuestionDialog from './table-dialogs/AddEditQuestionDialog'
import UploaderDocumentInsights from './table-dialogs/UploaderDocumentInsigths'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import { useQuestionDialog } from 'src/utils/tasks/useQuestionDialog'
import { saveQuestion, refreshAnswers } from 'src/utils/tasks/taskUtils'
import { fetchTaskNodesByTaskId, fetchTaskEdgesByCriteria, executeTaskByType } from 'src/store/activeTask/activeTask'
import DocumentInsightsGrid from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsAnswerGrid'
import HeaderSection from './table-components/HeaderSection'

const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query

  const { taskNodesList, taskEdgesList, isLoading } = useSelector(state => state.activeTask)

  const [documents, setDocuments] = useState([])
  const [questions, setQuestions] = useState([])
  const [showUploader, setShowUploader] = useState(false)

  const { showDialog, questionText, setQuestionText, editingQuestion, openAddDialog, openEditDialog, closeDialog } =
    useQuestionDialog()

  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })

  useEffect(() => {
    if (organizationId && projectId && taskId && token) {
      dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token }))
    }
  }, [organizationId, projectId, taskId, token, dispatch])

  useEffect(() => {
    if (taskNodesList?.content?.length) {
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
  }, [taskNodesList])

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

  const openUploader = () => setShowUploader(true)

  const handleAddOrEditQuestionConfirm = () => {
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

      await refreshAnswers({ dispatch, organizationId, projectId, documents, questions, token })

      toast.success(`Generation completed for ${docIds.length === 1 ? 'document ' + docs.name : 'all documents'}`)
    } catch (error) {
      console.error('Failed to start generation:', error)
      toast.error('Failed to start generation')
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
        />

        <Box sx={{ minWidth: 800 }}>
          <DocumentInsightsGrid
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
            onGenerate={handleGenerate}
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
          <UploaderDocumentInsights closeUploader={() => setShowUploader(false)} taskId={taskId} />
        </Box>
      </Modal>

      <AddEditQuestionDialog
        open={showDialog}
        onClose={closeDialog}
        questionText={questionText}
        setQuestionText={setQuestionText}
        onConfirm={handleAddOrEditQuestionConfirm}
        editing={!!editingQuestion}
        
      />
    </>
  )
}

export default DocumentInsightsTable
