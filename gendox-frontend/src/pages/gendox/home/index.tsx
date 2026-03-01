import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { Cog } from "lucide-react"
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

const GendoxHome = () => {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const project = useSelector((state: any) => state.activeProject.projectDetails)
  const isBlurring = useSelector((state: any) => state.activeProject.isBlurring)
  const hasProject = organizationId && projectId && projectId !== "null"

  const handleSettingsClick = () => {
    router.push(
      `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 py-6 px-4 sm:px-8">
        {/* Project Header */}
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div
              className={`flex-grow ${
                isBlurring ? "blur-sm" : ""
              } transition-all duration-300`}
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                {hasProject
                  ? `${project?.name || ""} Project`
                  : "No Project Selected"}
              </h2>
              {hasProject && project?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {project.description}
                </p>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={hasProject ? handleSettingsClick : undefined}
                  disabled={!hasProject}
                  className="shrink-0"
                >
                  <Cog className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasProject ? "Project Settings" : "No Project Selected"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Action Buttons */}
          {hasProject && <ProjectButtons />}
        </Card>

        {/* Tasks Section */}
        {hasProject && <Tasks />}

        {/* Documents Section */}
        <Documents />
      </div>
    </TooltipProvider>
  )
}

GendoxHome.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default GendoxHome
