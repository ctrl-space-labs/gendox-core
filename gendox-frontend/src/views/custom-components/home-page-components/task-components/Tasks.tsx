import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "src/authentication/useAuth"
import { Plus, Info } from "lucide-react"
import { debounce } from "lodash"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import TasksList from "./TasksList"
import CreateTaskDialog from "./CreateOrEditTaskDialog"
import { fetchTasks, createTask } from "src/store/activeTask/activeTask"
import { isValidOrganizationAndProject } from "src/utils/validators"
import { localStorageConstants } from "src/utils/generalConstants"
import SearchBar from "src/utils/SearchBar"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"

const Tasks = () => {
  const { user } = useAuth() as any
  const router = useRouter()
  const dispatch = useDispatch()

  const { organizationId, projectId } = router.query
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  const { projectTasks, isLoading } = useSelector(
    (state: any) => state.activeTask
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (!value) {
        setFilteredTasks(projectTasks)
        return
      }
      const lower = value.toLowerCase()
      setFilteredTasks(
        projectTasks.filter(
          (task: any) =>
            task.title.toLowerCase().includes(lower) ||
            (task.description && task.description.toLowerCase().includes(lower))
        )
      )
    }, 300),
    [projectTasks]
  )

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      ;(dispatch as any)(fetchTasks({ organizationId, projectId, token }))
    }
  }, [organizationId, projectId, dispatch, token, user])

  useEffect(() => {
    setFilteredTasks(projectTasks)
  }, [projectTasks])

  useEffect(() => {
    debouncedSearch(searchText)
  }, [searchText, debouncedSearch])

  useEffect(() => {
    setCurrentPage(0)
  }, [projectId])

  const handleDialogOpen = () => setDialogOpen(true)
  const handleDialogClose = () => setDialogOpen(false)

  const handleCreateTask = async (taskData: any) => {
    if (!organizationId || !projectId) return
    const payload = {
      projectId,
      type: taskData.taskType,
      title: taskData.title,
      description: taskData.description,
    }
    try {
      await (dispatch as any)(
        createTask({
          organizationId,
          projectId,
          taskPayload: payload,
          token,
        })
      ).unwrap()
      toast.success("Task created successfully!")
      handleDialogClose()
      ;(dispatch as any)(fetchTasks({ organizationId, projectId, token }))
      setSearchText("")
    } catch (error: any) {
      toast.error(`Failed to create task: ${error}`)
    }
  }

  return (
    <TooltipProvider>
      <ResponsiveCardContent
        className={`bg-accent ${
          isLoading ? "blur-sm" : ""
        } transition-all duration-300`}
        aria-busy={isLoading}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <h5 className="text-xl font-bold">Document Analytics Tasks</h5>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary h-8 w-8"
                  aria-label="info about tasks"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Create and manage tasks for your project
              </TooltipContent>
            </Tooltip>
          </div>

          <Button onClick={handleDialogOpen} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>

        {/* Search */}
        {projectTasks.length > 0 && (
          <div className="mb-3">
            <SearchBar
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search tasks"
              clearable
              className="max-w-[400px]"
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex-grow flex justify-center items-center">
            <Spinner size="lg" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm mb-2 italic">
              There are currently no tasks available. Consider creating a new
              task to begin organizing your work efficiently.
            </p>
          </div>
        ) : (
          <TasksList
            projectTasks={filteredTasks}
            page={currentPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSave={handleCreateTask}
          initialData={{ title: "", description: "", taskType: "" }}
        />
      </ResponsiveCardContent>
    </TooltipProvider>
  )
}

export default Tasks
