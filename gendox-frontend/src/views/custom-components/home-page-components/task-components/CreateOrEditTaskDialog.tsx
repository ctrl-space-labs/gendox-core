import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter } from "next/router"
import { ChevronDown, Info } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchAiModels } from "src/store/activeProjectAgent/activeProjectAgent"
import { localStorageConstants } from "src/utils/generalConstants"
import { sortModels } from "src/utils/sortModels"
import {
  updateTask,
  fetchTasks,
  createTask,
} from "src/store/activeTask/activeTask"

const TASK_OPTIONS = [
  {
    value: "DOCUMENT_INSIGHTS",
    label: "Get insights from multiple documents",
    description:
      "Analyze documents and extract meaningful insights for your project.",
  },
  {
    value: "DOCUMENT_DIGITIZATION",
    label: "Digitize scanned documents page-by-page",
    description:
      "Convert scanned documents into editable digital formats.",
  },
]

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  onSave?: (taskData: any) => void
  initialData?: any
  editMode?: boolean
  TASK_TYPE_MAP?: any
}

const CreateTaskDialog = ({
  open,
  onClose,
  initialData = {},
  editMode = false,
  TASK_TYPE_MAP,
}: CreateTaskDialogProps) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, projectId } = router.query
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const { isFetchingAiModels, aiModels } = useSelector(
    (state: any) => state.activeProjectAgent
  )
  const { completionModels } = aiModels

  const [task, setTask] = useState({
    title: "",
    description: "",
    taskType: "",
    taskPrompt: "",
    topP: "",
    temperature: "",
    maxToken: "",
    completionModel: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (open) {
      setTask({
        title: initialData.title || "",
        description: initialData.description || "",
        taskType: initialData.taskType?.name || initialData.taskType || "",
        taskPrompt: initialData.taskPrompt || "",
        topP: initialData.topP || "",
        temperature: initialData.temperature || "",
        maxToken: initialData.maxToken || "",
        completionModel: initialData.completionModel?.name || "",
      })
      setErrors({})
    }
  }, [open, initialData])

  useEffect(() => {
    if (organizationId && projectId && token) {
      ;(dispatch as any)(fetchAiModels({ organizationId, projectId, token }))
    }
  }, [organizationId, projectId, token, dispatch])

  const handleChange = (key: string, value: any) => {
    setTask((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (task.taskPrompt && task.taskPrompt.length < 5) {
      newErrors.taskPrompt = "Task prompt must be at least 5 characters"
    }
    if (task.topP !== "" && (Number(task.topP) < 0 || Number(task.topP) > 1)) {
      newErrors.topP = "Top P must be between 0 and 1"
    }
    if (
      task.temperature !== "" &&
      (Number(task.temperature) < 0 || Number(task.temperature) > 1)
    ) {
      newErrors.temperature = "Temperature must be between 0 and 1"
    }
    if (task.maxToken !== "" && Number(task.maxToken) <= 0) {
      newErrors.maxToken = "Max tokens must be a positive number"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (task.title.trim() === "") return
    if (!validate()) return

    try {
      const payload = {
        projectId,
        type: task.taskType,
        title: task.title,
        description: task.description,
        taskPrompt: task.taskPrompt,
        maxToken: task.maxToken || null,
        temperature: task.temperature ? Number(task.temperature) : null,
        topP: task.topP ? Number(task.topP) : null,
        completionModel: task.completionModel
          ? { name: task.completionModel }
          : null,
      }

      if (editMode) {
        await (dispatch as any)(
          updateTask({
            organizationId,
            projectId,
            taskId: initialData.id,
            token,
            updatePayload: payload,
          })
        ).unwrap()
        toast.success("Task updated successfully.")
      } else {
        await (dispatch as any)(
          createTask({
            organizationId,
            projectId,
            taskPayload: payload,
            token,
          })
        ).unwrap()
        toast.success("Task created successfully.")
      }

      ;(dispatch as any)(fetchTasks({ organizationId, projectId, token }))
      setShowAdvanced(false)
      onClose()
    } catch (err) {
      toast.error("Failed to save task.")
    }
  }

  const handleClose = () => {
    setShowAdvanced(false)
    onClose()
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              {editMode ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            {!editMode ? (
              <div className="space-y-2">
                {TASK_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      task.taskType === option.value
                        ? "border-primary border-2 bg-primary/10"
                        : "border-border hover:border-primary"
                    }`}
                    onClick={() => handleChange("taskType", option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={task.taskType === option.value}
                        onChange={() =>
                          handleChange("taskType", option.value)
                        }
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-card cursor-not-allowed select-none mt-2">
                <p className="font-bold text-muted-foreground">
                  {TASK_TYPE_MAP?.[initialData.taskType?.name]?.label ||
                    initialData.taskType?.name ||
                    ""}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  autoFocus
                  value={task.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="task-desc">Description</Label>
                <Textarea
                  id="task-desc"
                  value={task.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <p className="font-semibold">Advanced Settings</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary h-8 w-8 ml-1"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Configure advanced parameters for your task
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-300 ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="task-prompt">Task Prompt</Label>
                  <Textarea
                    id="task-prompt"
                    value={task.taskPrompt || ""}
                    onChange={(e) =>
                      handleChange("taskPrompt", e.target.value)
                    }
                    rows={6}
                  />
                  {errors.taskPrompt && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.taskPrompt}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Completion Model</Label>
                  <Select
                    value={task.completionModel}
                    onValueChange={(val) =>
                      handleChange("completionModel", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortModels(completionModels || []).map((model: any) => (
                        <SelectItem key={model.name} value={model.name}>
                          <div>
                            <span className="font-semibold">{model.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {model.aiModelProvider?.name}
                            </span>
                            {model.modelTierType?.name === "FREE_MODEL" && (
                              <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded">
                                Free
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="top-p">Top P</Label>
                    <Input
                      id="top-p"
                      type="number"
                      value={task.topP || ""}
                      onChange={(e) => handleChange("topP", e.target.value)}
                      max={1}
                      min={0}
                      step={0.01}
                    />
                    {errors.topP && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.topP}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={task.temperature || ""}
                      onChange={(e) =>
                        handleChange("temperature", e.target.value)
                      }
                      max={1}
                      min={0}
                      step={0.01}
                    />
                    {errors.temperature && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.temperature}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={task.maxToken || ""}
                      onChange={(e) =>
                        handleChange("maxToken", Number(e.target.value))
                      }
                    />
                    {errors.maxToken && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.maxToken}
                      </p>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={editMode ? false : !task.taskType || !task.title.trim()}
            >
              {editMode ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

export default CreateTaskDialog
