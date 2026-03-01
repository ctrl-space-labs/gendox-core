import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Pencil } from 'lucide-react'
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'

const MAX_COLLAPSED_HEIGHT = 80

interface DocumentData {
  id: string
  name?: string
  prompt?: string
  structure?: string
}

interface DocumentDialogProps {
  open: boolean
  onClose: () => void
  document: DocumentData | null
  onSave: (doc: DocumentData) => void
  loading: boolean
  editMode: boolean
  setEditMode: (mode: boolean) => void
}

const DocumentDialog = ({
  open,
  onClose,
  document,
  onSave,
  loading,
  editMode,
  setEditMode
}: DocumentDialogProps) => {
  const [prompt, setPrompt] = useState(document?.prompt || '')
  const [structure, setStructure] = useState(document?.structure || '')

  useEffect(() => {
    if (!open) setEditMode(false)
  }, [open])

  useEffect(() => {
    if (document) {
      setPrompt(document.prompt || '')
      setStructure(document.structure || '')
    }
  }, [document, open])

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Document Details
            </DialogTitle>
            {!editMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit document"
                      onClick={() => setEditMode(true)}
                      className="text-primary"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit document details</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </DialogHeader>

        <div className="border-t border-border" />

        <div className="py-2 space-y-4">
          {loading && (
            <div className="flex justify-center py-4">
              <Spinner size="md" />
            </div>
          )}

          <div className="mb-3">
            <span className="block text-xs font-bold text-primary uppercase mb-1">
              Title
            </span>
            <h5 className="text-xl font-bold break-words">
              {document.name}
            </h5>
          </div>

          <div className="border-t border-border mb-2" />

          {editMode ? (
            <>
              <div>
                <span className="block text-xs font-bold text-primary uppercase mb-1">
                  Prompt
                </span>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter prompt in markdown..."
                  rows={3}
                  autoFocus
                  className="min-h-[120px] resize-y mb-4"
                />
              </div>

              <div>
                <span className="block text-xs font-bold text-primary uppercase mb-1">
                  Structure
                </span>
                <Textarea
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  placeholder="Enter structure in markdown..."
                  rows={2}
                  className="min-h-[80px] max-h-[200px] resize-y mb-4"
                />
              </div>
            </>
          ) : (
            <>
              <ExpandableMarkdownSection
                label="Prompt"
                markdown={document.prompt || '*No prompt*'}
                maxHeight={MAX_COLLAPSED_HEIGHT}
              />
              <ExpandableMarkdownSection
                label="Structure"
                markdown={document.structure || '*No structure*'}
                maxHeight={MAX_COLLAPSED_HEIGHT}
              />
            </>
          )}
        </div>

        <div className="border-t border-border" />

        <DialogFooter className="justify-end py-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => onSave({ ...document, prompt, structure })}
                disabled={loading}
              >
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
        {loading && <Spinner size="sm" />}
      </DialogContent>
    </Dialog>
  )
}

export default DocumentDialog
