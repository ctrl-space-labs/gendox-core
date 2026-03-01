import { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  contentText: ReactNode
  confirmButtonText: string
  cancelButtonText: string
  disableConfirm?: boolean
}

export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  contentText,
  confirmButtonText,
  cancelButtonText,
  disableConfirm,
}: DeleteConfirmDialogProps) => {
  const isLoading = disableConfirm

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner size="md" />
          </div>
        )}
        <DialogDescription
          className={`${isLoading ? "blur-sm" : ""} transition-all duration-300`}
        >
          {contentText}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteConfirmDialog
