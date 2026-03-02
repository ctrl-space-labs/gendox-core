import React, { useMemo, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import {
  Trash,
  MoreVertical,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { answerFlagEnum } from 'src/utils/tasks/answerFlagEnum'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'

interface DocumentInsightsGridProps {
  openDialog: (dialogType: string, node?: any) => void
  documents: any[]
  questions: any[]
  answers: any[]
  isPageLoading: boolean
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  totalDocuments: number
  selectedDocuments?: string[]
  setSelectedDocuments: (docs: string[]) => void
  onSelectDocument?: (docId: string, checked: boolean | string[]) => void
  handleGenerate: (params: any) => void
  isGeneratingCells?: Record<string, boolean>
}

const DocumentInsightsGrid = ({
  openDialog,
  documents,
  questions,
  answers,
  isPageLoading,
  page,
  pageSize,
  setPage,
  setPageSize,
  totalDocuments,
  selectedDocuments = [],
  setSelectedDocuments,
  onSelectDocument = () => {},
  handleGenerate,
  isGeneratingCells = {}
}: DocumentInsightsGridProps) => {
  const [documentMenuAnchor, setDocumentMenuAnchor] = useState<{ x: number; y: number } | null>(null)
  const [documentMenuDoc, setDocumentMenuDoc] = useState<any>(null)
  const [questionMenuAnchor, setQuestionMenuAnchor] = useState<{ x: number; y: number } | null>(null)
  const [questionMenuItem, setQuestionMenuItem] = useState<any>(null)
  const docMenuRef = useRef<HTMLDivElement>(null)
  const questionMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(event.target as Node)) {
        setDocumentMenuAnchor(null)
        setDocumentMenuDoc(null)
      }
      if (questionMenuRef.current && !questionMenuRef.current.contains(event.target as Node)) {
        setQuestionMenuAnchor(null)
        setQuestionMenuItem(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order)
  }, [questions])

  const rows = useMemo(() => {
    const sortedDocs = [...documents].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateA - dateB
    })
    return sortedDocs.map((doc) => {
      const row: any = {
        id: doc.id,
        name: doc.name || '',
        documentId: doc.documentId,
        _doc: doc
      }

      sortedQuestions.forEach((q) => {
        const answerObj = answers.find((a: any) => a.documentNodeId === doc.id && a.questionNodeId === q.id)
        row[`q_${q.id}`] = answerObj ? answerObj.answerValue : ''
      })

      return row
    })
  }, [documents, sortedQuestions, answers])

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    const docsWithQuestions = documents.filter((doc) => doc.id && sortedQuestions.length > 0)
    const selectedDocsWithQuestions = selectedDocuments.filter((id) => {
      const doc = documents.find((d: any) => d.id === id)
      return doc?.id && sortedQuestions.length > 0
    })

    const cols: ColumnDef<any, any>[] = [
      {
        id: 'select',
        size: 60,
        enableSorting: false,
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={
                      docsWithQuestions.length > 0 && selectedDocsWithQuestions.length === docsWithQuestions.length
                    }
                    // Indeterminate is handled via ref
                    ref={(el) => {
                      if (el) {
                        const isIndeterminate =
                          selectedDocsWithQuestions.length > 0 &&
                          selectedDocsWithQuestions.length < docsWithQuestions.length
                        ;(el as any).dataset.state = isIndeterminate
                          ? 'indeterminate'
                          : docsWithQuestions.length > 0 && selectedDocsWithQuestions.length === docsWithQuestions.length
                          ? 'checked'
                          : 'unchecked'
                      }
                    }}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectDocument(
                          'all',
                          docsWithQuestions.map((doc: any) => doc.id)
                        )
                      } else {
                        onSelectDocument('none', [])
                      }
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Select all documents</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: ({ row }) => {
          const isSelected = selectedDocuments.includes(row.original.id)
          const hasQuestions = sortedQuestions.length > 0
          const canSelect = hasQuestions

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectDocument(row.original.id, !!checked)}
                      disabled={!canSelect}
                    />
                  </div>
                </TooltipTrigger>
                {!hasQuestions && (
                  <TooltipContent>Please add questions to enable selection for generation</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        }
      },
      {
        id: 'summaryAction',
        size: 50,
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => {
          const summaryFlag = row.original._doc?.insightsSummary?.answerFlagEnum
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDialog('summaryDetail', row.original._doc)
                    }}
                  >
                    {answerFlagEnum(summaryFlag, null)}
                  </button>
                </TooltipTrigger>
                <TooltipContent>View Summary</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
      },
      {
        accessorKey: 'name',
        header: () => <span className="font-semibold">Document</span>,
        size: 350,
        enableSorting: false,
        cell: ({ row }) => {
          const isSelected = selectedDocuments.includes(row.original.id)

          return (
            <div
              className="relative flex items-center gap-2 w-full cursor-pointer pr-8 group"
              onClick={(e) => {
                e.stopPropagation()
                openDialog('pagePreview', row.original._doc)
              }}
              title={row.original.name || (row.original.documentId ? 'Unknown Document' : 'Select Document')}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden text-ellipsis flex-grow select-none",
                        isSelected
                          ? "text-primary font-semibold"
                          : row.original.documentId
                          ? "text-foreground font-normal"
                          : "text-primary font-semibold"
                      )}
                    >
                      {row.original.name
                        ? <TruncatedText text={row.original.name} />
                        : (row.original.documentId ? 'Unknown Document' : 'Select Document')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>View Document</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Hover-reveal vertical icon */}
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 p-1 rounded hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  setDocumentMenuDoc(row.original._doc)
                  const rect = e.currentTarget.getBoundingClientRect()
                  setDocumentMenuAnchor({ x: rect.right, y: rect.bottom })
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          )
        }
      },

      // Dynamic question columns
      ...sortedQuestions.map((q) => ({
        id: `q_${q.id}`,
        accessorKey: `q_${q.id}`,
        size: 240,
        enableSorting: false,
        header: () => (
          <div className="relative flex items-center justify-start gap-1 pr-2 select-none cursor-default whitespace-nowrap overflow-hidden text-ellipsis font-semibold flex-grow group">
            <button
              type="button"
              onClick={() => openDialog('questionDetail', q)}
              aria-label={`View question details for ${q.text}`}
              className="cursor-pointer flex-grow whitespace-nowrap overflow-hidden text-ellipsis pr-7 text-left hover:underline focus-visible:underline outline-none bg-transparent border-none p-0 m-0 font-semibold text-sm"
            >
              <TruncatedText text={q.title || q.text} />
            </button>

            {/* Hover-reveal Vertical Icon */}
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 p-1 rounded hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation()
                setQuestionMenuItem(q)
                const rect = e.currentTarget.getBoundingClientRect()
                setQuestionMenuAnchor({ x: rect.right, y: rect.bottom })
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        ),
        cell: ({ row }: { row: any }) => {
          const docId = row.original.id
          const questionId = q.id
          const answerObj = answers.find(
            (a: any) => a.documentNodeId === docId && a.questionNodeId === questionId
          )
          const cellKey = `${docId}_${questionId}`
          const docKey = `${docId}_all`
          const isCellGenerating = !!isGeneratingCells[cellKey]
          const isDocGenerating = !!isGeneratingCells[docKey]
          const isGenerating = isCellGenerating || isDocGenerating

          if (isGenerating) {
            return (
              <div className="w-full flex items-center justify-center h-full">
                <Spinner size="sm" />
              </div>
            )
          }

          return (
            <div
              className={cn(
                "w-full h-full px-2 py-1 text-sm bg-transparent select-none rounded border border-transparent flex items-center gap-2 relative pr-8 group",
                isPageLoading ? "cursor-default opacity-50" : "cursor-pointer opacity-100"
              )}
              onClick={() => {
                if (isPageLoading) return

                if (!answerObj?.answerValue) {
                  handleGenerate({ documentsToGenerate: row.original, questionsToGenerate: q })
                } else {
                  openDialog('answerDetail', answerObj)
                }
              }}
            >
              {answerFlagEnum(answerObj?.answerFlagEnum, null)}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate">
                      {!answerObj ? (
                        <em className="text-muted-foreground">Click to generate</em>
                      ) : answerObj.answerValue === '' ? (
                        <em className="text-muted-foreground">Click to see answer details</em>
                      ) : (
                        answerObj.answerValue
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {!answerObj ? 'Click to generate this answer' : 'Click to see answer details'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {answerObj && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 text-primary hover:text-primary/80"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerate({ documentsToGenerate: row.original, questionsToGenerate: q })
                        }}
                        aria-label={`Regenerate answer for ${q.text}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Regenerate answer</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )
        }
      }))
    ]

    return cols
  }, [
    sortedQuestions,
    answers,
    isPageLoading,
    documents,
    selectedDocuments,
    onSelectDocument,
    openDialog,
    isGeneratingCells,
    handleGenerate
  ])

  const pageCount = Math.ceil(totalDocuments / pageSize)

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      pagination: { pageIndex: page, pageSize }
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: page, pageSize })
        setPage(newState.pageIndex)
      }
    }
  })

  if (!documents.length && !questions.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No documents or questions to display. Please add some above.
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto rounded transition-[filter] duration-300",
        isPageLoading && "blur-sm"
      )}
      style={{ minHeight: 650 }}
    >
      {isPageLoading && (
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
                  <TableHead
                    key={header.id}
                    className="bg-[var(--gendox-table-header)]"
                    style={{ width: header.getSize(), minWidth: header.getSize() }}
                  >
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-2 whitespace-normal leading-snug"
                      style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <div className="flex items-center justify-between px-2 py-3">
        <div className="text-sm text-muted-foreground">
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

      {/* Document Context Menu */}
      {documentMenuAnchor && documentMenuDoc && (
        <div
          ref={docMenuRef}
          className="fixed z-50 min-w-[180px] rounded-md border bg-popover shadow-md py-1"
          style={{ top: documentMenuAnchor.y, left: documentMenuAnchor.x - 180 }}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => {
              setDocumentMenuAnchor(null)
              openDialog('pagePreview', documentMenuDoc)
              setDocumentMenuDoc(null)
            }}
          >
            <FileText className="h-4 w-4" />
            View Document
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive"
            onClick={() => {
              setDocumentMenuAnchor(null)
              openDialog('delete', documentMenuDoc)
              setDocumentMenuDoc(null)
              setSelectedDocuments([])
            }}
          >
            <Trash className="h-4 w-4" />
            Remove Document
          </button>
        </div>
      )}

      {/* Question Context Menu */}
      {questionMenuAnchor && questionMenuItem && (
        <div
          ref={questionMenuRef}
          className="fixed z-50 min-w-[180px] rounded-md border bg-popover shadow-md py-1"
          style={{ top: questionMenuAnchor.y, left: questionMenuAnchor.x - 180 }}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => {
              setQuestionMenuAnchor(null)
              openDialog('questionDetail', questionMenuItem)
              setQuestionMenuItem(null)
            }}
          >
            <FileText className="h-4 w-4" />
            View Question
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive"
            onClick={() => {
              setQuestionMenuAnchor(null)
              openDialog('delete', questionMenuItem)
              setQuestionMenuItem(null)
            }}
          >
            <Trash className="h-4 w-4" />
            Delete Question
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentInsightsGrid
