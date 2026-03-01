import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  X,
  Pencil,
  Maximize2,
  Minimize2,
  ScanLine,
  FileText,
  Trash,
  Rocket,
  Download,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import { toast } from 'sonner'
import { isDocumentInsightsFileTypeSupported } from 'src/utils/tasks/fileFormats'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import DocumentTextComponent from '../../helping-components/DocumentTextComponent'
import { fetchDocument, fetchDocuments, resetSupportingDocuments } from 'src/store/activeDocument/activeDocument'
import { localStorageConstants } from 'src/utils/generalConstants'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import { updateTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { DeleteConfirmDialog } from 'src/utils/dialogs/DeleteConfirmDialog'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'

interface DocumentPagePreviewDialogProps {
  open: boolean
  onClose: () => void
  activeDocument: any
  loading: boolean
  onExportCsv: (docNodeId?: string, docName?: string) => void
  isExportingCsv: boolean
  onDelete?: () => void
  reloadAll: () => Promise<void> | void
  handleGenerate: (params: any) => void
}

const DocumentPagePreviewDialog = ({
  open,
  onClose,
  activeDocument,
  loading,
  onExportCsv,
  isExportingCsv,
  onDelete,
  reloadAll,
  handleGenerate
}: DocumentPagePreviewDialogProps) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query as Record<string, string>
  const [fullscreen, setFullscreen] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [showDocumentText, setShowDocumentText] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [tempSupportingDocs, setTempSupportingDocs] = useState<string[]>([])
  const [hasBreakingChanges, setHasBreakingChanges] = useState(false)
  const [openConfirmAnswersDelete, setOpenConfirmAnswersDelete] = useState(false)
  const { supportingDocuments, isLoading } = useSelector((state: any) => state.activeDocument)
  const { isInsightsGeneratingCells } = useSelector((state: any) => state.activeTask.generationState)
  const { sections, isBlurring } = useSelector((state: any) => state.activeDocument)

  const isDocGenerating = useSelector((state: any) => {
    if (!activeDocument?.id) return false
    const cells = state.activeTask.generationState.isInsightsGeneratingCells
    if (cells[`${activeDocument.id}_all`] === true) return true
    const prefix = `${activeDocument.id}_`
    return Object.keys(cells).some((key) => key.startsWith(prefix) && cells[key] === true)
  })

  useEffect(() => {
    if (activeDocument) {
      ;(dispatch as any)((fetchDocument as any)({ documentId: activeDocument.documentId, token }))
    }
  }, [activeDocument, dispatch, token])

  useEffect(() => {
    if (!open || !activeDocument) return

    setEditMode(false)
    setPromptValue(activeDocument.prompt || '')
    setTempSupportingDocs(activeDocument?.supportingDocumentIds || [])
  }, [open])

  useEffect(() => {
    if (!open) return

    if (!tempSupportingDocs?.length) {
      ;(dispatch as any)(resetSupportingDocuments())
      return
    }

    ;(dispatch as any)(
      (fetchDocuments as any)({
        organizationId,
        projectId,
        documentIds: tempSupportingDocs,
        token,
        target: 'supportingDocuments'
      })
    )
  }, [open, tempSupportingDocs])

  useEffect(() => {
    setDialogLoading(loading || isLoading)
  }, [loading, isLoading])

  useEffect(() => {
    if (!activeDocument) return

    const promptChanged = promptValue !== (activeDocument.prompt || '')
    const docsChanged =
      JSON.stringify(tempSupportingDocs) !== JSON.stringify(activeDocument.supportingDocumentIds || [])

    setHasBreakingChanges(promptChanged || docsChanged)
  }, [promptValue, tempSupportingDocs, activeDocument])

  const handleSave = async () => {
    if (!activeDocument) return

    setDialogLoading(true)
    const payload = {
      id: activeDocument.id,
      taskId,
      nodeType: 'DOCUMENT',
      nodeValue: {
        documentMetadata: {
          prompt: promptValue,
          supportingDocumentIds: tempSupportingDocs
        }
      }
    }
    try {
      await (dispatch as any)(
        (updateTaskNode as any)({ organizationId, projectId, taskId, taskNodePayload: payload, token })
      ).unwrap()
      toast.success('Document updated!')
      reloadAll()
      setEditMode(false)
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleAddSupportingDoc = (newDocIds: string[]) => {
    setTempSupportingDocs((prev) => Array.from(new Set([...prev, ...newDocIds])))
    setOpenAddDocDialog(false)
  }

  const handleRemoveSupportingDoc = (id: string) => {
    setTempSupportingDocs((prev) => prev.filter((docId) => docId !== id))
  }

  const handleGenerateClick = () => {
    if (activeDocument) {
      setConfirmRegenerate(true)
    } else {
      handleGenerate({ documentsToGenerate: activeDocument, reGenerateExistingAnswers: true })
    }
  }

  const handleConfirmRegenerate = () => {
    handleGenerate({ documentsToGenerate: activeDocument, reGenerateExistingAnswers: true })
    setConfirmRegenerate(false)
  }

  const handleCancelRegenerate = () => {
    setConfirmRegenerate(false)
  }

  const handleClose = () => {
    ;(dispatch as any)(resetSupportingDocuments())
    setEditMode(false)
    setFullscreen(false)
    setShowDetails(true)
    setShowDocumentText(false)
    setTempSupportingDocs([])
    onClose()
  }

  const handleCancel = () => {
    setEditMode(false)
    resetDocumentState()
  }

  const resetDocumentState = () => {
    if (!activeDocument) return
    setPromptValue(activeDocument?.prompt || '')
    setTempSupportingDocs(activeDocument?.supportingDocumentIds || [])
  }

  if (!activeDocument) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className={`p-0 flex flex-col ${
          fullscreen
            ? 'fixed inset-0 w-screen h-screen max-w-none rounded-none translate-x-0 translate-y-0 left-0 top-0'
            : 'sm:max-w-4xl h-[90vh]'
        }`}
      >
        {/* AppBar / Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <h6 className="text-lg font-semibold text-foreground truncate">
              {activeDocument?.name || 'Document Preview'}
            </h6>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!editMode ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditMode(true)}
                        disabled={editMode}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Edit document details</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex gap-1 mr-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  {dialogLoading ? 'Saving...' : 'Cancel'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (hasBreakingChanges) {
                      setOpenConfirmAnswersDelete(true)
                    } else {
                      handleSave()
                    }
                  }}
                  disabled={dialogLoading}
                >
                  {dialogLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}

            {!editMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleGenerateClick}
                        disabled={
                          !isDocumentInsightsFileTypeSupported(activeDocument?.url) ||
                          isDocGenerating ||
                          dialogLoading
                        }
                      >
                        {isDocGenerating || dialogLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          <Rocket className="h-4 w-4" />
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isDocGenerating
                      ? 'Generation in progress...'
                      : !isDocumentInsightsFileTypeSupported(activeDocument?.url)
                      ? 'This file format is not supported for generation'
                      : 'Generate document answers'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {!editMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete ? onDelete : undefined}
                        disabled={!onDelete}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Remove document</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onExportCsv(activeDocument?.id, activeDocument?.name)}
                      disabled={isExportingCsv}
                    >
                      {isExportingCsv ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {isExportingCsv ? 'Exporting...' : 'Export data as CSV'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Generation Progress Banner */}
        {(isDocGenerating || dialogLoading) && (
          <div className="bg-primary text-primary-foreground p-3 flex items-center gap-3 border-b border-border">
            <Spinner size="sm" className="border-primary-foreground border-t-transparent" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Generating Document Answers...</p>
              <p className="text-xs opacity-90">
                Processing your document - you can continue viewing the content below
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-0">
          {/* BREAKING CHANGES WARNING */}
          {hasBreakingChanges && editMode && (
            <div className="p-2 mx-4 mt-2 rounded border border-yellow-500 text-yellow-700 dark:text-yellow-400 flex items-center gap-2 bg-background">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="font-semibold text-sm">
                You changed the question or supporting documents. All related answers will be deleted when you save.
              </p>
            </div>
          )}

          {/* Document Details Collapse */}
          <div className="border-b border-border p-4 bg-background max-h-[70vh] overflow-y-auto">
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-accent/50"
              >
                <span className="font-semibold text-base">Document Details</span>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showDetails && (
                <div className="border-t border-border p-4 bg-accent/30">
                  {/* PROMPT AREA */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-semibold">Prompt</p>
                    </div>

                    {!editMode ? (
                      <p className="p-3 bg-background rounded border border-border whitespace-pre-wrap min-h-[40px] font-mono text-sm">
                        {promptValue || 'No prompt specified'}
                      </p>
                    ) : (
                      <Textarea
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        rows={4}
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="my-3 border-t border-border" />

                  {/* SUPPORTING DOCUMENTS AREA */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-sm font-semibold">Supporting Documents</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Supporting documents provide additional context to improve answer accuracy.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="outline"
                              onClick={() => setOpenAddDocDialog(true)}
                              className="mb-2"
                              disabled={!editMode}
                            >
                              <ScanLine className="h-4 w-4 mr-2" />
                              Add Document
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!editMode && (
                          <TooltipContent>You must be in edit mode to add documents</TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    {/* DOCUMENT LIST */}
                    <div className="max-h-[260px] overflow-y-auto grid gap-2 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                      {supportingDocuments.map((doc: any) => (
                        <div
                          key={doc.documentId}
                          className="p-3 rounded-lg border border-border flex flex-col justify-between min-h-[120px] cursor-default transition-all duration-200 bg-background hover:-translate-y-1 hover:shadow-lg hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="font-semibold flex-1">
                              <TruncatedText text={doc.title} cursor="cursor-default" />
                            </span>
                          </div>

                          <div className="flex justify-between mt-2">
                            {doc.id && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${doc.id}&projectId=${projectId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open Document
                                </a>
                              </Button>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive"
                                      onClick={() => handleRemoveSupportingDoc(doc.id)}
                                      disabled={!editMode}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!editMode && (
                                  <TooltipContent>You must be in edit mode to remove documents</TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="my-2" />

            {/* Document Text Collapse */}
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              <button
                onClick={() => setShowDocumentText(!showDocumentText)}
                className="w-full px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-accent/50"
              >
                <span className="font-semibold text-base">Document Text</span>
                {showDocumentText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showDocumentText && (
                <div className="border-t border-border p-4 bg-accent/30">
                  <div className="flex-1 overflow-auto relative">
                    <ResponsiveCardContent
                      className={`bg-transparent py-6 px-4 ${
                        fullscreen ? 'min-h-[calc(100vh-200px)]' : 'min-h-[50vh]'
                      } ${isDocGenerating ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-300`}
                    >
                      <DocumentTextComponent
                        sections={sections}
                        isBlurring={isBlurring}
                        documentId={activeDocument.documentId}
                        projectId={projectId}
                        organizationId={organizationId}
                      />
                    </ResponsiveCardContent>

                    {/* Loading overlay for content area */}
                    {(isDocGenerating || dialogLoading) && (
                      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 flex items-center justify-center z-10">
                        <div className="bg-background rounded-lg p-4 flex items-center gap-3 shadow-lg border border-border">
                          <Spinner size="md" />
                          <p className="text-foreground font-medium text-sm">
                            Content will refresh when generation completes
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Regenerate Confirmation Dialog */}
        <GenerateConfirmDialog
          open={confirmRegenerate}
          onClose={handleCancelRegenerate}
          onConfirm={handleConfirmRegenerate}
          type="document"
        />
        <AddNewDocumentDialog
          open={openAddDocDialog}
          onClose={() => setOpenAddDocDialog(false)}
          existingDocumentIds={activeDocument?.supportingDocumentIds || []}
          organizationId={organizationId}
          projectId={projectId}
          taskId={taskId}
          token={token}
          mode="supporting"
          onConfirm={(newIds: string[]) => handleAddSupportingDoc(newIds)}
          onUploadSuccess={(newDocIds: string[]) => handleAddSupportingDoc(newDocIds)}
          taskType="document-insights"
        />

        <DeleteConfirmDialog
          open={openConfirmAnswersDelete}
          onClose={() => setOpenConfirmAnswersDelete(false)}
          onConfirm={() => {
            setHasBreakingChanges(false)
            setOpenConfirmAnswersDelete(false)
            handleSave()
          }}
          title="Confirm Document Update"
          contentText="You changed the document or its supporting documents. All related answers will be permanently deleted. Do you want to proceed?"
          confirmButtonText="Yes, continue"
          cancelButtonText="Cancel"
        />
      </DialogContent>
    </Dialog>
  )
}

export default DocumentPagePreviewDialog
