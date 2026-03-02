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
import { cn } from "@/lib/utils"

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
      <DialogContent className="relative">
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription
          className={cn("transition-all duration-300", isLoading && "blur-sm")}
        >
          {contentText}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelButtonText}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteConfirmDialog
