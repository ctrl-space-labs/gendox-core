import { useState } from 'react'
import { useDispatch } from 'react-redux'
import taskService from 'src/gendox-sdk/taskService'
import { deleteTaskNode, createTaskNodesBatch } from 'src/store/activeTask/activeTask'
import { chunk } from 'src/utils/tasks/taskUtils'
import { toast } from 'react-hot-toast'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import DocumentAddNewDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsDocumentAddNewDialog'
import AnswerDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsAnswerDialog'
import QuestionsDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsQuestionsDialog'

const DocumentInsightsDialogs = ({
  dialogs,
  activeNode,
  onClose,
  refreshDocuments,
  refreshQuestions,
  refreshAnswers,
  taskId,
  organizationId,
  projectId,
  token,
  documents,
  questions,
  editMode
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [questionsDialogTexts, setQuestionsDialogTexts] = useState([''])

  // ADD NEW documents handler for DocumentsAddNewDialog
  const handleAddNewDocuments = async selectedDocIds => {
    setLoading(true)
    try {
      for (const docId of selectedDocIds) {
        const taskNodePayload = {
          taskId,
          nodeType: 'DOCUMENT',
          documentId: docId
        }
        await taskService.createTaskNode(organizationId, projectId, taskNodePayload, token)
      }
      if (refreshDocuments) await refreshDocuments()
      onClose('newDoc')
    } finally {
      setLoading(false)
    }
  }

  // DELETE handler for DeleteConfirmDialog
  const handleConfirmDelete = async nodeId => {
    setLoading(true)
    try {
      await dispatch(deleteTaskNode({ organizationId, projectId, taskNodeId: nodeId, token })).unwrap()
      if (refreshDocuments) await refreshDocuments()
      if (refreshQuestions) await refreshQuestions()
      onClose('delete')
    } finally {
      setLoading(false)
    }
  }

  // save questions handler for QuestionsDialog
  const handleAddQuestions = async () => {
    const validQuestions = (Array.isArray(questionsDialogTexts) ? questionsDialogTexts : [questionsDialogTexts])
      .map(q => (typeof q === 'string' ? q.trim() : ''))
      .filter(q => q.length > 0)

    if (validQuestions.length === 0) {
      toast.error('No questions to save!')
      return
    }
    setLoading(true)
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
      if (refreshQuestions) await refreshQuestions()
      setLoading(false)
      setQuestionsDialogTexts(['']) // Reset the input field
      onClose('questionDetail')
      toast.success('Questions added!')
    } catch (error) {
      toast.error('Failed to save questions')
      console.error(error)
    }
  }

  return (
    <>
      {/* New Document Dialog */}
      <DocumentAddNewDialog
        open={dialogs.newDoc}
        onClose={() => onClose('newDoc')}
        existingDocuments={documents}
        loading={loading}
        onConfirm={handleAddNewDocuments}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        taskId={taskId}
      />

      {/* Answer Details Dialog */}
      <AnswerDialog
        open={dialogs.answerDetail}
        answer={activeNode}
        onClose={() => onClose('answerDetail')}
        refreshAnswers={refreshAnswers}
        questions={questions}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={dialogs.delete}
        onClose={() => onClose('delete')}
        onConfirm={() => handleConfirmDelete(activeNode?.id)}
        title='Confirm Deletion'
        contentText='Are you sure you want to delete this item? This action cannot be undone.'
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />

      {/* Question Dialog */}
      <QuestionsDialog
        open={dialogs.questionDetail}
        onClose={() => onClose('questionDetail')}
        questions={questionsDialogTexts}
        setQuestions={setQuestionsDialogTexts}
        onConfirm={handleAddQuestions}
        activeQuestion={activeNode}
        isSaving={loading}
        editMode={editMode}
      />
    </>
  )
}

export default DocumentInsightsDialogs
