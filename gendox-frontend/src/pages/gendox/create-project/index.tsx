import { useState } from "react"
import { useRouter } from "next/router"
import { FolderPlus, RotateCcw, Loader2 } from "lucide-react"
import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"
import projectService from "src/gendox-sdk/projectService"
import { toast } from "sonner"
import { getErrorMessage } from "src/utils/errorHandler"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

const ProjectCreate = () => {
  const auth = useAuth()
  const router = useRouter()
  const { organizationId } = router.query
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  const [autoTraining, setAutoTraining] = useState(true)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newProjectPayload = {
      organizationId,
      name,
      description,
      autoTraining,
    }

    try {
      const response = await (projectService as any).createProject(
        organizationId,
        newProjectPayload,
        token
      )
      toast.success("Project created successfully")
      await auth.loadUserProfileFromAuthState(auth.oidcAuthState)
      router.push(
        `/gendox/home/?organizationId=${organizationId}&projectId=${response.data.id}`
      )
    } catch (error: any) {
      toast.error(`Project did not create. Error: ${getErrorMessage(error)}`)
      console.error("Failed to create project", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName("")
    setDescription("")
    setAutoTraining(true)
  }

  return (
    <div className="flex justify-center py-8 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Create New Project</CardTitle>
              <CardDescription>
                Set up a new project to organize your documents and AI agents.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="e.g. Customer Support Knowledge Base"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Describe the purpose of this project..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A brief description helps collaborators understand this
                project&apos;s purpose.
              </p>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <Checkbox
                id="autoTraining"
                checked={autoTraining}
                onCheckedChange={(checked) =>
                  setAutoTraining(checked as boolean)
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="autoTraining" className="cursor-pointer">
                  Auto-Training
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically train the AI agent when new documents are
                  uploaded.
                </p>
              </div>
            </div>
          </CardContent>
          <Separator />
          <div className="flex items-center justify-end gap-3 p-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="mr-2 h-4 w-4" />
              )}
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProjectCreate
