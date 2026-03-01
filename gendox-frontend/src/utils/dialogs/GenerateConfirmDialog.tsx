import { Rocket } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * Generation Types and their configurations
 */
const GENERATION_CONFIGS: Record<string, any> = {
  all: {
    title: "Regenerate All Documents",
    description:
      "Some documents already have generated answers. Regenerating will replace all existing answers with new ones.",
    warning:
      "This action cannot be undone. All existing answers will be lost.",
    buttonText: "Regenerate All",
    buttonVariant: "destructive" as const,
    showWarning: true,
  },
  new: {
    title: "Generate New Documents",
    description:
      "This will generate answers for documents that don't have existing content yet. Only documents with prompts that haven't been generated will be processed.",
    info: "This is a safe operation - no existing content will be overwritten.",
    buttonText: "Generate New",
    buttonVariant: "default" as const,
    showWarning: false,
  },
  selected: (count: number) => ({
    title: `Regenerate Selected Documents (${count})`,
    description:
      "Some selected documents already have generated answers. Regenerating will replace existing answers with new ones.",
    warning:
      "This action cannot be undone. Existing answers will be lost.",
    buttonText: "Regenerate Selected",
    buttonVariant: "destructive" as const,
    showWarning: true,
  }),
  document: {
    title: "Generate / Regenerate Document Answers",
    description:
      "This document may already have generated answers. Generating will replace any existing answers with new ones.",
    buttonText: "Generate Answers",
    buttonVariant: "destructive" as const,
    showWarning: true,
  },
}

interface GenerateConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  type: string
  selectedCount?: number
  customTitle?: string
  customDescription?: string
  customWarning?: string
  customButtonText?: string
}

export const GenerateConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  type,
  selectedCount = 0,
  customTitle,
  customDescription,
  customWarning,
  customButtonText,
}: GenerateConfirmDialogProps) => {
  const getConfig = () => {
    if (
      type === "selected" &&
      typeof GENERATION_CONFIGS.selected === "function"
    ) {
      return GENERATION_CONFIGS.selected(selectedCount)
    }
    return GENERATION_CONFIGS[type] || GENERATION_CONFIGS.new
  }

  const config = getConfig()

  const title = customTitle || config.title
  const description = customDescription || config.description
  const warning = customWarning || config.warning
  const info = config.info
  const buttonText = customButtonText || config.buttonText
  const buttonVariant = config.buttonVariant || "default"
  const showWarning = config.showWarning

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{description}</p>

          {showWarning && warning && (
            <p className="text-sm font-medium text-destructive">
              &#9888;&#65039; {warning}
            </p>
          )}

          {!showWarning && info && (
            <p className="text-sm font-medium text-blue-500">
              &#8505;&#65039; {info}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={buttonVariant} onClick={onConfirm}>
            <Rocket className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GenerateConfirmDialog
