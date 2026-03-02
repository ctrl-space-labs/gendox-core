import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  X,
  Maximize2,
  Minimize2,
  FileText,
  Pencil,
  Save,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Rocket,
  Sparkles,
  Network,
  CheckCircle,
  Download,
  Ban,
  AlertCircle
} from 'lucide-react'
import GendoxMarkdownRenderer from 'src/views/pages/markdown-renderer/GendoxMarkdownRenderer'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
// @ts-ignore - JS module re-export
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import { updateTaskNode, fetchTaskNodesByCriteria } from 'src/store/activeTaskNode/activeTaskNode'
import { useDispatch, useSelector } from 'react-redux'

const PAGE_SIZE = 20

interface DocumentData {
  id: string
  documentId?: string
  name?: string
  url?: string
  prompt?: string
  structure?: string
  pageFrom?: number | null
  pageTo?: number | null
  allPages?: boolean
}

interface PageNode {
  id: string
  documentId: string | null
  documentNodeId: string | null
  message: string
  order: number
  createdAt: string
}

interface DocumentPagePreviewDialogProps {
  open: boolean
  onClose: () => void
  document: DocumentData | null
  documentPages: any
  reloadAll: () => Promise<void> | void
  handleGenerate: (params: any) => void
  dialogLoading: boolean
  onExportCsv: (docId?: string, docName?: string) => void
  isExportingCsv: boolean
  onDelete?: () => void
}

const DocumentPagePreviewDialog = ({
  open,
  onClose,
  document,
  documentPages,
  reloadAll,
  handleGenerate,
  dialogLoading,
  onExportCsv,
  isExportingCsv,
  onDelete
}: DocumentPagePreviewDialogProps) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesAnswerList } = useSelector((state: any) => state.activeTaskNode)

  // Local State
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Pagination State
  const [pageNodes, setPageNodes] = useState<PageNode[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isMoreLoading, setIsMoreLoading] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [showDocumentConfiguration, setShowDocumentConfiguration] = useState(true)
  const [promptValue, setPromptValue] = useState('')
  const [structureValue, setStructureValue] = useState('')
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(document || null)
  const [pageFrom, setPageFrom] = useState('')
  const [pageTo, setPageTo] = useState('')
  const [pageRangeError, setPageRangeError] = useState('')
  const [selectAllPages, setSelectAllPages] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevDialogLoading = useRef(dialogLoading)
  const currentPageRef = useRef(0)
  const showLoadMore = pageNodes.length < totalElements

  const docPage = Array.isArray(documentPages)
    ? documentPages.find((p: any) => p.taskDocumentNodeId === document?.id)
    : (documentPages?.content || []).find((p: any) => p.taskDocumentNodeId === document?.id)
  const totalPages = docPage?.documentPages || 0

  const fetchAnswerNodes = (fetchPage: number) => {
    if (!organizationId || !projectId || !taskId || !document?.id) return

    // Set loading indicators
    if (fetchPage === 0) setIsInitialLoading(true)
    else setIsMoreLoading(true)

    ;(dispatch as any)(
      (fetchTaskNodesByCriteria as any)({
        organizationId,
        projectId,
        taskId,
        token,
        criteria: {
          taskId,
          nodeTypeNames: ['ANSWER'],
          nodeValueNodeDocumentId: document.id
        },
        page: fetchPage,
        size: PAGE_SIZE
      })
    )
      .unwrap()
      .catch((err: any) => {
        console.error('Fetch failed', err)
        toast.error('Failed to load pages')
      })
      .finally(() => {
        if (fetchPage === 0) setIsInitialLoading(false)
        else setIsMoreLoading(false)
      })
  }

  useEffect(() => {
    if (open && document?.id) {
      // Reset state
      setPageNodes([])
      setCurrentPage(0)
      currentPageRef.current = 0
      setTotalElements(0)

      // Fetch first page
      fetchAnswerNodes(0)
    }
  }, [open, document?.id])

  // Fetch answer nodes on page change
  useEffect(() => {
    if (!taskNodesAnswerList?.content) return

    const fetchedNodes = taskNodesAnswerList.content
    const total = taskNodesAnswerList.totalElements || 0

    setTotalElements(total)

    // filter nodes for this document
    const validNodes = fetchedNodes
      .filter((node: any) => node.documentId == document?.documentId)
      .sort((a: any, b: any) => (a.nodeValue?.order || 0) - (b.nodeValue?.order || 0))
      .map((node: any) => ({
        id: node.id,
        documentId: node.documentId || null,
        documentNodeId: node.nodeValue?.nodeDocumentId || null,
        message: node.nodeValue?.message || '',
        order: node.nodeValue?.order || 0,
        createdAt: node.createdAt
      }))

    if (validNodes.length === 0 && total > 0) {
      return
    }

    setPageNodes((prevNodes) => {
      let mergedNodes: PageNode[] = []
      if (currentPageRef.current === 0) {
        mergedNodes = validNodes
      } else {
        const existingIds = new Set(prevNodes.map((n) => n.id))
        const uniqueNewNodes = validNodes.filter((n: PageNode) => !existingIds.has(n.id))
        mergedNodes = [...prevNodes, ...uniqueNewNodes]
      }
      return mergedNodes.sort((a, b) => (a.order || 0) - (b.order || 0))
    })
  }, [taskNodesAnswerList, document?.documentId])

  useEffect(() => {
    if (prevDialogLoading.current && !dialogLoading) {
      fetchAnswerNodes(0)
      if (reloadAll) reloadAll()
    }
    prevDialogLoading.current = dialogLoading
  }, [dialogLoading])

  const handleLoadMore = () => {
    if (!isMoreLoading && showLoadMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      currentPageRef.current = nextPage
      fetchAnswerNodes(nextPage)
    }
  }

  // Validation function for page range
  const validatePageRange = (fromPage: string, toPage: string, updateState = true) => {
    if ((!fromPage || fromPage.trim() === '') && (!toPage || toPage.trim() === '')) {
      if (updateState) setPageRangeError('')
      return true
    }

    const from = fromPage && fromPage.trim() !== '' ? parseInt(fromPage, 10) : null
    const to = toPage && toPage.trim() !== '' ? parseInt(toPage, 10) : null

    if (from !== null && (isNaN(from) || from < 1 || from > totalPages)) {
      if (updateState) setPageRangeError(`From page must be between 1 and ${totalPages}`)
      return false
    }

    if (to !== null && (isNaN(to) || to < 1 || to > totalPages)) {
      if (updateState) setPageRangeError(`To page must be between 1 and ${totalPages}`)
      return false
    }

    if (from !== null && to !== null && from > to) {
      if (updateState) setPageRangeError('From page cannot be greater than To page')
      return false
    }

    if (updateState) setPageRangeError('')
    return true
  }

  // Initialize prompt and structure values from document
  useEffect(() => {
    if (document) {
      setCurrentDocument(document)
      if (open) {
        setPromptValue(document.prompt || '')
        setStructureValue(document.structure || '')
        const fromPage = document.pageFrom ? document.pageFrom.toString() : ''
        const toPage = document.pageTo ? document.pageTo.toString() : ''
        setPageFrom(fromPage)
        setPageTo(toPage)
        setSelectAllPages(document?.allPages || (!fromPage && !toPage))
      }
    }
  }, [open, document])

  const handleClose = () => {
    if (editMode) {
      setEditMode(false)
      setPromptValue(currentDocument?.prompt || '')
      setStructureValue(currentDocument?.structure || '')
      const fromPage = currentDocument?.pageFrom ? currentDocument.pageFrom.toString() : ''
      const toPage = currentDocument?.pageTo ? currentDocument.pageTo.toString() : ''
      setPageFrom(fromPage)
      setPageTo(toPage)
      setSelectAllPages(currentDocument?.allPages || (!fromPage && !toPage))
    }
    setFullscreen(false)
    setPageNodes([])
    setCurrentPage(0)
    setTotalElements(0)
    onClose()
  }

  const handlePageFromChange = (value: string) => {
    setPageFrom(value)
    validatePageRange(value, pageTo)
    if (value && value.trim()) {
      setSelectAllPages(false)
    } else if ((!value || !value.trim()) && (!pageTo || !pageTo.trim())) {
      setSelectAllPages(true)
    }
  }

  const handlePageToChange = (value: string) => {
    setPageTo(value)
    validatePageRange(pageFrom, value)
    if (value && value.trim()) {
      setSelectAllPages(false)
    } else if ((!pageFrom || !pageFrom.trim()) && (!value || !value.trim())) {
      setSelectAllPages(true)
    }
  }

  const handleSelectAllPagesChange = (checked: boolean) => {
    setSelectAllPages(checked)
    if (checked) {
      setPageFrom('')
      setPageTo('')
      setPageRangeError('')
    }
  }

  const handleSave = async () => {
    if (!document) return

    const isValid = validatePageRange(pageFrom, pageTo)
    if (!isValid) {
      toast.error('Please fix page range errors before saving')
      return
    }

    setSaving(true)
    try {
      const token = window.localStorage.getItem('accessToken')
      const { organizationId, projectId, taskId } = router.query

      const payload = {
        id: document.id,
        taskId,
        nodeType: 'DOCUMENT',
        nodeValue: {
          documentMetadata: {
            prompt: promptValue,
            structure: structureValue,
            pageFrom: pageFrom && pageFrom.trim() ? parseInt(pageFrom, 10) : null,
            pageTo: pageTo && pageTo.trim() ? parseInt(pageTo, 10) : null,
            allPages: selectAllPages || ((!pageFrom || !pageFrom.trim()) && (!pageTo || !pageTo.trim()))
          }
        }
      }

      await (dispatch as any)(
        (updateTaskNode as any)({ organizationId, projectId, taskId, taskNodePayload: payload, token })
      ).unwrap()

      const updatedDocument = {
        ...document,
        prompt: promptValue,
        structure: structureValue,
        pageFrom: pageFrom && pageFrom.trim() ? parseInt(pageFrom, 10) : null,
        pageTo: pageTo && pageTo.trim() ? parseInt(pageTo, 10) : null,
        allPages: payload.nodeValue.documentMetadata.allPages
      }

      setCurrentDocument(updatedDocument)
      reloadAll()
      setEditMode(false)
      toast.success('Document updated successfully!')
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setPromptValue(currentDocument?.prompt || '')
    setStructureValue(currentDocument?.structure || '')
    const fromPage = currentDocument?.pageFrom ? currentDocument.pageFrom.toString() : ''
    const toPage = currentDocument?.pageTo ? currentDocument.pageTo.toString() : ''
    setPageFrom(fromPage)
    setPageTo(toPage)
    setSelectAllPages(currentDocument?.allPages || (!fromPage && !toPage))
    setPageRangeError('')
  }

  const handleGenerateClick = () => {
    if (document) {
      setConfirmRegenerate(true)
    } else {
      handleGenerate({ documentsToGenerate: document, reGenerateExistingAnswers: true })
    }
  }

  const handleConfirmRegenerate = () => {
    handleGenerate({ documentsToGenerate: document, reGenerateExistingAnswers: true })
    setConfirmRegenerate(false)
  }

  const handleCancelRegenerate = () => {
    setConfirmRegenerate(false)
  }

  if (!document || !currentDocument) {
    return null
  }

  const SectionCardContent = () => {
    if (isInitialLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
          <Spinner size="lg" />
          <p className="text-base text-muted-foreground">Loading document content...</p>
        </div>
      )
    }

    if (!pageNodes || pageNodes.length === 0) {
      const isSupported = isFileTypeSupported(currentDocument?.url || '')

      return (
        <div className="flex items-center justify-center min-h-[400px] flex-col gap-6 text-center px-8">
          {!isSupported ? (
            <Ban className="h-20 w-20 text-muted-foreground" />
          ) : (
            <FileText className="h-20 w-20 text-muted-foreground" />
          )}

          {!isSupported ? (
            <>
              <h5 className="text-xl font-semibold text-foreground">Unsupported File Format</h5>
              <p className="text-base text-muted-foreground max-w-[600px]">
                This file format ({currentDocument?.name?.split('.').pop()?.toUpperCase()}) is not supported for
                document digitization. Supported formats include PDF, Word documents, PowerPoint presentations, and
                Excel files.
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ODT, RTF
              </p>
            </>
          ) : (
            <>
              <h5 className="text-xl font-semibold text-foreground">No Answers Generated</h5>
              <p className="text-base text-muted-foreground max-w-[600px]">
                This document has a prompt configured but no answers have been generated yet. Use the generate function
                to process this document and create answer nodes.
              </p>
              <p className="text-sm text-primary font-medium">
                Prompt is ready - Click &quot;Generate&quot; to process this document
              </p>
            </>
          )}
        </div>
      )
    }

    return (
      <div className="bg-transparent shadow-none">
        {pageNodes.map((pageNode, index) => (
          <React.Fragment key={pageNode.id || index}>
            <div
              ref={(el: HTMLDivElement | null) => { sectionRefs.current[index] = el }}
              className="overflow-auto bg-transparent px-4 sm:px-6 py-6"
            >
              <h6 className="mb-6 text-left text-primary font-semibold flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Page {pageNode.order || index + 1}
              </h6>

              <GendoxMarkdownRenderer markdownText={pageNode.message || 'No answer content available for this page.'} />
            </div>
            {index !== pageNodes.length - 1 && (
              <div className="my-8 mx-8 border-t-2 border-primary/30" />
            )}
          </React.Fragment>
        ))}

        {/* Load More Button */}
        {showLoadMore && (
          <div className="text-center py-8">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              disabled={isMoreLoading}
              className="min-w-[200px] font-semibold border-2 hover:border-2"
            >
              {isMoreLoading && <Spinner size="sm" className="mr-2" />}
              {isMoreLoading ? 'Loading More...' : `Load More Pages (${totalElements - pageNodes.length} remaining)`}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 flex flex-col",
          fullscreen
            ? "w-screen h-screen max-w-none rounded-none"
            : "max-w-5xl h-[90vh]"
        )}
      >
        {/* Custom AppBar / Toolbar */}
        <div className="flex items-center px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h6 className="text-base font-semibold text-foreground">
                {currentDocument?.name || 'Document Preview'}
              </h6>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {pageNodes.length > 0 && (
              <Badge variant="outline" className="mr-2 text-primary border-primary">
                {(() => {
                  const numberOfNodePages = docPage?.numberOfNodePages || pageNodes.length
                  const documentPagesCount = docPage?.documentPages || 0
                  const missingPages = Math.max(0, documentPagesCount - numberOfNodePages)

                  const pagesText = numberOfNodePages === 1 ? '1 page' : `${numberOfNodePages} pages`
                  return missingPages > 0 ? `${pagesText} (${missingPages} missing)` : pagesText
                })()}
              </Badge>
            )}

            {editMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="mr-1"
                  disabled={saving}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="mr-2"
                  disabled={saving || pageRangeError !== ''}
                >
                  {saving ? <Spinner size="sm" className="mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <TooltipProvider>
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mr-1"
                          onClick={() => setEditMode(true)}
                          disabled={!isFileTypeSupported(currentDocument?.url || '')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!isFileTypeSupported(currentDocument?.url || '')
                        ? 'This file format is not supported for configuration'
                        : 'Edit prompt and structure'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mr-1"
                          onClick={handleGenerateClick}
                          disabled={
                            !isFileTypeSupported(currentDocument?.url || '') ||
                            dialogLoading ||
                            pageRangeError !== ''
                          }
                        >
                          {dialogLoading ? <Spinner size="sm" /> : <Rocket className="h-4 w-4" />}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dialogLoading
                        ? 'Generation in progress...'
                        : !isFileTypeSupported(currentDocument?.url || '')
                        ? 'This file format is not supported for generation'
                        : pageRangeError !== ''
                        ? `Fix page range error: ${pageRangeError}`
                        : pageNodes.length > 0
                        ? 'Regenerate document answers'
                        : 'Generate document answers'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mr-1 text-destructive hover:text-destructive"
                          onClick={() => onDelete && onDelete()}
                          disabled={!onDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Remove document</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mr-1"
                          onClick={() => onExportCsv && onExportCsv(document?.id, document?.name)}
                          disabled={isExportingCsv || !onExportCsv}
                        >
                          {isExportingCsv ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExportingCsv ? 'Exporting...' : 'Export data as CSV'}
                    </TooltipContent>
                  </Tooltip>
                </>
              </TooltipProvider>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Generation Progress Banner */}
        {dialogLoading && (
          <div className="bg-primary text-primary-foreground p-4 flex items-center gap-4 border-b shrink-0">
            <Spinner size="sm" className="text-primary-foreground border-primary-foreground border-t-transparent" />
            <div className="flex-1">
              <p className="text-base font-semibold">Generating Document Answers...</p>
              <p className="text-sm opacity-90">
                Processing your document - you can continue viewing the content below
              </p>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Prompt and Structure Section */}
          <div className="border-b p-4 bg-background shrink-0">
            <div className="py-3 px-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <h6 className="text-base font-semibold text-foreground">Document Configuration</h6>

                  {/* Status chips */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* File Type Status */}
                    {!isFileTypeSupported(currentDocument?.url || '') && (
                      <Badge variant="secondary" className="text-xs h-6 bg-gray-400 text-white">
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Unsupported Format
                      </Badge>
                    )}

                    {/* Prompt Status */}
                    {isFileTypeSupported(currentDocument?.url || '') &&
                      (currentDocument?.prompt && currentDocument.prompt.trim() ? (
                        <Badge className="text-xs h-6">
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          Prompt
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs h-6 text-muted-foreground border-muted-foreground">
                          No Prompt
                        </Badge>
                      ))}

                    {/* Generation Status */}
                    {isFileTypeSupported(currentDocument?.url || '') &&
                      (pageNodes.length > 0 ? (
                        <Badge className="text-xs h-6 bg-primary text-primary-foreground">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Generated
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs h-6">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          Not Generated
                        </Badge>
                      ))}

                    {/* Structure Status */}
                    {isFileTypeSupported(currentDocument?.url || '') &&
                      (currentDocument?.structure && currentDocument.structure.trim() ? (
                        <Badge className="text-xs h-6 bg-blue-500 text-white">
                          <Network className="h-3.5 w-3.5 mr-1" />
                          Structure
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs h-6">
                          No Structure
                        </Badge>
                      ))}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowDocumentConfiguration(!showDocumentConfiguration)}
                >
                  {showDocumentConfiguration ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {showDocumentConfiguration && (
                <div className="flex flex-col gap-6">
                  <div>
                    <Label className="text-sm text-muted-foreground font-medium mb-2 block">Prompt</Label>
                    {editMode ? (
                      <Textarea
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        placeholder="Enter the prompt for document processing..."
                        rows={3}
                        autoFocus
                        className="min-h-[120px] resize-y"
                      />
                    ) : (
                      <div className="p-4 bg-muted/50 rounded border border-border min-h-[40px] max-h-[30vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap break-words">
                        {promptValue || 'No prompt specified'}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground font-medium mb-2 block">Structure</Label>
                    {editMode ? (
                      <Textarea
                        value={structureValue}
                        onChange={(e) => setStructureValue(e.target.value)}
                        placeholder="Enter the structure for document processing..."
                        rows={2}
                        className="min-h-[80px] max-h-[200px] resize-y"
                      />
                    ) : (
                      <div className="p-4 bg-muted/50 rounded border border-border min-h-[40px] max-h-[30vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap break-words">
                        {structureValue || 'No structure specified'}
                      </div>
                    )}
                  </div>

                  {/* Page Range Selection */}
                  <div>
                    <Label className="text-sm text-muted-foreground font-medium mb-2 block">
                      Page Range (optional)
                    </Label>

                    {/* Select All Pages Checkbox */}
                    {editMode && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id="select-all-pages"
                          checked={selectAllPages}
                          onCheckedChange={(checked) => handleSelectAllPagesChange(!!checked)}
                        />
                        <label
                          htmlFor="select-all-pages"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Select all pages
                        </label>
                      </div>
                    )}

                    <div className="flex gap-3 items-center">
                      <div className="w-[120px]">
                        <Input
                          type="number"
                          placeholder="1"
                          value={pageFrom}
                          onChange={(e) => handlePageFromChange(e.target.value)}
                          onBlur={() => validatePageRange(pageFrom, pageTo)}
                          min={1}
                          max={totalPages}
                          disabled={!editMode || selectAllPages}
                          className={cn(
                            "h-9",
                            pageRangeError && pageFrom && pageFrom.trim() !== '' && "border-destructive",
                            editMode ? "bg-background" : "bg-muted/50"
                          )}
                        />
                        <span className="text-xs text-muted-foreground">From Page</span>
                      </div>
                      <span className="text-sm text-muted-foreground">to</span>
                      <div className="w-[120px]">
                        <Input
                          type="number"
                          placeholder={totalPages.toString()}
                          value={pageTo}
                          onChange={(e) => handlePageToChange(e.target.value)}
                          onBlur={() => validatePageRange(pageFrom, pageTo)}
                          min={1}
                          max={totalPages}
                          disabled={!editMode || selectAllPages}
                          className={cn(
                            "h-9",
                            pageRangeError && pageTo && pageTo.trim() !== '' && "border-destructive",
                            editMode ? "bg-background" : "bg-muted/50"
                          )}
                        />
                        <span className="text-xs text-muted-foreground">To Page</span>
                      </div>
                      <span className="text-xs text-muted-foreground">(Total: {totalPages} pages)</span>
                    </div>
                    {pageRangeError && (
                      <p className="text-xs text-destructive mt-2">{pageRangeError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto relative">
            <ResponsiveCardContent
              className={cn(
                "bg-muted/30 py-12 px-8 transition-opacity duration-300",
                fullscreen ? "min-h-[calc(100vh-200px)]" : "min-h-[50vh]",
                dialogLoading && "opacity-60 pointer-events-none"
              )}
            >
              <SectionCardContent />
            </ResponsiveCardContent>

            {/* Subtle loading overlay for content area */}
            {dialogLoading && (
              <div className="absolute inset-0 bg-white/10 flex items-center justify-center z-10">
                <div className="bg-background rounded-lg p-6 flex items-center gap-4 shadow-md border border-border">
                  <Spinner size="md" />
                  <p className="text-base text-foreground font-medium">
                    Content will refresh when generation completes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Regenerate Confirmation Dialog */}
        <GenerateConfirmDialog
          open={confirmRegenerate}
          onClose={handleCancelRegenerate}
          onConfirm={handleConfirmRegenerate}
          type="document"
        />
      </DialogContent>
    </Dialog>
  )
}

export default DocumentPagePreviewDialog
