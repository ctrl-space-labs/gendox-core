import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Plus, Pencil, Trash2, ScanLine, FileText, Trash, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import ExpandableMarkdownSection from '../../helping-components/ExpandableMarkodownSection'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchDocuments, resetSupportingDocuments } from 'src/store/activeDocument/activeDocument'
import { updateTaskNode, createTaskNodesBatch, deleteTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { toast } from 'sonner'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import { DeleteConfirmDialog } from 'src/utils/dialogs/DeleteConfirmDialog'
import { chunk } from 'src/utils/tasks/taskUtils'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'

const MAX_COLLAPSED_HEIGHT = 80

interface QuestionItem {
  title: string
  text: string
}

interface QuestionsDialogProps {
  open: boolean
  onClose: () => void
  activeQuestion: any
  isAddQuestionsLoading?: boolean
  addQuestionMode?: boolean
  reloadAll: () => Promise<void> | void
}

const QuestionsDialog = ({
  open,
  onClose,
  activeQuestion,
  isAddQuestionsLoading = false,
  addQuestionMode = false,
  reloadAll
}: QuestionsDialogProps) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query as Record<string, string>
  const [editMode, setEditMode] = useState(false)
  const [supportingDocsOpen, setSupportingDocsOpen] = useState(true)
  const [questionText, setQuestionText] = useState(activeQuestion?.text || '')
  const [questionTitle, setQuestionTitle] = useState(activeQuestion?.title || '')
  const [addNewQuestions, setAddNewQuestions] = useState<QuestionItem[]>([{ title: '', text: '' }])
  const [tempSupportingDocs, setTempSupportingDocs] = useState<string[]>([])
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [hasBreakingChanges, setHasBreakingChanges] = useState(false)
  const [openDeleteQuestionConfirm, setOpenDeleteQuestionConfirm] = useState(false)
  const [openConfirmAnswersDelete, setOpenConfirmAnswersDelete] = useState(false)
  const { supportingDocuments, isLoading } = useSelector((state: any) => state.activeDocument)
  const safeQuestions = Array.isArray(addNewQuestions) ? addNewQuestions : [{ title: '', text: '' }]

  const isViewMode = !addQuestionMode && !editMode
  const isEditMode = editMode
  const isAddMode = addQuestionMode

  useEffect(() => {
    if (!open || !activeQuestion) return

    setEditMode(false)
    setQuestionText(activeQuestion.text || '')
    setQuestionTitle(activeQuestion.title || '')
    setTempSupportingDocs(activeQuestion.supportingDocumentIds || [])
  }, [open])

  useEffect(() => {
    if (!open) return

    if (!tempSupportingDocs?.length) {
      ;(dispatch as any)(resetSupportingDocuments())
      return
    }

    ;(dispatch as any)(
      (fetchDocuments as any)({
        organizationId,
        projectId,
        documentIds: tempSupportingDocs,
        token,
        target: 'supportingDocuments'
      })
    )
  }, [open, tempSupportingDocs])

  useEffect(() => {
    setDialogLoading(isLoading || isAddQuestionsLoading)
  }, [isLoading, isAddQuestionsLoading])

  useEffect(() => {
    if (!activeQuestion) return

    const textChanged = questionText !== (activeQuestion.text || '')
    const docsChanged =
      JSON.stringify(tempSupportingDocs) !== JSON.stringify(activeQuestion.supportingDocumentIds || [])

    setHasBreakingChanges(textChanged || docsChanged)
  }, [questionText, tempSupportingDocs, activeQuestion])

  const handleSave = async () => {
    setDialogLoading(true)

    const updateData = {
      id: activeQuestion.id,
      taskId,
      nodeType: 'QUESTION',
      nodeValue: {
        message: questionText,
        questionTitle: questionTitle,
        documentMetadata: {
          supportingDocumentIds: tempSupportingDocs
        }
      }
    }

    try {
      await (dispatch as any)(
        (updateTaskNode as any)({
          organizationId,
          projectId,
          taskId,
          taskNodePayload: updateData,
          token
        })
      ).unwrap()
      toast.success('Question updated!')
      reloadAll()
      setEditMode(false)
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to update question')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleAddQuestions = async () => {
    const validQuestions = addNewQuestions.filter((q) => q.text.trim().length > 0 || q.title.trim().length > 0)

    if (validQuestions.length === 0) {
      toast.error('No questions to save!')
      return
    }

    try {
      const payloads = validQuestions.map((q, idx) => ({
        taskId,
        nodeType: 'QUESTION',
        nodeValue: {
          message: q.text,
          questionTitle: q.title,
          order: idx
        }
      }))

      const batches = chunk(payloads, 10)

      for (const batch of batches) {
        await (dispatch as any)(
          (createTaskNodesBatch as any)({
            organizationId,
            projectId,
            taskNodesPayload: batch,
            token
          })
        ).unwrap()
      }

      toast.success('Questions added!')
      reloadAll()
      onClose()
      setAddNewQuestions([{ title: '', text: '' }])
    } catch (error) {
      console.error(error)
      toast.error('Failed to save questions')
    }
  }

  const handleClose = () => {
    ;(dispatch as any)(resetSupportingDocuments())
    setTempSupportingDocs([])
    setEditMode(false)
    setSupportingDocsOpen(true)
    onClose()
  }

  const handleCancel = () => {
    setEditMode(false)
    resetQuestionState()
  }

  const resetQuestionState = () => {
    if (!activeQuestion) return

    setQuestionText(activeQuestion.text || '')
    setQuestionTitle(activeQuestion.title || '')
    setTempSupportingDocs(activeQuestion.supportingDocumentIds || [])
  }

  const handleQuestionChange = (idx: number, field: 'title' | 'text', value: string) => {
    const updated = [...addNewQuestions]
    updated[idx] = { ...updated[idx], [field]: value }
    setAddNewQuestions(updated)
  }

  const handleDeleteQuestion = async () => {
    setDialogLoading(true)
    try {
      await (dispatch as any)(
        (deleteTaskNode as any)({
          organizationId,
          projectId,
          taskNodeId: activeQuestion.id,
          token
        })
      ).unwrap()
      toast.success('Question deleted successfully')
      reloadAll()
      onClose()
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    } finally {
      setDialogLoading(false)
      setOpenDeleteQuestionConfirm(false)
    }
  }

  const handleAddQuestion = () => {
    setAddNewQuestions([...addNewQuestions, { title: '', text: '' }])
  }

  const handleRemoveQuestion = (idx: number) => {
    setAddNewQuestions(addNewQuestions.filter((_, i) => i !== idx))
  }

  const handleAddSupportingDoc = (newDocIds: string[]) => {
    setTempSupportingDocs((prev) => Array.from(new Set([...prev, ...newDocIds])))
    setOpenAddDocDialog(false)
  }

  const handleRemoveSupportingDoc = (id: string) => {
    setTempSupportingDocs((prev) => prev.filter((docId) => docId !== id))
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        {dialogLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
            <Spinner size="lg" />
          </div>
        )}

        <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6">
          <DialogTitle className="font-semibold">
            {isAddMode ? 'Add Questions' : isEditMode ? 'Edit Question' : 'View Question'}
          </DialogTitle>
          {isViewMode ? (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditMode(true)}
                      className="text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit question</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenDeleteQuestionConfirm(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete question</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : null}
        </DialogHeader>

        <div className="border-t border-border" />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* TITLE SECTION */}
          {!isAddMode && (
            <div className="px-2 py-2 mb-3">
              <p className="text-sm font-bold text-foreground tracking-tight mb-1">
                Title
              </p>
              {isEditMode ? (
                <Input
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  autoFocus
                  placeholder="Enter a title..."
                />
              ) : (
                <p className="text-lg font-medium text-foreground border border-border p-3 bg-background">
                  {questionTitle || 'No question title'}
                </p>
              )}
            </div>
          )}

          {/* BREAKING CHANGES WARNING */}
          {hasBreakingChanges && isEditMode && (
            <div className="mb-3 p-2 rounded border border-destructive text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="font-semibold text-sm">
                You changed the question or supporting documents. All related answers will be deleted when you save.
              </p>
            </div>
          )}

          {/* QUESTION TEXT */}
          <div className="px-2 py-2 mb-3">
            <p className="text-sm font-bold text-foreground tracking-tight mb-1">
              Question Text
            </p>

            {safeQuestions.map((q, idx) => (
              <div key={idx} className="mb-3 flex items-start gap-2">
                {/* Circle Label */}
                {isAddMode && (
                  <div className="w-8 h-8 bg-primary text-primary-foreground font-bold rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1">
                    {idx + 1}
                  </div>
                )}

                {/* EDIT / ADD / VIEW modes */}
                {isEditMode ? (
                  <Textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={4}
                    autoFocus
                    className="flex-1"
                  />
                ) : isAddMode ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <Input
                      value={q.title}
                      onChange={(e) => handleQuestionChange(idx, 'title', e.target.value)}
                      placeholder="Enter title..."
                      className="font-semibold"
                    />
                    <Textarea
                      value={q.text}
                      onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                      placeholder="Enter question text..."
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className="flex-1 border border-border p-2 bg-background">
                    <ExpandableMarkdownSection
                      label=""
                      markdown={questionText || '*No question text*'}
                      maxHeight={MAX_COLLAPSED_HEIGHT}
                    />
                  </div>
                )}

                {/* Remove Button (Add Mode Only) */}
                {isAddMode && addNewQuestions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="mt-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* ADD QUESTION BUTTON */}
            {isAddMode && (
              <div className="flex justify-center mt-3">
                <Button onClick={handleAddQuestion} className="px-6 py-3 font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Question
                </Button>
              </div>
            )}
          </div>

          {/* SUPPORTING DOCUMENTS SECTION */}
          {!isAddMode && (
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              {/* Collapsible Header */}
              <button
                onClick={() => setSupportingDocsOpen(!supportingDocsOpen)}
                className="w-full px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-accent/50"
              >
                <span className="font-semibold text-base">Supporting Documents</span>
                {supportingDocsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {supportingDocsOpen && (
                <div className="border-t border-border p-4 bg-accent/30">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="outline"
                            onClick={() => setOpenAddDocDialog(true)}
                            className="mb-2"
                            disabled={isViewMode}
                          >
                            <ScanLine className="h-4 w-4 mr-2" />
                            Add Document
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {isViewMode && (
                        <TooltipContent>You must be in edit mode to add documents</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <div className="max-h-[260px] overflow-y-auto p-1">
                    <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                      {supportingDocuments.map((doc: any) => (
                        <div
                          key={doc.documentId}
                          className="p-3 rounded-lg border border-border flex flex-col justify-between min-h-[120px] transition-all duration-200 cursor-default bg-background hover:-translate-y-1 hover:shadow-lg hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="font-semibold flex-1">
                              <TruncatedText text={doc.title} cursor="cursor-default" />
                            </span>
                          </div>

                          <div className="flex justify-between mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${doc.id}&projectId=${projectId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open
                              </a>
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive"
                                      onClick={() => handleRemoveSupportingDoc(doc.id)}
                                      disabled={isViewMode}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {isViewMode && (
                                  <TooltipContent>You must be in edit mode to remove documents</TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="justify-end py-4 px-6 border-t border-border">
          {isAddMode ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddNewQuestions([{ title: '', text: '' }])
                  handleClose()
                }}
                disabled={dialogLoading}
              >
                {dialogLoading ? 'Saving...' : 'Close'}
              </Button>
              <Button onClick={handleAddQuestions} disabled={dialogLoading}>
                {dialogLoading ? 'Saving...' : 'Save Questions'}
              </Button>
            </div>
          ) : isEditMode ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                {dialogLoading ? 'Saving...' : 'Cancel'}
              </Button>
              <Button
                disabled={dialogLoading}
                onClick={() => {
                  if (hasBreakingChanges) {
                    setOpenConfirmAnswersDelete(true)
                  } else {
                    handleSave()
                  }
                }}
              >
                {dialogLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={dialogLoading}>
                Close
              </Button>
            </div>
          )}
        </DialogFooter>

        <AddNewDocumentDialog
          open={openAddDocDialog}
          onClose={() => setOpenAddDocDialog(false)}
          existingDocumentIds={activeQuestion?.supportingDocumentIds || []}
          organizationId={organizationId}
          projectId={projectId}
          taskId={taskId}
          token={token}
          mode="supporting"
          onConfirm={(newIds: string[]) => handleAddSupportingDoc(newIds)}
          onUploadSuccess={(newDocIds: string[]) => handleAddSupportingDoc(newDocIds)}
          taskType="document-insights"
        />

        <DeleteConfirmDialog
          open={openConfirmAnswersDelete}
          onClose={() => setOpenConfirmAnswersDelete(false)}
          onConfirm={() => {
            setHasBreakingChanges(false)
            setOpenConfirmAnswersDelete(false)
            handleSave()
          }}
          title="Confirm Question Update"
          contentText="You changed the question or its supporting documents. All related answers will be permanently deleted. Do you want to proceed?"
          confirmButtonText="Yes, continue"
          cancelButtonText="Cancel"
        />

        <DeleteConfirmDialog
          open={openDeleteQuestionConfirm}
          onClose={() => setOpenDeleteQuestionConfirm(false)}
          onConfirm={handleDeleteQuestion}
          title="Remove Question"
          contentText="Are you sure you want to remove this question? This action cannot be undone."
          confirmButtonText="Remove"
          cancelButtonText="Cancel"
        />
      </DialogContent>
    </Dialog>
  )
}

export default QuestionsDialog
