import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { Settings, Cog } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ProjectButtons from "src/views/custom-components/home-page-components/project-buttons-components/ProjectButtons"
import Documents from "src/views/custom-components/home-page-components/document-components/Documents"
import Tasks from "src/views/custom-components/home-page-components/task-components/Tasks"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"

const GendoxHome = () => {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const project = useSelector((state: any) => state.activeProject.projectDetails)
  const isBlurring = useSelector((state: any) => state.activeProject.isBlurring)

  const handleSettingsClick = () => {
    const path = `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`
    router.push(path)
  }

  return (
    <TooltipProvider>
      <Card className="bg-transparent shadow-none border-none">
        <ResponsiveCardContent className="bg-card -mb-7">
          <div className="flex justify-between items-center">
            {organizationId && projectId && projectId !== "null" ? (
              <div
                className={`flex-grow flex flex-col ${
                  isBlurring ? "blur-sm" : ""
                } transition-all duration-300`}
              >
                <h4 className="text-2xl font-semibold text-left">
                  {project?.name || "No Selected "} Project
                </h4>
              </div>
            ) : (
              <h4 className="text-2xl font-semibold text-left">
                No Project Selected
              </h4>
            )}

            <div className="flex items-center">
              {organizationId && projectId && projectId !== "null" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSettingsClick}
                      className="ml-2 text-2xl"
                    >
                      <Cog className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Project Settings</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-muted-foreground cursor-not-allowed"
                      disabled
                    >
                      <Cog className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>No Project Selected</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </ResponsiveCardContent>

        {/* Project Buttons */}
        <ResponsiveCardContent className="bg-card">
          <ProjectButtons />
        </ResponsiveCardContent>
        <div className="mt-6">
          {/* Tasks Section */}
          <Tasks />
        </div>
        <div className="mt-6">
          {/* Documents Section */}
          <Documents />
        </div>
      </Card>
    </TooltipProvider>
  )
}

GendoxHome.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default GendoxHome
