import React, { useState, useRef } from "react"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import { Upload, FileText, Trash2, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { localStorageConstants } from "src/utils/generalConstants"
import documentService from "src/gendox-sdk/documentService"
import { fetchTaskNodesByCriteria } from "src/store/activeTaskNode/activeTaskNode"
import taskService from "src/gendox-sdk/taskService"
import {
  isFileTypeSupported,
  getSupportedMimeTypes,
  getUnsupportedFormatMessage,
} from "src/utils/tasks/fileFormats"

interface FileEntry {
  id: string
  file: File
  name: string
  size: number
}

interface FileItemProps {
  file: FileEntry
  onDelete: (id: string) => void
}

interface UploaderDocumentsProps {
  closeUploader: () => void
  taskId: string
  onClose: () => void
  onUploadSuccess?: (ids: string[]) => void
  mode?: string
  taskType?: string
}

// Renders an individual file preview with details
const FileItem = ({ file, onDelete }: FileItemProps) => {
  const sizeInKB = file.size / 1024
  const displaySize =
    sizeInKB > 1000
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${sizeInKB.toFixed(1)} KB`

  return (
    <li className="mb-2 flex flex-col rounded p-2">
      <div className="flex w-full items-center">
        <div className="mr-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">{displaySize}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(file.id)}
          aria-label="delete file"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </li>
  )
}

const UploaderDocuments = ({
  closeUploader,
  taskId,
  onClose,
  onUploadSuccess,
  mode,
  taskType,
}: UploaderDocumentsProps) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, projectId } = router.query as {
    organizationId: string
    projectId: string
  }
  const accessToken = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  )

  // Media query: check if we are in mobile view
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640

  // Local state to track file, the global upload counter, and upload state.
  const [fileQueue, setFileQueue] = useState<FileEntry[]>([])
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const uploadedIdsRef = useRef<string[]>([])

  const {
    getRootProps,
    getInputProps,
    open: triggerFileSelect,
  } = useDropzone({
    accept: getSupportedMimeTypes(taskType),
    onDrop: (acceptedFiles: File[]) => {
      const supportedFiles = acceptedFiles.filter((file) =>
        isFileTypeSupported(file.name, taskType)
      )
      const unsupportedFiles = acceptedFiles.filter(
        (file) => !isFileTypeSupported(file.name, taskType)
      )

      if (unsupportedFiles.length > 0) {
        toast.error(getUnsupportedFormatMessage(unsupportedFiles, taskType))
      }

      if (supportedFiles.length > 0) {
        const enrichedFiles: FileEntry[] = supportedFiles.map((file) => ({
          id: `${Date.now()}-${file.name}`,
          file,
          name: file.name,
          size: file.size,
        }))
        setFileQueue((prev) => [...prev, ...enrichedFiles])
      }
    },
    noClick: true,
    noKeyboard: true,
    multiple: true,
  })

  const uploadFilesBatch = async (filesBatch: FileEntry[]) => {
    const tasks = filesBatch.map(async (fileObj) => {
      try {
        const uploadResponse = await documentService.uploadSingleDocument(
          organizationId,
          projectId,
          fileObj.file,
          accessToken
        )

        // Notify parent that a new document is created
        if (typeof onUploadSuccess === "function") {
          uploadedIdsRef.current.push(uploadResponse.data.id)
        }

        // Create task node for each uploaded document
        if (mode === "main") {
          const taskNodePayload = {
            taskId,
            nodeType: "DOCUMENT",
            documentId: uploadResponse.data.id,
          }
          await taskService.createTaskNode(
            organizationId,
            projectId,
            taskNodePayload,
            accessToken
          )
        }
        setUploadedCount((prev) => prev + 1)
      } catch (error) {
        console.error(`Error uploading ${fileObj.name}:`, error)
      }
    })
    await Promise.all(tasks)
  }

  const handleUploadAll = async () => {
    if (!fileQueue.length) return
    setIsUploading(true)
    setTotalFiles(fileQueue.length)
    setUploadedCount(0)

    const batchSize = 5
    for (let i = 0; i < fileQueue.length; i += batchSize) {
      const batch = fileQueue.slice(i, i + batchSize)
      await uploadFilesBatch(batch)
    }

    setIsUploading(false)
    toast.success("All files uploaded successfully!")
    setFileQueue([])
    if (typeof onUploadSuccess === "function") {
      onUploadSuccess([...uploadedIdsRef.current])
    }
    uploadedIdsRef.current = []
    closeUploader()
    onClose()
    ;(dispatch as any)(
      (fetchTaskNodesByCriteria as any)({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ["DOCUMENT"] },
        token: accessToken,
      })
    )
  }

  const deleteFile = (fileId: string) => {
    setFileQueue((prev) => prev.filter((file) => file.id !== fileId))
  }

  const clearAllFiles = () => {
    setFileQueue([])
  }

  const globalProgress =
    totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0

  return (
    <div className="flex w-full max-w-[90vw] flex-col items-center rounded-lg bg-background p-4 min-w-[20rem]">
      {/* Header */}
      <div className="mb-4 flex w-full items-center justify-between px-1">
        <h2 className="flex-1 text-xl font-semibold">Upload Documents</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeUploader}
          aria-label="close"
          className="text-primary"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Drop zone - desktop only */}
      {!isMobile && (
        <div
          {...getRootProps()}
          onClick={triggerFileSelect}
          className="mb-4 flex w-full min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-primary p-4"
        >
          <input {...getInputProps()} />
          <div className="pointer-events-none mb-4 text-primary">
            <Upload className="h-12 w-12" />
          </div>
          <h3 className="pointer-events-none mb-2 text-xl font-semibold">
            Drag and Drop files here
          </h3>
          <p className="pointer-events-none text-sm text-muted-foreground">
            or click to select files
          </p>
        </div>
      )}

      {isMobile && <input {...getInputProps()} style={{ display: "none" }} />}

      <div className="my-6 flex w-full justify-center">
        <Button onClick={triggerFileSelect}>CHOOSE FILES</Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Maximum file size 100MB each
      </p>

      {fileQueue.length > 0 && (
        <>
          {isUploading && (
            <div className="mb-4 w-full">
              <p className="mb-1 text-sm">{`Uploaded ${uploadedCount} of ${totalFiles} files`}</p>
              <Progress value={globalProgress} className="h-2" />
            </div>
          )}

          <div className="mt-2 w-full max-h-40 overflow-y-auto">
            <ul>
              {fileQueue.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDelete={deleteFile}
                />
              ))}
            </ul>
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={clearAllFiles}
              disabled={isUploading}
            >
              Remove All
            </Button>
            <Button onClick={handleUploadAll} disabled={isUploading}>
              Upload Files
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default UploaderDocuments
