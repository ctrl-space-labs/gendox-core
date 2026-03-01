import { useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { ArrowLeft, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { localStorageConstants } from "src/utils/generalConstants"
import { fetchTaskById } from "src/store/activeTask/activeTask"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"
import DocumentDigitizationTable from "src/views/pages/tasks/document-digitization/DocumentDigitizationTable"
import { GenerationMonitorProvider } from "src/views/pages/tasks/generation/GenerationContext"
import GlobalGenerationStatus from "src/views/pages/tasks/generation/GlobalGenerationStatus"

const DocumentDigitization = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  )

  const { organizationId, taskId, projectId } = router.query as Record<
    string,
    string
  >

  const { selectedTask, isLoading } = useSelector(
    (state: any) => state.activeTask
  )

  const handleGoBack = () => {
    router.push(
      `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
    )
  }

  useEffect(() => {
    if (organizationId && projectId && taskId && token) {
      ;(dispatch as any)(
        (fetchTaskById as any)({ organizationId, projectId, taskId, token })
      )
    }
  }, [organizationId, projectId, taskId, token, dispatch])

  return (
    <GenerationMonitorProvider>
      <GlobalGenerationStatus />
      <Card className="bg-transparent shadow-none border-none">
        <ResponsiveCardContent className="bg-card">
          <div
            className={`flex justify-between items-center ${
              isLoading ? "blur-sm" : ""
            } transition-all duration-300`}
          >
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-left">
                Document Digitization
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 mb-6 text-primary"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View and manage digitization for your document</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="inline-flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mb-6 text-primary"
                      onClick={handleGoBack}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </ResponsiveCardContent>
        <div className="h-5" />

        <DocumentDigitizationTable selectedTask={selectedTask} />
      </Card>
    </GenerationMonitorProvider>
  )
}

export default DocumentDigitization
