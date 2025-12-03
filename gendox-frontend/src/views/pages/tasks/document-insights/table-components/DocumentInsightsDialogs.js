import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  deleteTaskNode,
  createTaskNode,
  createTaskNodesBatch,
  updateTaskNode
} from 'src/store/activeTaskNode/activeTaskNode'
import { chunk } from 'src/utils/tasks/taskUtils'
import { toast } from 'react-hot-toast'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import DocumentAddNewDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsDocumentAddNewDialog'
import AnswerDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsAnswerDialog'
import QuestionsDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsQuestionsDialog'
import DocumentPagePreviewDialog from '../table-dialogs/DocumentInsightsDocumentPagePreviewDialog'

const DocumentInsightsDialogs = ({
  dialogs,
  activeNode,
  onClose,
  onOpen,
  refreshDocuments,
  refreshQuestions,
  refreshAnswers,
  taskId,
  organizationId,
  projectId,
  token,
  documents,
  documentPages = [],
  questions,
  addQuestionMode
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [questionsDialogTexts, setQuestionsDialogTexts] = useState([''])

  // ADD NEW documents
  const handleAddNewDocuments = async selectedDocIds => {
    setLoading(true)
    try {
      for (const docId of selectedDocIds) {
        const payload = {
          taskId,
          nodeType: 'DOCUMENT',
          documentId: docId
        }

        await dispatch(
          createTaskNode({
            organizationId,
            projectId,
            taskNodePayload: payload,
            token
          })
        ).unwrap()
      }

      if (refreshDocuments) await refreshDocuments()
      onClose('newDoc')
    } catch (error) {
      toast.error('Failed to add documents')
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

  const handleUpdateQuestion = async newText => {
    if (!activeNode?.id) {
      return
    }

    newText = newText.trim()
    if (!newText) {
      toast.error('Question text cannot be empty')
      return
    }

    setLoading(true)

    const taskNodePayload = {
      id: activeNode.id,
      taskId,
      nodeType: 'QUESTION',
      nodeValue: {
        message: newText,
        order: activeNode.order
      }
    }

    try {
      await dispatch(
        updateTaskNode({
          organizationId,
          projectId,
          taskNodePayload,
          token
        })
      ).unwrap()

      toast.success('Question updated!')
      if (refreshQuestions) await refreshQuestions()

      onClose('questionDetail')
    } catch (error) {
      toast.error('Failed to update question')
      console.error(error)
    } finally {
      setLoading(false)
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

      {/* Document Page Preview Dialog */}
      <DocumentPagePreviewDialog
        open={dialogs.pagePreview || false}
        onClose={() => onClose('pagePreview')}
        document={activeNode}
        documentPages={documentPages}
        //generateSingleDocument={generateSingleDocument}
        onDocumentUpdate={updatedDoc => {
          // Refresh documents to show updated data
          if (refreshDocuments) refreshDocuments()
        }}
        //dialogLoading={dialogLoading}
        //onExportCsv={onExportCsv}
        //isExportingCsv={isExportingCsv}
        onDelete={() => onOpen && onOpen('delete', activeNode)}
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
        disableConfirm={loading}
      />

      {/* Question Dialog */}
      <QuestionsDialog
        open={dialogs.questionDetail}
        onClose={() => onClose('questionDetail')}
        questions={questionsDialogTexts}
        setQuestions={setQuestionsDialogTexts}
        onConfirm={handleAddQuestions}
        handleUpdateQuestion={handleUpdateQuestion}
        activeQuestion={activeNode}
        isSaving={loading}
        addQuestionMode={addQuestionMode}
      />
    </>
  )
}

export default DocumentInsightsDialogs
