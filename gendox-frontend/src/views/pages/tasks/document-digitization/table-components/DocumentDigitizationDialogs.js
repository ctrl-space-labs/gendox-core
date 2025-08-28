import { useState } from 'react'
import { useDispatch } from 'react-redux'
import taskService from 'src/gendox-sdk/taskService'
import { deleteTaskNode } from 'src/store/activeTask/activeTask'
import DocumentDialog from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentDigitizationDocumentDialog'
import DocumentsAddNewDialog from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentDigitizationDocumentsAddNewDialog'
import AnswerDialog from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentDigitizationAnswerDialog'
import DocumentPagePreviewDialog from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentPagePreviewDialog'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'

const DocumentDigitizationDialogs = ({
  dialogs,
  activeNode,
  onClose,
  onOpen,
  refreshDocuments,
  taskId,
  organizationId,
  projectId,
  token,
  existingDocuments,
  setEditMode,
  editMode,
  documentPages = [],
  generateSingleDocument,
  onExportCsv,
  isExportingCsv
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  // SAVE document handler for DocumentDialog
  const handleUpdateDocument = async updatedDoc => {
    setLoading(true)
    try {
      await taskService.updateTaskNodeForDocumentDigitization(
        organizationId,
        projectId,
        taskId,
        {
          taskNodeId: updatedDoc.id,
          prompt: updatedDoc.prompt,
          structure: updatedDoc.structure
        },
        token
      )
      if (refreshDocuments) await refreshDocuments()
      onClose('docDetail')
    } finally {
      setLoading(false)
    }
  }

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
      onClose('delete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* New Document Dialog */}
      <DocumentsAddNewDialog
        open={dialogs.newDoc}
        onClose={() => onClose('newDoc')}
        existingDocuments={existingDocuments}
        loading={loading}
        onConfirm={handleAddNewDocuments}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        taskId={taskId}
      />

      {/* Document Details Dialog */}
      <DocumentDialog
        open={dialogs.docDetail}
        document={activeNode}
        onClose={() => onClose('docDetail')}
        onSave={handleUpdateDocument}
        loading={loading}
        editMode={editMode}
        setEditMode={setEditMode}
      />

      {/* Answer Details Dialog */}
      {/* <AnswerDialog
        open={dialogs.answerDetail}
        answer={activeNode}
        onClose={() => onClose('answerDetail')}
        refreshAnswers={refreshAnswers}
      /> */}

      {/* Document Page Preview Dialog */}
      <DocumentPagePreviewDialog
        open={dialogs.pagePreview || false}
        onClose={() => onClose('pagePreview')}
        document={activeNode}
        documentPages={documentPages}
        generateSingleDocument={generateSingleDocument}
        onDocumentUpdate={(updatedDoc) => {
          // Refresh documents to show updated data
          if (refreshDocuments) refreshDocuments()
        }}
        onExportCsv={onExportCsv}
        isExportingCsv={isExportingCsv}
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
      />
    </>
  )
}

export default DocumentDigitizationDialogs
