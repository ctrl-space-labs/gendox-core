import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "src/authentication/useAuth"
import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"
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

  return projectId && projectId !== "null" ? (
    <TooltipProvider>
      <ResponsiveCardContent
        className={`bg-accent ${
          isBlurring ? "blur-sm" : ""
        } transition-all duration-300`}
        aria-busy={isBlurring}
      >
        {/* Header Section */}
        <div
          className={`flex justify-between items-center ${
            documents.length ? "mb-4" : ""
          }`}
        >
          <h5 className="text-xl font-semibold text-left">Recent Documents</h5>
          {documents.length > 0 && (
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={
                      viewMode === "grid" ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    <LayoutGrid className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={
                        viewMode === "list"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      <List className="h-6 w-6" />
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

        {showAll && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="mr-2"
            >
              Previous
            </Button>
            <p className="mt-1.5">{`Page ${currentPage + 1} of ${totalPages}`}</p>
            <Button
              variant="ghost"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="ml-2"
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!documents.length && (
          <p className="text-sm text-center mt-40 text-muted-foreground">
            No documents available. Please create or upload new documents.
          </p>
        )}
      </ResponsiveCardContent>
    </TooltipProvider>
  ) : (
    <div
      className="flex text-center items-center flex-col bg-cover py-24"
      style={{
        backgroundImage: `url(/images/pages/pages-header-bg-light.png)`,
      }}
    >
      <h5 className="font-semibold text-2xl text-primary">
        Hello, would you like to create a new document?
      </h5>
      <div className="mt-10">
        <p className="text-sm">
          or choose an action from the buttons above
        </p>
      </div>
    </div>
  )
}

export default Documents
