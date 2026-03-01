import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "src/authentication/useAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"
import ProjectSettingsCard from "src/views/pages/project-settings-components/ProjectSettingsCard"

const ProjectSettings = () => {
  const auth = useAuth() as any
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const [isBlurring, setIsBlurring] = useState(false)

  const handleGoBack = () => {
    router.push(
      `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
    )
  }

  const project = useSelector(
    (state: any) => state.activeProject.projectDetails
  )

  useEffect(() => {
    const loadProjectDetails = async () => {
      if (projectId && organizationId) {
        setIsBlurring(true)
        const activeOrganization = auth.user.organizations.find(
          (org: any) => org.id === organizationId
        )
        const selectedProject = activeOrganization?.projects.find(
          (proj: any) => proj.id === projectId
        )
        setTimeout(() => {
          setIsBlurring(false)
        }, 300)
      }
    }
    loadProjectDetails()
  }, [auth, organizationId, projectId])

  return (
    <TooltipProvider>
      <Card
        className={`bg-transparent shadow-none border-none ${
          isBlurring ? "blur-sm" : ""
        } transition-all duration-300`}
      >
        <ResponsiveCardContent className="bg-card">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-2xl font-semibold text-muted-foreground mb-2">
                Project Settings
              </h4>
              <h6 className="text-lg font-normal text-primary">
                {project?.name || "No Selected"}
              </h6>
            </div>
            <div className="inline-flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                    className="mb-6 text-primary"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </ResponsiveCardContent>
        <div className="mt-6">
          <ProjectSettingsCard />
        </div>
      </Card>
    </TooltipProvider>
  )
}

ProjectSettings.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default ProjectSettings
