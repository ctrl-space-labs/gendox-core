import React, { useMemo, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import {
  MoreVertical,
  Trash2,
  Pencil,
  FileText,
  CheckCircle,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
// @ts-ignore - JS module re-export
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'

interface DocumentData {
  id: string
  documentId?: string
  name: string
  url: string
  prompt?: string
  structure?: string
  pageFrom?: number | null
  pageTo?: number | null
  allPages?: boolean
  createdAt: string
}

interface DocumentPage {
  taskDocumentNodeId: string
  numberOfNodePages: number
  documentPages: number
}

interface RowData {
  id: string
  name: string
  url: string
  prompt: string
  pages: string
  status: string
  actions: string
  _doc: DocumentData
}

interface DocumentDigitizationGridProps {
  openDialog: (dialogType: string, node?: DocumentData | null, forceEditMode?: boolean) => void
  documents: DocumentData[]
  documentPages: any
  isLoading: boolean
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize?: (size: number) => void
  totalDocuments: number
  selectedDocuments?: string[]
  setSelectedDocuments: (docs: string[]) => void
  onSelectDocument?: (docId: string, checked: boolean | string[]) => void
  isDocumentGenerating?: (id: string) => boolean
}

const DocumentDigitizationGrid = ({
  openDialog,
  documents,
  documentPages,
  isLoading,
  page,
  pageSize,
  setPage,
  totalDocuments,
  selectedDocuments = [],
  setSelectedDocuments,
  onSelectDocument = () => {},
  isDocumentGenerating = () => false
}: DocumentDigitizationGridProps) => {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [actionMenuDoc, setActionMenuDoc] = useState<DocumentData | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null)
        setActionMenuDoc(null)
      }
    }
    if (actionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [actionMenuOpen])

  const docPagesMap = useMemo(() => {
    const map: Record<string, DocumentPage> = {}
    const pages = Array.isArray(documentPages) ? documentPages : documentPages?.content || []
    pages.forEach((p: any) => {
      if (p && p.taskDocumentNodeId) {
        map[p.taskDocumentNodeId] = p
      }
    })
    return map
  }, [documentPages])

  const sortedDocuments = useMemo(() => {
    return [...documents].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [documents])

  const rows: RowData[] = useMemo(() => {
    return sortedDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name || 'Unknown Document',
      url: doc.url || '',
      prompt: doc.prompt || '',
      pages: '',
      status: '',
      actions: '',
      _doc: doc
    }))
  }, [sortedDocuments, docPagesMap])

  // Column definitions
  const columns = useMemo<ColumnDef<RowData, any>[]>(() => {
    const supportingDocs = documents.filter((doc) => isFileTypeSupported(doc.url))
    const selectedSupportingDocs = selectedDocuments.filter((id) => {
      const doc = documents.find((d) => d.id === id)
      return doc?.id && isFileTypeSupported(doc.url)
    })

    return [
      {
        id: 'select',
        size: 60,
        header: () => {
          const allChecked = supportingDocs.length > 0 && selectedSupportingDocs.length === supportingDocs.length
          const someChecked = selectedSupportingDocs.length > 0 && selectedSupportingDocs.length < supportingDocs.length

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Checkbox
                      checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectDocument('all', supportingDocs.map((doc) => doc.id))
                        } else {
                          onSelectDocument('none', [])
                        }
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Select all supported documents</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
        cell: ({ row }) => {
          const isSelected = selectedDocuments.includes(row.original.id)
          const isSupported = isFileTypeSupported(row.original.url)

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelectDocument(row.original.id, !!checked)
                      }
                      disabled={!isSupported}
                    />
                  </span>
                </TooltipTrigger>
                {!isSupported && (
                  <TooltipContent>This file format is not supported for generation</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        }
      },
      {
        accessorKey: 'name',
        header: 'Document',
        size: 250,
        cell: ({ row }) => {
          const isSelected = selectedDocuments.includes(row.original.id)
          const isGenerating = isDocumentGenerating(row.original.id)

          return (
            <div
              className={cn(
                "font-bold cursor-pointer w-full flex items-center py-1 gap-2",
                isSelected
                  ? "text-primary"
                  : isGenerating
                  ? "text-primary"
                  : "text-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation()
                openDialog('pagePreview', row.original._doc)
              }}
            >
              {isGenerating && <Spinner size="sm" />}
              {row.getValue('name')}
            </div>
          )
        }
      },
      {
        id: 'status',
        header: 'Status',
        size: 180,
        cell: ({ row }) => {
          const docPage = docPagesMap[row.original.id]
          const hasPages = docPage && docPage.numberOfNodePages > 0
          const hasPrompt = row.original.prompt && row.original.prompt.trim()
          const isGenerating = isDocumentGenerating(row.original.id)
          const isSupported = isFileTypeSupported(row.original.url)

          return (
            <div className="flex flex-row gap-1 items-center flex-wrap">
              {!isSupported ? (
                <Badge variant="secondary" className="text-xs h-6 bg-gray-400 text-white">
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Unsupported Format
                </Badge>
              ) : isGenerating ? (
                <Badge className="text-xs h-6 bg-blue-500 text-white">
                  <Spinner size="sm" className="mr-1" />
                  Generating...
                </Badge>
              ) : hasPages ? (
                <Badge className="text-xs h-6 bg-green-500 text-white">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Digitized
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs h-6">
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Not Digitized
                </Badge>
              )}

              {!isGenerating &&
                isSupported &&
                (hasPrompt ? (
                  <Badge
                    className="text-xs h-[22px] bg-primary/80 text-primary-foreground cursor-pointer hover:bg-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDialog('docDetail', row.original._doc, false)
                    }}
                  >
                    Prompt
                  </Badge>
                ) : (
                  <Badge
                    className="text-xs h-[22px] bg-yellow-500 text-white cursor-pointer hover:bg-yellow-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDialog('docDetail', row.original._doc, true)
                    }}
                  >
                    No prompt
                  </Badge>
                ))}
            </div>
          )
        }
      },
      {
        id: 'pages',
        header: 'Pages',
        size: 220,
        cell: ({ row }) => {
          const docPage = docPagesMap[row.original.id]

          const renderPageCount = () => {
            if (docPage && docPage.numberOfNodePages) {
              const { numberOfNodePages, documentPages: docPages } = docPage
              const missingPages = (docPages ?? 0) - (numberOfNodePages ?? 0)

              return (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute -top-2 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {numberOfNodePages}
                    </span>
                  </div>
                  <span className="text-sm">
                    {numberOfNodePages === 1 ? '1 page' : `${numberOfNodePages} pages`}
                    {missingPages > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({missingPages} missing)
                      </span>
                    )}
                  </span>
                </div>
              )
            }
            return <span className="text-sm text-muted-foreground">No pages</span>
          }

          return (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                openDialog('pagePreview', row.original._doc)
              }}
            >
              {renderPageCount()}
            </div>
          )
        }
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => {
          const docId = row.original.id

          return (
            <div className="relative" ref={actionMenuOpen === docId ? menuRef : undefined}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionMenuDoc(row.original._doc)
                  setActionMenuOpen(docId)
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {actionMenuOpen === docId && actionMenuDoc && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-md border bg-popover shadow-md">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => {
                      setActionMenuOpen(null)
                      openDialog('docDetail', actionMenuDoc, true)
                      setActionMenuDoc(null)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Document
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-destructive"
                    onClick={() => {
                      setActionMenuOpen(null)
                      openDialog('delete', actionMenuDoc)
                      setActionMenuDoc(null)
                      setSelectedDocuments([])
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Document
                  </button>
                </div>
              )}
            </div>
          )
        }
      }
    ]
  }, [documents, selectedDocuments, docPagesMap, actionMenuOpen, actionMenuDoc])

  const pageCount = Math.ceil(totalDocuments / pageSize)

  const table = useReactTable({
    data: rows,
    columns,
    pageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination: {
        pageIndex: page,
        pageSize
      }
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: page, pageSize })
        setPage(newState.pageIndex)
      }
    }
  })

  if (!sortedDocuments.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No documents to display. Please add some above.
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto rounded transition-all duration-300",
        isLoading && "blur-sm"
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex justify-center items-center rounded">
          <Spinner size="lg" />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-[var(--gendox-table-header)]">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isSelected = selectedDocuments.includes(row.original.id)
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "transition-all duration-200",
                      isSelected && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-normal leading-relaxed py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} total
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm text-muted-foreground">
            Page {page + 1} of {pageCount || 1}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(pageCount - 1)}
              disabled={page >= pageCount - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentDigitizationGrid
