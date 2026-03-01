import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { Brain, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import documentService from "@/gendox-sdk/documentService"
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog"
import { useAuth } from "@/authentication/useAuth"
import { getErrorMessage } from "@/utils/errorHandler"
import { localStorageConstants } from "@/utils/generalConstants"
import commonConfig from "@/configs/common.config.js"
import {
  fetchProject,
  updateProject,
  deleteProject,
} from "@/store/activeProject/activeProject"

const GeneralProjectSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { provenAiEnabled, provenAiUrl } = commonConfig as any

  const {
    projectDetails: project,
    isBlurring,
    isUpdating: isUpdatingProject,
    isDeleting: isDeletingProject,
  } = useSelector((state: any) => state.activeProject)

  const [autoTraining, setAutoTraining] = useState(!!project.autoTraining)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const auth = useAuth() as any

  useEffect(() => {
    if (project) {
      setAutoTraining(!!project.autoTraining)
      setName(project.name)
      setDescription(project.description)
    }
  }, [project])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setName(e.target.value)
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => setDescription(e.target.value)
  const handleAutoTrainingChange = (checked: boolean) =>
    setAutoTraining(checked)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updatedProjectPayload = {
      id: project.id,
      organizationId: project.organizationId,
      name,
      description,
      autoTraining,
      projectAgent: project.projectAgent,
    }

    ;(dispatch as any)(
      (updateProject as any)({
        organizationId: project.organizationId,
        projectId: project.id,
        updatedProjectPayload,
        token,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Project updated successfully!")
        ;(dispatch as any)(
          (fetchProject as any)({
            organizationId: project.organizationId,
            projectId: project.id,
            token,
          })
        )
      })
      .catch((error: any) => {
        toast.error(
          `Failed to update project. Error: ${getErrorMessage(error)}`
        )
      })
  }

  const handleTrainingClick = () => {
    documentService
      .triggerJobs(
        project.organizationId,
        project.id,
        token,
        "SPLITTER_AND_TRAINING",
        project.id
      )
      .then(() => {
        toast.success("Training triggered successfully!")
      })
      .catch((error: any) => {
        toast.error(
          `Failed to trigger training. Error: ${getErrorMessage(error)}`
        )
      })
  }

  const handleDeleteClickOpen = () => setOpenDeleteDialog(true)
  const handleDeleteClose = () => setOpenDeleteDialog(false)

  const handleDeleteProject = async () => {
    ;(dispatch as any)(
      (deleteProject as any)({
        organizationId: project.organizationId,
        projectId: project.id,
        token,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Project deleted successfully!")

        const updatedOrganization = auth.user.organizations.find(
          (org: any) => org.id === project.organizationId
        )
        const updatedProjects = updatedOrganization?.projects.filter(
          (proj: any) => proj.id !== project.id
        )
        const firstActiveProject = updatedProjects && updatedProjects[0]
        if (firstActiveProject) {
          window.location.href = `/gendox/home/?organizationId=${project.organizationId}&projectId=${firstActiveProject.id}`
        } else {
          window.location.href = `/gendox/create-project/?organizationId=${project.organizationId}`
        }
      })
      .catch((error: any) => {
        toast.error(
          `Project deletion failed. Error: ${getErrorMessage(error)}`
        )
        router.push("/gendox/home")
      })
  }

  return (
    <Card>
      <CardHeader />
      <div className="relative">
        <div
          className={`${
            isDeletingProject || isUpdatingProject || isBlurring
              ? "blur-sm"
              : ""
          } transition-all duration-300`}
        >
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {/* Project Name */}
              <div className="w-full md:w-1/2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={handleNameChange}
                  className="mt-1"
                />
              </div>

              {/* Project Description */}
              <div>
                <Label htmlFor="project-description">
                  Project Description
                </Label>
                <Textarea
                  id="project-description"
                  rows={4}
                  value={description}
                  onChange={handleDescriptionChange}
                  className="mt-1"
                />
              </div>

              {/* Auto-training checkbox */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoTraining"
                        checked={autoTraining}
                        onCheckedChange={handleAutoTrainingChange}
                      />
                      <Label htmlFor="autoTraining" className="cursor-pointer">
                        auto-training
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Enable auto-training for the project. If checked, uploaded
                    files will be automatically processed without manual
                    trigger. This may increase processing costs depending on
                    usage.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Buttons row */}
              <div className="flex items-center gap-2 flex-wrap">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="lg"
                        onClick={handleTrainingClick}
                      >
                        <span className="mr-1">Training</span>
                        <Brain className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Start project training manually. Files that have been
                      uploaded will be processed by the system. You may need
                      to wait ~5 minutes, then go to chat and ask it a
                      question!
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {provenAiEnabled && (
                  <Button variant="outline" size="lg" asChild>
                    <a
                      href={`${provenAiUrl}/provenAI/data-pods-control/?organizationId=${project.organizationId}&dataPodId=${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="mr-1">Go to Proven-Ai</span>
                      <ArrowRight className="h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>

            <Separator />

            <CardFooter className="flex justify-end py-6 gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleDeleteClickOpen}
              >
                Delete
              </Button>
              <Button size="lg" type="submit" onClick={handleSubmit}>
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </div>
      </div>

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        contentText={`Are you sure you want to delete ${project.name}? All member users will be removed and you will lose access to all related documents. This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </Card>
  )
}

export default GeneralProjectSettings
