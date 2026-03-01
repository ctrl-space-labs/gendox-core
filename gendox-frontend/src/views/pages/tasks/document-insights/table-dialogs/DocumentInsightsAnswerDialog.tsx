import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { answerFlagEnum, getAnswerFlagProps } from 'src/utils/tasks/answerFlagEnum'
import { getQuestionMessageById } from 'src/utils/tasks/taskUtils'
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'

const MAX_COLLAPSED_HEIGHT = 80

interface AnswerDialogProps {
  open: boolean
  onClose: () => void
  answer: any
  questions: any[]
}

const AnswerDialog = ({ open, onClose, answer, questions }: AnswerDialogProps) => {
  if (!answer) return null

  const flagProps = getAnswerFlagProps(answer.answerFlagEnum)
  const questionText = answer ? getQuestionMessageById(questions, answer.questionNodeId) : ''

  const getBadgeVariant = (chipColor: string) => {
    switch (chipColor) {
      case 'error':
      case 'destructive':
        return 'destructive' as const
      case 'secondary':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="font-semibold">Answer Details</DialogTitle>
            <Badge variant={getBadgeVariant(flagProps.chipColor)} className="flex items-center gap-1">
              {answerFlagEnum(answer.answerFlagEnum, null)}
              {flagProps.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="border-t border-border" />

        <div className="py-3 space-y-4">
          {questionText && (
            <ExpandableMarkdownSection label="Question" markdown={questionText} maxHeight={MAX_COLLAPSED_HEIGHT} />
          )}

          <div className="border-t border-border" />

          <div className="mb-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
              Answer Value
            </span>
            <div className="flex items-center gap-2 p-2 rounded-lg min-h-[54px]">
              <h5 className="text-xl font-bold text-foreground break-words tracking-tight">
                {answer.answerValue || (
                  <span className="text-muted-foreground italic">N/A</span>
                )}
              </h5>
            </div>
          </div>

          <div className="border-t border-border my-2" />

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
