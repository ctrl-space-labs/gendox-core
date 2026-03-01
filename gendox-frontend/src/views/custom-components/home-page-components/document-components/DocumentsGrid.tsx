import { useState, useEffect } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { useDispatch, useSelector } from "react-redux"
import { MoreVertical, FileText, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog"
import documentService from "src/gendox-sdk/documentService"
import { fetchDocuments } from "src/store/activeDocument/activeDocument"
import { localStorageConstants } from "src/utils/generalConstants"
import { getErrorMessage } from "src/utils/errorHandler"
import TruncatedText from "src/views/custom-components/truncated-text/TrancatedText"

interface DocumentsGridProps {
  documents: any[]
  showAll: boolean
  setShowAll: (val: boolean) => void
  page: number
}

const DocumentsGrid = ({
  documents,
  showAll,
  setShowAll,
  page,
}: DocumentsGridProps) => {
  const dispatch = useDispatch()
  const { projectDetails, projectMembers } = useSelector(
    (state: any) => state.activeProject
  )
  const { id: projectId, organizationId } = projectDetails
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)

  useEffect(() => {
    setShowAll(false)
  }, [projectDetails])

  const toggleShowAll = () => setShowAll(!showAll)

  const handleDeleteDocument = async () => {
    setIsBlurring(true)
    setConfirmDelete(false)
    try {
      await (documentService as any).deleteDocument(
        organizationId,
        projectId,
        selectedDocument.id,
        token
      )
      toast.success("Document deleted successfully!")
      setSelectedDocument(null)
      setIsBlurring(false)
      ;(dispatch as any)(
        fetchDocuments({
          organizationId,
          projectId,
          token,
          page,
          target: "projectDocuments",
        })
      )
    } catch (error: any) {
      console.error("Failed to delete document:", error)
      toast.error(
        `Document deletion failed. Error: ${getErrorMessage(error)}`
      )
      setSelectedDocument(null)
      setIsBlurring(false)
    }
  }

  const renderDocuments = () => {
    const visibleDocuments = showAll ? documents : documents.slice(0, 3)

    return visibleDocuments.map((document: any) => {
      const documentAuthor = projectMembers.find(
        (projMem: any) => projMem?.user.id === document.createdBy
      )
      const relativeDate = formatDistanceToNow(parseISO(document.createAt), {
        addSuffix: true,
      })

      return (
        <div key={document.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
          <Card className="p-5 h-full flex flex-col relative hover:shadow-md transition-shadow">
            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setSelectedDocument(document)
                    setConfirmDelete(true)
                  }}
                >
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Title */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <Link
                href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}&projectId=${projectId}`}
                className="text-sm font-semibold no-underline hover:text-primary transition-colors truncate"
              >
                <TruncatedText text={document.title} />
              </Link>
            </div>

            {/* Author Info */}
            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              <p>
                {documentAuthor
                  ? documentAuthor.user.name
                  : "Unknown Author"}
              </p>
              <p className="text-xs">
                {documentAuthor
                  ? documentAuthor.user.email
                  : "Unknown Email"}
              </p>
            </div>

            {/* Date */}
            <p className="mt-auto text-xs text-muted-foreground">
              Created {relativeDate}
            </p>
          </Card>
        </div>
      )
    })
  }

  return (
    <TooltipProvider>
      <div
        className={`grid grid-cols-12 gap-4 ${
          isBlurring ? "blur-sm" : ""
        } transition-all duration-300`}
      >
        {renderDocuments()}
        {documents.length > 3 && (
          <div className="col-span-12 text-center">
            <Separator className="my-3" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShowAll}
                  className="text-muted-foreground"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showAll ? "Show Less" : "Show More"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteDocument}
        title="Confirm Deletion"
        contentText={
          selectedDocument
            ? `Are you sure you want to delete "${selectedDocument.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this document? This action cannot be undone."
        }
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </TooltipProvider>
  )
}

export default DocumentsGrid
