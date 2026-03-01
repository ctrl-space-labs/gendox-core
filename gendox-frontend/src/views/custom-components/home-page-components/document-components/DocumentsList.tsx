import { useState, useEffect, useMemo } from "react"
import { isValid, parseISO, format } from "date-fns"
import { MoreVertical } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog"
import documentService from "src/gendox-sdk/documentService"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/router"
import { fetchDocuments } from "src/store/activeDocument/activeDocument"
import { getErrorMessage } from "src/utils/errorHandler"
import { localStorageConstants } from "src/utils/generalConstants"
import TruncatedText from "src/views/custom-components/truncated-text/TrancatedText"

interface DocumentsListProps {
  documents: any[]
  page: number
}

const DocumentsList = ({ documents, page }: DocumentsListProps) => {
  const dispatch = useDispatch()
  const { projectDetails, projectMembers } = useSelector(
    (state: any) => state.activeProject
  )
  const router = useRouter()
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const { id: projectId, organizationId } = projectDetails

  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [filteredDocuments, setFilteredDocuments] = useState(documents)

  useEffect(() => {
    setFilteredDocuments(documents || [])
  }, [documents])

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue)
    const filteredRows = documents.filter((row: any) => {
      return Object.keys(row).some((field) => {
        const fieldValue = row[field]
        return (
          fieldValue &&
          fieldValue.toString().toLowerCase().includes(searchValue.toLowerCase())
        )
      })
    })
    setFilteredDocuments(searchValue.length ? filteredRows : documents)
  }

  const handleDeleteDocument = async () => {
    if (selectedDocument) {
      setIsBlurring(true)
      setConfirmDelete(false)
      try {
        await (documentService as any).deleteDocument(
          organizationId,
          projectId,
          selectedDocument.id,
          token
        )
        toast.success("The document has been successfully deleted.")
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
  }

  const handleRowClick = (row: any) => {
    router.push(
      `/gendox/document-instance/?organizationId=${organizationId}&documentId=${row.id}&projectId=${projectId}`
    )
  }

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            <TruncatedText text={row.original.title} />
          </span>
        ),
      },
      {
        id: "author",
        header: "Author",
        cell: ({ row }) => {
          const documentAuthor = projectMembers.find(
            (member: any) => member.user.id === row.original.createdBy
          )
          return (
            <span className="text-sm">
              {documentAuthor?.user?.name || "Unknown Author"}
            </span>
          )
        },
      },
      {
        id: "authorEmail",
        header: "Author Email",
        cell: ({ row }) => {
          const documentAuthor = projectMembers.find(
            (member: any) => member.user.id === row.original.createdBy
          )
          return (
            <span className="text-sm">
              {documentAuthor?.user?.email || "Unknown Email"}
            </span>
          )
        },
      },
      {
        accessorKey: "createAt",
        header: "Created At",
        cell: ({ row }) => {
          const createdAt = row.original.createAt
          const formattedDate =
            createdAt && isValid(parseISO(createdAt))
              ? format(parseISO(createdAt), "dd/MM/yyyy - HH:mm")
              : "Unknown Date"
          return <span className="text-sm">{formattedDate}</span>
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDocument(row.original)
                  setConfirmDelete(true)
                }}
              >
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [projectMembers]
  )

  return (
    <Card
      className={`${isBlurring ? "blur-sm" : ""} transition-all duration-300`}
    >
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={filteredDocuments}
          onRowClick={handleRowClick}
          searchKey="title"
        />
      </CardContent>

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
    </Card>
  )
}

export default DocumentsList
