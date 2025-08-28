import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import taskService from 'src/gendox-sdk/taskService'
import { downloadBlobForCSV } from 'src/utils/tasks/downloadBlobForCSV'

export default function useExportFile({
  organizationId,
  projectId,
  taskId,
  token,
  selectedTask,
  documents
}) {
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const exportCsv = useCallback(async () => {
    if (!documents?.length) {
      toast.error('No documents to export')
      return
    }
    setIsExportingCsv(true)
    try {
      const csvBlob = await taskService.exportTaskCsv(organizationId, projectId, taskId, token)
      downloadBlobForCSV(
        csvBlob,
        `${selectedTask?.title?.replace(/\s+/g, '_') || 'document_insights'}.csv`
      )
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Failed to export CSV:', error)
      toast.error('Failed to export CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }, [organizationId, projectId, taskId, token, selectedTask, documents])

  const exportDocumentDigitizationCsv = useCallback(async (documentNodeId, documentName) => {
    if (!documentNodeId) {
      toast.error('No document selected for export')
      return
    }
    setIsExportingCsv(true)
    try {
      const csvBlob = await taskService.documentDigitizationExportCSV(organizationId, projectId, taskId, documentNodeId, token)
      const filename = `${documentName?.replace(/\s+/g, '_') || 'document_digitization'}.csv`
      downloadBlobForCSV(csvBlob, filename)
      toast.success('Document CSV exported successfully!')
    } catch (error) {
      console.error('Failed to export document CSV:', error)
      toast.error('Failed to export document CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }, [organizationId, projectId, taskId, token])

  return { exportCsv, exportDocumentDigitizationCsv, isExportingCsv }
}
