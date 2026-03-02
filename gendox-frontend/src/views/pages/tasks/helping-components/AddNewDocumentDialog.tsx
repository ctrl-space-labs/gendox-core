import React, { useEffect, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  X,
  Upload,
  CheckCircle,
  FileText,
  Loader2,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import UploaderDocuments from "src/views/pages/tasks/helping-components/UploaderDocuments"
import { fetchDocuments } from "src/store/activeDocument/activeDocument"
import { getFileTypeValidator } from "src/utils/tasks/taskUtils"

interface DocumentItem {
  id: string
  title?: string
  remoteUrl?: string
  createAt?: string
}

interface DocumentsAddNewDialogProps {
  open: boolean
  onClose: () => void
  existingDocumentIds?: string[]
  loading?: boolean
  onConfirm: (selectedIds: string[]) => void
  onUploadSuccess?: (ids: string[]) => void
  organizationId: string
  projectId: string
  token: string
  taskId: string
  mode?: string
  taskType?: string
}

const DocumentsAddNewDialog = ({
  open,
  onClose,
  existingDocumentIds = [],
  loading,
  onConfirm,
  onUploadSuccess,
  organizationId,
  projectId,
  token,
  taskId,
  mode = "main",
  taskType = "document-digitization",
}: DocumentsAddNewDialogProps) => {
  const dispatch = useDispatch()
  const { projectDocuments, isBlurring } = useSelector(
    (state: any) => state.activeDocument
  )
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showUploader, setShowUploader] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(
    new Set()
  )

  const existingDocIds = useMemo(
    () => new Set(existingDocumentIds || []),
    [existingDocumentIds]
  )

  const isFileTypeSupportedFn = useMemo(() => {
    return getFileTypeValidator(taskType)
  }, [taskType])

  useEffect(() => {
    if (!open) {
      setSelectedDocIds(new Set())
      setSearchTerm("")
      setShowUploader(false)
      setPage(0)
      setDocuments([])
    }
  }, [open])

  useEffect(() => {
    if (open && organizationId && projectId && token) {
      ;(dispatch as any)(
        (fetchDocuments as any)({
          organizationId,
          projectId,
          token,
          page,
          target: "projectDocuments",
        })
      )
    }
  }, [open, organizationId, projectId, token, page, dispatch])

  useEffect(() => {
    if (open && organizationId && projectId && token) {
      const delayFetch = setTimeout(() => {
        ;(dispatch as any)(
          (fetchDocuments as any)({
            organizationId,
            projectId,
            token,
            page,
            target: "projectDocuments",
            documentNameContains: searchTerm,
          })
        )
      }, 300)

      return () => clearTimeout(delayFetch)
    }
  }, [open, organizationId, projectId, token, page, searchTerm, dispatch])

  useEffect(() => {
    if (projectDocuments?.content) {
      if (page === 0) {
        setDocuments(projectDocuments.content)
      } else {
        setDocuments((prev) => [...prev, ...projectDocuments.content])
      }
      setTotalPages(projectDocuments.totalPages || 1)
    }
  }, [projectDocuments, page])

  const displayDocuments = useMemo(() => {
    return documents.filter((doc) => isFileTypeSupportedFn(doc.remoteUrl))
  }, [documents, isFileTypeSupportedFn])

  // Handlers
  const handleToggleSelect = (doc: DocumentItem) => {
    if (existingDocIds.has(doc.id)) return
    setSelectedDocIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(doc.id)) newSet.delete(doc.id)
      else newSet.add(doc.id)
      return newSet
    })
  }

  const handleLoadMore = () => {
    if (projectDocuments && page + 1 < projectDocuments.totalPages) {
      setPage((prev) => prev + 1)
    }
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedDocIds))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(0)
    setDocuments([])
  }

  return (
    <>
      {/* Main document selection dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              Select Project Documents
            </DialogTitle>
            <DialogDescription className="sr-only">
              Search and select project documents to add
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={handleSearchChange}
            />

            {isBlurring || loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayDocuments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-[60px] w-[60px] text-muted-foreground/50" />
                <p>No documents found</p>
                <p className="text-sm text-muted-foreground">
                  Try uploading a new document or adjust your search.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[300px] rounded border border-border">
                <div className="flex flex-col">
                  {displayDocuments.map((doc, index) => {
                    const isAlreadySelected = existingDocIds.has(doc.id)
                    const isSelected = selectedDocIds.has(doc.id)
                    const isSupported = isFileTypeSupportedFn(doc.remoteUrl)
                    const isDisabled = isAlreadySelected || !isSupported
                    const createdDate = doc.createAt
                      ? new Date(doc.createAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Unknown date"
                    return (
                      <React.Fragment key={doc.id}>
                        <Button
                          variant="ghost"
                          onClick={() => handleToggleSelect(doc)}
                          disabled={isDisabled}
                          className={cn(
                            "flex w-full h-auto items-center justify-between px-4 py-3 rounded-none",
                            isDisabled && "opacity-50",
                            isSelected &&
                              !isDisabled &&
                              "bg-primary/10 text-primary"
                          )}
                        >
                          <div>
                            <p
                              className={cn(
                                "text-sm",
                                isSelected && !isDisabled && "font-bold"
                              )}
                            >
                              {doc.title || "Untitled Document"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created at: {createdDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && !isDisabled && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                            {isAlreadySelected && (
                              <span className="text-xs text-destructive">
                                Already selected
                              </span>
                            )}
                            {!isSupported && !isAlreadySelected && (
                              <span className="text-xs text-muted-foreground">
                                Unsupported format
                              </span>
                            )}
                          </div>
                        </Button>
                        {index < displayDocuments.length - 1 && (
                          <Separator />
                        )}
                      </React.Fragment>
                    )
                  })}
                  {projectDocuments &&
                    page + 1 < projectDocuments.totalPages && (
                      <>
                        <Separator />
                        <div className="flex justify-center py-3">
                          <Button
                            variant="outline"
                            className="w-full max-w-[200px] font-bold"
                            onClick={handleLoadMore}
                          >
                            {isBlurring && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Load More
                          </Button>
                        </div>
                      </>
                    )}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUploader(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New Document
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedDocIds.size === 0}
            >
              Confirm Selection
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested uploader dialog */}
      <Dialog
        open={showUploader}
        onOpenChange={(isOpen) => !isOpen && setShowUploader(false)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription className="sr-only">
              Upload a new document to the project
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <UploaderDocuments
            closeUploader={() => setShowUploader(false)}
            taskId={taskId}
            onClose={onClose}
            onUploadSuccess={onUploadSuccess}
            mode={mode}
            taskType={taskType}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DocumentsAddNewDialog
