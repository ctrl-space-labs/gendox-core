import { useState, useEffect, useMemo } from "react"
import { MoreVertical, Pencil, Copy, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataTable } from "@/components/ui/data-table"
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/router"
import { getErrorMessage } from "src/utils/errorHandler"
import { localStorageConstants } from "src/utils/generalConstants"
import CreateOrEditTaskDialog from "./CreateOrEditTaskDialog"
import DuplicateTaskDialog from "./DuplicateTaskDialog"
import { deleteTask } from "src/store/activeTask/activeTask"
import { TASK_TYPE_MAP } from "src/utils/tasks/taskUtils"

interface TasksListProps {
  projectTasks: any[]
  page: number
  onPageChange?: (page: number) => void
}

const TasksList = ({ projectTasks, page }: TasksListProps) => {
  const dispatch = useDispatch()
  const { projectDetails } = useSelector((state: any) => state.activeProject)
  const router = useRouter()
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const { id: projectId, organizationId } = projectDetails
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)

  const handleDeleteTask = async () => {
    if (!selectedTask) return
    setIsDeleting(true)

    try {
      await (dispatch as any)(
        deleteTask({
          organizationId,
          projectId,
          taskId: selectedTask.id,
          token,
        })
      ).unwrap()
      toast.success(`Task "${selectedTask.title}" deleted.`)
      setConfirmDeleteOpen(false)
    } catch (error: any) {
      toast.error(`Failed to delete task: ${getErrorMessage(error)}`)
    } finally {
      setIsDeleting(false)
      setSelectedTask(null)
    }
  }

  const handleRowClick = (row: any) => {
    const typeCode =
      row.taskType?.value || row.taskType?.name || row.type || ""

    let route = ""
    if (typeCode === "DOCUMENT_INSIGHTS") {
      route = `/gendox/tasks/document-insights/?organizationId=${organizationId}&projectId=${projectId}&taskId=${row.id}`
    } else if (typeCode === "DOCUMENT_DIGITIZATION") {
      route = `/gendox/tasks/document-digitization/?organizationId=${organizationId}&projectId=${projectId}&taskId=${row.id}`
    } else {
      return
    }

    router.push(route)
  }

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Task",
        cell: ({ row }) => (
          <span
            className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis block max-w-[220px]"
            title={row.original.title}
          >
            {row.original.title}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const typeCode =
            row.original.taskType?.value || row.original.taskType?.name || ""
          const typeInfo = (TASK_TYPE_MAP as any)[typeCode] || {
            label: "Unknown",
            color: "default",
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-default select-none">
                  {typeInfo.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{typeInfo.label}</TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span
            className="text-sm whitespace-nowrap overflow-hidden text-ellipsis block max-w-[280px]"
            title={row.original.description}
          >
            {row.original.description || "No description"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
                disabled={isDeleting}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTask(row.original)
                  setEditDialogOpen(true)
                }}
                disabled={isDeleting}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>

              {row.original.taskType?.name === "DOCUMENT_INSIGHTS" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTask(row.original)
                    setDuplicateDialogOpen(true)
                  }}
                  disabled={isDeleting}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Task
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTask(row.original)
                  setConfirmDeleteOpen(true)
                }}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isDeleting, organizationId, projectId]
  )

  return (
    <TooltipProvider>
      <Card
        className={`relative ${
          isDeleting ? "blur-sm" : ""
        } transition-all duration-300`}
      >
        {isDeleting && (
          <Progress value={100} className="absolute top-0 left-0 right-0 h-1" />
        )}

        {!projectTasks || projectTasks.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-5xl mb-2" role="img" aria-label="Empty inbox">
              📭
            </div>
            <h6 className="text-base font-bold mb-1">No tasks here yet!</h6>
            <p className="text-sm">
              Looks like you don&apos;t have any tasks yet. Why not create one
              and get started? 🚀
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={projectTasks}
            onRowClick={handleRowClick}
          />
        )}

        <DeleteConfirmDialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDeleteTask}
          title="Confirm Task Deletion"
          contentText={
            selectedTask ? (
              <span>
                Are you sure you want to delete the task{" "}
                <strong>&quot;{selectedTask.title}&quot;</strong>? This action
                cannot be undone.
              </span>
            ) : (
              "Are you sure you want to delete this task? This action cannot be undone."
            )
          }
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          disableConfirm={isDeleting}
        />
        <CreateOrEditTaskDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          initialData={selectedTask || {}}
          editMode={true}
          TASK_TYPE_MAP={TASK_TYPE_MAP}
        />
        <DuplicateTaskDialog
          open={duplicateDialogOpen}
          onClose={() => setDuplicateDialogOpen(false)}
          task={selectedTask}
          organizationId={organizationId as string}
          projectId={projectId as string}
          token={token}
        />
      </Card>
    </TooltipProvider>
  )
}

export default TasksList
