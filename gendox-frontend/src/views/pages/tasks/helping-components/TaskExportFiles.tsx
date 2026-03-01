import { useState, useCallback } from "react"
import { toast } from "sonner"
import taskService from "src/gendox-sdk/taskService"
import { downloadBlobForCSV } from "src/utils/tasks/downloadBlobForCSV"

interface UseExportFileParams {
  organizationId: string
  projectId: string
  taskId: string
  token: string
  selectedTask: any
  documents: any[]
}

export default function useExportFile({
  organizationId,
  projectId,
  taskId,
  token,
  selectedTask,
  documents,
}: UseExportFileParams) {
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const exportDocumentInsightCsv = useCallback(async () => {
    if (!documents?.length) {
      toast.error("No documents to export")
      return
    }
    setIsExportingCsv(true)
    try {
      const csvBlob = await taskService.documentInsightsExportAllCSV(
        organizationId,
        projectId,
        taskId,
        token
      )

      downloadBlobForCSV(
        csvBlob,
        `${selectedTask?.title?.replace(/\s+/g, "_") || "document_insights"}.csv`
      )

      toast.success("CSV exported successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to export CSV")
    } finally {
      setIsExportingCsv(false)
    }
  }, [organizationId, projectId, taskId, token, selectedTask, documents])

  const exportSingleDocumentInsightCsv = useCallback(
    async (documentNodeId: string, documentName: string) => {
      if (!documentNodeId) return toast.error("No document selected")

      setIsExportingCsv(true)

      try {
        const csvBlob = await taskService.documentInsightsExportCSV(
          organizationId,
          projectId,
          taskId,
          documentNodeId,
          token
        )

        downloadBlobForCSV(
          csvBlob,
          `${documentName?.replace(/\s+/g, "_") || "single_insight"}.csv`
        )

        toast.success("Document exported!")
      } catch (error) {
        console.error(error)
        toast.error("Failed to export document CSV")
      } finally {
        setIsExportingCsv(false)
      }
    },
    [organizationId, projectId, taskId, token]
  )

  const exportDocumentDigitizationCsv = useCallback(
    async (documentNodeId: string, documentName: string) => {
      if (!documentNodeId) {
        toast.error("No document selected for export")
        return
      }
      setIsExportingCsv(true)
      try {
        const csvBlob = await taskService.documentDigitizationExportCSV(
          organizationId,
          projectId,
          taskId,
          documentNodeId,
          token
        )
        const filename = `${documentName?.replace(/\s+/g, "_") || "document_digitization"}.csv`
        downloadBlobForCSV(csvBlob, filename)
        toast.success("Document CSV exported successfully!")
      } catch (error) {
        console.error("Failed to export document CSV:", error)
        toast.error("Failed to export document CSV")
      } finally {
        setIsExportingCsv(false)
      }
    },
    [organizationId, projectId, taskId, token]
  )

  return {
    exportDocumentInsightCsv,
    exportSingleDocumentInsightCsv,
    exportDocumentDigitizationCsv,
    isExportingCsv,
  }
}
