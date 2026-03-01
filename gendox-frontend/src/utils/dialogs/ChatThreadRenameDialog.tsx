import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface ChatThreadRenameDialogProps {
  open: boolean
  onClose: () => void
  onRename: () => void
  newName: string
  setNewName: (name: string) => void
}

const ChatThreadRenameDialog = ({
  open,
  onClose,
  onRename,
  newName,
  setNewName,
}: ChatThreadRenameDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="thread-name">New Name</Label>
          <Input
            id="thread-name"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onRename}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ChatThreadRenameDialog
