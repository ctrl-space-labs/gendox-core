import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "src/authentication/useAuth"
import { LayoutGrid, List, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import DocumentsGrid from "./DocumentsGrid"
import DocumentsList from "./DocumentsList"
import { localStorageConstants } from "src/utils/generalConstants"
import { fetchDocuments } from "src/store/activeDocument/activeDocument"
import { isValidOrganizationAndProject } from "src/utils/validators"

const Documents = () => {
  const { user } = useAuth() as any
  const router = useRouter()
  const dispatch = useDispatch()

  const { organizationId, projectId } = router.query
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const { projectDocuments, isBlurring } = useSelector(
    (state: any) => state.activeDocument
  )
  const { content: documents, totalPages } = projectDocuments

  const [viewMode, setViewMode] = useState("grid")
  const [currentPage, setCurrentPage] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const hasProject = projectId && projectId !== "null"

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    setCurrentPage(0)
  }, [projectId])

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      ;(dispatch as any)(
        fetchDocuments({
          organizationId,
          projectId,
          token,
          page: currentPage,
          target: "projectDocuments",
        })
      )
    }
  }, [organizationId, projectId, currentPage, dispatch])

  useEffect(() => {
    if (!documents.length) {
      setViewMode("grid")
    }
  }, [documents])

  useEffect(() => {
    if (viewMode !== "grid") {
      setShowAll(true)
    }
  }, [viewMode])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
    }
  }

  if (!hasProject) {
    return (
      <Card className="p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-4">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Welcome to Gendox
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Select a project from the sidebar, or create a new one to get
          started with your documents and AI agents.
        </p>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={`p-6 ${
          isBlurring ? "blur-sm" : ""
        } transition-all duration-300`}
        aria-busy={isBlurring}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center ${
            documents.length ? "mb-4" : ""
          }`}
        >
          <h3 className="text-lg font-semibold">Recent Documents</h3>
          {documents.length > 0 && (
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {viewMode === "grid" ? (
          <DocumentsGrid
            documents={documents}
            showAll={showAll}
            setShowAll={setShowAll}
            page={currentPage}
          />
        ) : (
          <DocumentsList documents={documents} page={currentPage} />
        )}

        {/* Pagination */}
        {showAll && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!documents.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No documents yet. Create or upload documents to get started.
            </p>
          </div>
        )}
      </Card>
    </TooltipProvider>
  )
}

export default Documents
