import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"
import projectService from "src/gendox-sdk/projectService"
import { toast } from "sonner"
import { getErrorMessage } from "src/utils/errorHandler"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <Separator />
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name *</Label>
              <Input
                id="project-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="autoTraining"
                checked={autoTraining}
                onCheckedChange={(checked) =>
                  setAutoTraining(checked as boolean)
                }
              />
              <Label htmlFor="autoTraining">Auto-Training</Label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <Button type="submit" size="lg">
                Submit
              </Button>
              <Button type="reset" variant="outline" size="lg">
                Reset
              </Button>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

export default ProjectCreate
