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
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'

const MAX_COLLAPSED_HEIGHT = 80

interface SummaryDialogProps {
  open: boolean
  onClose: () => void
  activeDocument: any
}

const SummaryDialog = ({ open, onClose, activeDocument }: SummaryDialogProps) => {
  if (!activeDocument) return null

  const insightsSummary = activeDocument?.insightsSummary || {}
  const flagProps = getAnswerFlagProps(insightsSummary.answerFlagEnum)

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
            <DialogTitle className="font-semibold">Summary Details</DialogTitle>
            <Badge variant={getBadgeVariant(flagProps.chipColor)} className="flex items-center gap-1">
              {answerFlagEnum(insightsSummary.answerFlagEnum, null)}
              {flagProps.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="border-t border-border" />

        <div className="py-3">
          <ExpandableMarkdownSection
            label="Summary"
            markdown={insightsSummary.answerText || '*N/A*'}
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

export default SummaryDialog
