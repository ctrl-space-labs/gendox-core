import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { ArrowLeft, Settings } from "lucide-react"
import { useAuth } from "src/authentication/useAuth"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ProjectSettingsCard from "src/views/pages/project-settings-components/ProjectSettingsCard"

const ProjectSettings = () => {
  const auth = useAuth() as any
  const router = useRouter()
  const { organizationId, projectId } = router.query

  const project = useSelector(
    (state: any) => state.activeProject.projectDetails
  )

  const handleGoBack = () => {
    router.push(
      `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 py-6 px-4 sm:px-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Project Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                {project?.name || "No project selected"}
              </p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Home</TooltipContent>
          </Tooltip>
        </div>

        <ProjectSettingsCard />
      </div>
    </TooltipProvider>
  )
}

ProjectSettings.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default ProjectSettings
