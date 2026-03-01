import { useState } from 'react'
import { useDispatch } from 'react-redux'
import taskService from 'src/gendox-sdk/taskService'
import { deleteTaskNode, updateTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import DocumentDialog from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentDigitizationDocumentDialog'
import DocumentsAddNewDialog from 'src/views/pages/tasks/helping-components/AddNewDocumentDialog'
import DocumentPagePreviewDialog from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentDigitizationDocumentPagePreviewDialog'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { toast } from 'sonner'

interface DocumentNode {
  id: string
  documentId?: string
  name?: string
  prompt?: string
  structure?: string
}

interface Dialogs {
  newDoc: boolean
  delete: boolean
  docDetail: boolean
  answerDetail: boolean
  pagePreview: boolean
}

interface DocumentDigitizationDialogsProps {
  dialogs: Dialogs
  activeNode: DocumentNode | null
  onClose: (dialogType: string) => void
  onOpen?: (dialogType: string, node?: DocumentNode | null) => void
  reloadAll: () => Promise<void> | void
  taskId: string | string[] | undefined
  organizationId: string | string[] | undefined
  projectId: string | string[] | undefined
  token: string | null
  existingDocuments: DocumentNode[]
  setEditMode: (mode: boolean) => void
  editMode: boolean
  documentPages: any[]
  handleGenerate: (params: any) => void
  onExportCsv: (docId?: string, docName?: string) => void
  isExportingCsv: boolean
  isDocumentGenerating: (id: string) => boolean
  isDigitizationGenerating?: boolean
}

const DocumentDigitizationDialogs = ({
  dialogs,
  activeNode,
  onClose,
  onOpen,
  reloadAll,
  taskId,
  organizationId,
  projectId,
  token,
  existingDocuments,
  setEditMode,
  editMode,
  documentPages = [],
  handleGenerate,
  onExportCsv,
  isExportingCsv,
  isDocumentGenerating,
  isDigitizationGenerating = false
}: DocumentDigitizationDialogsProps) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const isGenRunningForActiveDoc = activeNode?.id ? isDocumentGenerating?.(activeNode.id) : false
  const dialogLoading = Boolean(loading || isDigitizationGenerating || isGenRunningForActiveDoc)

  // SAVE document handler for DocumentDialog
  const handleUpdateDocument = async (updatedDoc: any) => {
    setLoading(true)
    const payload = {
      id: updatedDoc.id,
      taskId,
      nodeType: 'DOCUMENT',
      nodeValue: {
        documentMetadata: {
          taskNodeId: updatedDoc.id,
          prompt: updatedDoc.prompt,
          structure: updatedDoc.structure
        }
      }
    }
    try {
      await (dispatch as any)(
        (updateTaskNode as any)({ organizationId, projectId, taskId, taskNodePayload: payload, token })
      ).unwrap()
      reloadAll()
      onClose('docDetail')
    } finally {
      setLoading(false)
    }
  }

  // ADD NEW documents handler for DocumentsAddNewDialog
  const handleAddNewDocuments = async (selectedDocIds: string[]) => {
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
      reloadAll()
      onClose('newDoc')
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
      <DocumentsAddNewDialog
        open={dialogs.newDoc}
        onClose={() => onClose('newDoc')}
        existingDocumentIds={existingDocuments.map((d: any) => d.documentId)}
        loading={loading}
        onConfirm={handleAddNewDocuments}
        organizationId={organizationId as string}
        projectId={projectId as string}
        token={token}
        taskId={taskId as string}
        onUploadSuccess={() => {
          reloadAll()
        }}
        taskType="document-digitization"
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

      {/* Document Page Preview Dialog */}
      <DocumentPagePreviewDialog
        open={dialogs.pagePreview || false}
        onClose={() => onClose('pagePreview')}
        document={activeNode}
        documentPages={documentPages}
        handleGenerate={handleGenerate}
        reloadAll={reloadAll}
        dialogLoading={dialogLoading}
        onExportCsv={onExportCsv}
        isExportingCsv={isExportingCsv}
        onDelete={() => onOpen && onOpen('delete', activeNode)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={dialogs.delete}
        onClose={() => onClose('delete')}
        onConfirm={() => handleConfirmDelete(activeNode?.id || '')}
        title="Confirm Removal"
        contentText="Are you sure you want to remove this item? This action cannot be undone."
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
      />
    </>
  )
}

export default DocumentDigitizationDialogs
