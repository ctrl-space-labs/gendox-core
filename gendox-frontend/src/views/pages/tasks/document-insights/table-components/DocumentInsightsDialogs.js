import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { deleteTaskNode, createTaskNodesBatch } from 'src/store/activeTaskNode/activeTaskNode'
import { chunk, runWithConcurrency, fetchAllPages } from 'src/utils/tasks/taskUtils'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { toast } from 'react-hot-toast'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import AddNewDocumentDialog from 'src/views/pages/tasks/helping-components/AddNewDocumentDialog'
import AnswerDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsAnswerDialog'
import QuestionsDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsQuestionsDialog'
import DocumentPagePreviewDialog from '../table-dialogs/DocumentInsightsDocumentPagePreviewDialog'
import SummaryDialog from 'src/views/pages/tasks/document-insights/table-dialogs/DocumentInsightsSummaryDialog'

const TASK_NODE_CONCURRENCY = 4 // no batch endpoint for deletes, so keep requests in flight
const ADD_BATCH_SIZE = 20

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
  // The `documents` prop is only the main table's current page, so the picker needs
  // every DOCUMENT node of the task to know what is already in it and what to remove.
  const [taskDocumentNodes, setTaskDocumentNodes] = useState([])
  const [isLoadingTaskDocuments, setIsLoadingTaskDocuments] = useState(false)

  useEffect(() => {
    if (!dialogs.newDoc || !organizationId || !projectId || !taskId) return

    const loadAllTaskDocumentNodes = async () => {
      setIsLoadingTaskDocuments(true)
      try {
        const nodes = await fetchAllPages((page, size) =>
          taskService
            .getTaskNodesByCriteria(
              organizationId,
              projectId,
              taskId,
              { taskId, nodeTypeNames: ['DOCUMENT'] },
              token,
              page,
              size
            )
            .then(response => response.data)
        )
        setTaskDocumentNodes(nodes)
      } catch (error) {
        toast.error(`Failed to load the task's documents. Error: ${getErrorMessage(error)}`)
      } finally {
        setIsLoadingTaskDocuments(false)
      }
    }

    loadAllTaskDocumentNodes()
  }, [dialogs.newDoc, organizationId, projectId, taskId, token])

  const taskDocumentIds = useMemo(() => taskDocumentNodes.map(node => node.documentId), [taskDocumentNodes])

  // ADD NEW documents, in batches of ADD_BATCH_SIZE, TASK_NODE_CONCURRENCY batches at a time
  const handleAddNewDocuments = async (selectedDocIds, onProgress) => {
    setLoading(true)
    try {
      const payloads = selectedDocIds.map(docId => ({
        taskId,
        nodeType: 'DOCUMENT',
        documentId: docId
      }))

      await runWithConcurrency(
        chunk(payloads, ADD_BATCH_SIZE),
        TASK_NODE_CONCURRENCY,
        batch =>
          dispatch(
            createTaskNodesBatch({
              organizationId,
              projectId,
              taskNodesPayload: batch,
              token
            })
          ).unwrap(),
        { onProgress, weight: batch => batch.length }
      )

      reloadAll()
      onClose('newDoc')
    } catch (error) {
      toast.error('Failed to add documents')
    } finally {
      setLoading(false)
    }
  }

  // REMOVE documents straight from the picker (also deletes their answers)
  const handleRemoveDocuments = async (removedDocIds, onProgress) => {
    const removedIds = new Set(removedDocIds)
    const nodeIds = taskDocumentNodes.filter(node => removedIds.has(node.documentId)).map(node => node.id)

    await runWithConcurrency(
      nodeIds,
      TASK_NODE_CONCURRENCY,
      nodeId => dispatch(deleteTaskNode({ organizationId, projectId, taskNodeId: nodeId, token })).unwrap(),
      { onProgress }
    )
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
        existingDocumentIds={taskDocumentIds}
        loading={loading || isLoadingTaskDocuments}
        onConfirm={handleAddNewDocuments}
        onRemove={handleRemoveDocuments}
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
