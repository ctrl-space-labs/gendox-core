import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { deleteTaskNode, createTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { toast } from 'sonner'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import AddNewDocumentDialog from 'src/views/pages/tasks/helping-components/AddNewDocumentDialog'
import AnswerDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsAnswerDialog'
import QuestionsDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsQuestionsDialog'
import DocumentPagePreviewDialog from '../table-dialogs/DocumentInsightsDocumentPagePreviewDialog'
import SummaryDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsSummaryDialog'

interface DocumentInsightsDialogsProps {
  dialogs: {
    newDoc: boolean
    delete: boolean
    answerDetail: boolean
    summaryDetail: boolean
    questionDetail: boolean
    pagePreview: boolean
  }
  activeNode: any
  onClose: (dialogType: string) => void
  onOpen: (dialogType: string, node?: any) => void
  taskId: string
  organizationId: string
  projectId: string
  token: string | null
  documents: any[]
  questions: any[]
  addQuestionMode: boolean
  reloadAll: () => Promise<void> | void
  isExportingCsv: boolean
  onExportCsv: (docNodeId?: string, docName?: string) => void
  handleGenerate: (params: any) => void
}

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
}: DocumentInsightsDialogsProps) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  // ADD NEW documents
  const handleAddNewDocuments = async (selectedDocIds: string[]) => {
    setLoading(true)
    try {
      for (const docId of selectedDocIds) {
        const payload = {
          taskId,
          nodeType: 'DOCUMENT',
          documentId: docId
        }

        await (dispatch as any)(
          (createTaskNode as any)({
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
  const handleConfirmDelete = async (nodeId: string) => {
    setLoading(true)
    try {
      await (dispatch as any)(
        (deleteTaskNode as any)({ organizationId, projectId, taskNodeId: nodeId, token })
      ).unwrap()
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
        existingDocumentIds={documents.map((d: any) => d.documentId)}
        loading={loading}
        onConfirm={handleAddNewDocuments}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        taskId={taskId}
        onUploadSuccess={() => {
          reloadAll()
        }}
        taskType="document-insights"
      />

      {/* Answer Details Dialog */}
      <AnswerDialog
        open={dialogs.answerDetail}
        answer={activeNode}
        onClose={() => onClose('answerDetail')}
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
        title="Confirm Removal"
        contentText="Are you sure you want to remove this item? This action cannot be undone."
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
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
