import { useState } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/router"
import { useSettings } from "src/@core/hooks/useSettings"
import { FilePlus, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import UploaderDocument from "src/views/custom-components/home-page-components/project-buttons-components/UploaderDocument"

const ProjectButtons = () => {
  const project = useSelector((state: any) => state.activeProject.projectDetails)
  const router = useRouter()
  const { settings } = useSettings()
  const isDemo = settings.isDemo
  const [showUploader, setShowUploader] = useState(false)

  return (
    <TooltipProvider>
      <Separator className="my-4" />
      <div className="flex flex-wrap gap-3">
        {isDemo ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Not available in demo mode</TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href={`/gendox/create-document/?organizationId=${project.organizationId}&projectId=${project.id}`}
          >
            <Button variant="outline">
              <FilePlus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </Link>
        )}

        <Button variant="outline" onClick={() => setShowUploader(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription className="sr-only">
              Upload a new document to the project
            </DialogDescription>
          </DialogHeader>
          <UploaderDocument closeUploader={() => setShowUploader(false)} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

export default ProjectButtons
