import { useState } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/router"
import { useSettings } from "src/@core/hooks/useSettings"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import UploaderDocument from "src/views/custom-components/home-page-components/project-buttons-components/UploaderDocument"

const ProjectButtons = () => {
  const project = useSelector((state: any) => state.activeProject.projectDetails)
  const router = useRouter()
  const { settings } = useSettings()
  const isDemo = settings.isDemo
  const [showUploader, setShowUploader] = useState(false)
  const handleOpenUploader = () => setShowUploader(true)
  const handleCloseUploader = () => setShowUploader(false)

  const buttons = [
    {
      text: "NEW DOCUMENT",
      action: () =>
        router.push(
          `/gendox/create-document/?organizationId=${project.organizationId}&projectId=${project.id}`
        ),
      href: `/gendox/create-document/?organizationId=${project.organizationId}&projectId=${project.id}`,
      isDemoOff: true,
    },
    {
      text: "UPLOAD DOCUMENT",
      action: handleOpenUploader,
      href: "#",
      isDemoOff: false,
    },
  ]

  return (
    <TooltipProvider>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {buttons.map((button, index) => (
            <div key={index}>
              {isDemo && button.isDemoOff ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="lg" disabled>
                        <Plus className="h-4 w-4 mr-1" />
                        {button.text}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Feature not available in demo mode
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link href={button.href} passHref>
                  <Button variant="outline" onClick={button.action}>
                    <Plus className="h-4 w-4 mr-1" />
                    {button.text}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg p-0">
          <UploaderDocument closeUploader={handleCloseUploader} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

export default ProjectButtons
