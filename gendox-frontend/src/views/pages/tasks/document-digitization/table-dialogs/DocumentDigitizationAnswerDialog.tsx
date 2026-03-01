import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { answerFlagEnum, getAnswerFlagProps } from 'src/utils/tasks/answerFlagEnum'
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'

const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

interface Answer {
  answerFlagEnum?: string
  answerValue?: string
  message?: string
}

interface AnswerDialogProps {
  open: boolean
  onClose: () => void
  answer: Answer | null
}

const AnswerDialog = ({ open, onClose, answer }: AnswerDialogProps) => {
  if (!answer) return null
  const flagProps = getAnswerFlagProps(answer.answerFlagEnum)

  // Map chipColor to badge variant
  const getBadgeVariant = (chipColor: string) => {
    switch (chipColor) {
      case 'error':
      case 'destructive':
        return 'destructive' as const
      case 'secondary':
        return 'secondary' as const
      case 'success':
      case 'info':
      case 'warning':
      case 'primary':
        return 'default' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-semibold">Answer Details</DialogTitle>
            <Badge variant={getBadgeVariant(flagProps.chipColor)}>
              {flagProps.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="border-t border-border" />

        <div className="py-3 space-y-4">
          <div className="border-b border-border pb-3" />

          <div className="mb-3">
            <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
              Answer Value
            </span>
            <div className="flex items-center gap-4 p-4 rounded-lg min-h-[54px]">
              <h5 className="text-xl font-bold text-foreground break-words tracking-tight">
                {answer.answerValue || (
                  <span className="text-muted-foreground italic">N/A</span>
                )}
              </h5>
            </div>
          </div>

          <div className="border-b border-border my-2" />

          <ExpandableMarkdownSection
            label="Description"
            markdown={answer.message || '*N/A*'}
            maxHeight={MAX_COLLAPSED_HEIGHT}
          />
        </div>

        <div className="border-t border-border" />

        <DialogFooter className="justify-end py-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AnswerDialog
