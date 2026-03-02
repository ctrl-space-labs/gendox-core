import React, { useMemo } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

              {/* Document actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 p-1 rounded hover:bg-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openDialog('pagePreview', row.original._doc)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      openDialog('delete', row.original._doc)
                      setSelectedDocuments([])
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

            {/* Question actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 p-1 rounded hover:bg-accent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDialog('questionDetail', q)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Question
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => openDialog('delete', q)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Question
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

    </div>
  )
}

export default DocumentInsightsGrid
