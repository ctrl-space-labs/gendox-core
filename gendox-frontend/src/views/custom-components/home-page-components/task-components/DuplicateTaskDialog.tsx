import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { duplicateTask, fetchTasks } from "src/store/activeTask/activeTask"

interface DuplicateTaskDialogProps {
  open: boolean
  onClose: () => void
  task: any
  organizationId: string
  projectId: string
  token: string | null
}

const DuplicateTaskDialog = ({
  open,
  onClose,
  task,
  organizationId,
  projectId,
  token,
}: DuplicateTaskDialogProps) => {
  const dispatch = useDispatch()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [keepQuestions, setKeepQuestions] = useState(true)
  const [keepDocuments, setKeepDocuments] = useState(true)

  useEffect(() => {
    if (task && open) {
      setTitle(task.title + " (copy)")
      setDescription(task.description || "")
    }
  }, [task, open])

  const handleDuplicate = async () => {
    try {
      const payload = {
        taskId: task.id,
        newTitle: title,
        newDescription: description,
        keepQuestions,
        keepDocuments,
      }

      await (dispatch as any)(
        duplicateTask({
          organizationId,
          projectId,
          payload,
          token,
        })
      ).unwrap()

      toast.success("Task duplicated successfully!")
      ;(dispatch as any)(fetchTasks({ organizationId, projectId, token }))
      onClose()
    } catch (err) {
      toast.error("Failed to duplicate task.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Duplicate Task</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mb-4">
          Customize the duplicated task and choose what to copy from the
          original:
        </DialogDescription>

        <div className="space-y-3">
          <div>
            <Label htmlFor="dup-title">New Task Title</Label>
            <Input
              id="dup-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="dup-desc">New Task Description</Label>
            <Textarea
              id="dup-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="keep-questions"
              checked={keepQuestions}
              onCheckedChange={(val) => setKeepQuestions(val as boolean)}
            />
            <Label htmlFor="keep-questions">Copy questions</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="keep-documents"
              checked={keepDocuments}
              onCheckedChange={(val) => setKeepDocuments(val as boolean)}
            />
            <Label htmlFor="keep-documents">Copy documents</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate}>Duplicate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DuplicateTaskDialog
