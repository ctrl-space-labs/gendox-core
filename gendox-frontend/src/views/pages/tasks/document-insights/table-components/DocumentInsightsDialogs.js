import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { deleteTaskNode, createTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { toast } from 'react-hot-toast'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import AddNewDocumentDialog from 'src/views/pages/tasks/helping-components/AddNewDocumentDialog'
import AnswerDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsAnswerDialog'
import QuestionsDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsQuestionsDialog'
import DocumentPagePreviewDialog from '../table-dialogs/DocumentInsightsDocumentPagePreviewDialog'
import SummaryDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsSummaryDialog'

const DocumentInsightsDialogs = ({
  dialogs,
  activeNode,
  onClose,
  onOpen,
  taskId,
  organizationId,
  projectId,
  token,
  documents,
  questions,
  addQuestionMode,
  reloadAll,
  isExportingCsv,
  onExportCsv,
  handleGenerate
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

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

      reloadAll()
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
      reloadAll()
      onClose('delete')
    } catch (error) {
      toast.error('Failed to delete item')
    } finally {
      onClose('delete')
      setLoading(false)
    }
  }

  return (
    <>
      {/* New Document Dialog */}
      <AddNewDocumentDialog
        open={dialogs.newDoc}
        onClose={() => onClose('newDoc')}
        existingDocumentIds={documents.map(d => d.documentId)}
        loading={loading}
        onConfirm={handleAddNewDocuments}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        taskId={taskId}
        onUploadSuccess={() => {
          reloadAll()
        }}
        taskType='document-insights'
      />

      {/* Answer Details Dialog */}
      <AnswerDialog
        open={dialogs.answerDetail}
        answer={activeNode}
        onClose={() => onClose('answerDetail')}
        refreshAnswers={reloadAll}
        questions={questions}
      />

      {/* Summary Details Dialog */}
      <SummaryDialog
        open={dialogs.summaryDetail}
        onClose={() => onClose('summaryDetail')}
        activeDocument={activeNode}
      />

      {/* Document Page Preview Dialog */}
      <DocumentPagePreviewDialog
        open={dialogs.pagePreview || false}
        onClose={() => onClose('pagePreview')}
        activeDocument={activeNode}
        loading={loading}
        isExportingCsv={isExportingCsv}
        onExportCsv={onExportCsv}
        onDelete={() => onOpen && onOpen('delete', activeNode)}
        reloadAll={reloadAll}
        handleGenerate={handleGenerate}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={dialogs.delete}
        onClose={() => onClose('delete')}
        onConfirm={() => handleConfirmDelete(activeNode?.id)}
        title='Confirm Removal'
        contentText='Are you sure you want to remove this item? This action cannot be undone.'
        confirmButtonText='Remove'
        cancelButtonText='Cancel'
        disableConfirm={loading}
      />

      {/* Question Dialog */}
      <QuestionsDialog
        open={dialogs.questionDetail}
        onClose={() => onClose('questionDetail')}
        activeQuestion={activeNode}
        isAddQuestionsLoading={loading}
        addQuestionMode={addQuestionMode}
        reloadAll={reloadAll}
      />
    </>
  )
}

export default DocumentInsightsDialogs
