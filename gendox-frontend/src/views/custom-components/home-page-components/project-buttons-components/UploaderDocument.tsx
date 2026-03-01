import { useState } from "react"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import { CloudUpload, FileText, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { localStorageConstants } from "src/utils/generalConstants"
import documentService from "src/gendox-sdk/documentService"
import { fetchDocuments } from "src/store/activeDocument/activeDocument"

interface FileItem {
  id: string
  file: File
  name: string
  size: number
}

interface UploaderDocumentProps {
  closeUploader: () => void
}

const UploaderDocument = ({ closeUploader }: UploaderDocumentProps) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, projectId } = router.query
  const accessToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 640 : false

  const [fileQueue, setFileQueue] = useState<FileItem[]>([])
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const {
    getRootProps,
    getInputProps,
    open: triggerFileSelect,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      const enrichedFiles: FileItem[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${file.name}`,
        file,
        name: file.name,
        size: file.size,
      }))
      setFileQueue((prev) => [...prev, ...enrichedFiles])
    },
    noClick: true,
    noKeyboard: true,
  })

  const uploadFilesBatch = async (filesBatch: FileItem[]) => {
    const tasks = filesBatch.map(async (file) => {
      const formPayload = new FormData()
      formPayload.append("file", file.file)
      try {
        await (documentService as any).uploadDocument(
          organizationId,
          projectId,
          formPayload,
          accessToken
        )
        setUploadedCount((prev) => prev + 1)
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
      }
    })
    await Promise.all(tasks)
  }

  const handleUploadAll = async () => {
    setIsUploading(true)
    setTotalFiles(fileQueue.length)
    setUploadedCount(0)
    const batchSize = 10
    for (let idx = 0; idx < fileQueue.length; idx += batchSize) {
      const currentBatch = fileQueue.slice(idx, idx + batchSize)
      await uploadFilesBatch(currentBatch)
    }
    setIsUploading(false)
    setFileQueue([])
    closeUploader()
    toast.success("All files uploaded successfully!")
    ;(dispatch as any)(
      fetchDocuments({
        organizationId,
        projectId,
        token: accessToken,
        page: 0,
        target: "projectDocuments",
      })
    )
  }

  const deleteFile = (fileId: string) => {
    setFileQueue((prev) => prev.filter((file) => file.id !== fileId))
  }

  const clearAllFiles = () => setFileQueue([])

  const globalProgress =
    totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0

  return (
    <div className="flex flex-col items-center p-4 bg-card rounded-lg min-w-[20rem] w-full max-w-[90vw]">
      <div className="w-full flex justify-between items-center px-1 mb-4">
        <h5 className="text-lg font-semibold flex-grow">Upload Document</h5>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeUploader}
          className="text-primary"
          aria-label="close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Drag and drop zone - desktop only */}
      {!isMobile && (
        <div
          {...getRootProps()}
          onClick={triggerFileSelect}
          className="w-full min-h-[6rem] p-4 border-2 border-dashed border-primary rounded-md flex flex-col items-center justify-center cursor-pointer mb-4"
        >
          <input {...getInputProps()} />
          <div className="text-primary mb-4 pointer-events-none">
            <CloudUpload className="h-20 w-20" />
          </div>
          <h5 className="text-lg font-semibold mb-2 pointer-events-none">
            Drag and Drop
          </h5>
        </div>
      )}

      {isMobile && (
        <input {...getInputProps()} style={{ display: "none" }} />
      )}

      <div className="flex justify-center w-full my-6">
        <Button onClick={triggerFileSelect}>CHOOSE FILES</Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Maximum file size 100MB
      </p>

      {fileQueue.length > 0 && (
        <>
          {isUploading && (
            <div className="w-full mb-4">
              <p className="text-sm">{`Uploaded ${uploadedCount} of ${totalFiles} files`}</p>
              <Progress value={globalProgress} className="h-2 mt-1" />
            </div>
          )}

          <div className="w-full max-h-40 overflow-y-auto mt-2">
            <ul className="space-y-2">
              {fileQueue.map((file) => {
                const sizeInKB = file.size / 1024
                const displaySize =
                  sizeInKB > 1000
                    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${sizeInKB.toFixed(1)} KB`

                return (
                  <li
                    key={file.id}
                    className="flex items-center p-2 rounded-md"
                  >
                    <FileText className="h-5 w-5 mr-4 text-muted-foreground" />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {displaySize}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile(file.id)}
                      aria-label="delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              className="text-destructive border-destructive"
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

export default UploaderDocument
