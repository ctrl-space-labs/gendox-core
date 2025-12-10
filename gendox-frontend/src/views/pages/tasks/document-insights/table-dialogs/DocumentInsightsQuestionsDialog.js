import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Divider,
  Box,
  CircularProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import DescriptionIcon from '@mui/icons-material/Description'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandableMarkdownSection from '../../helping-components/ExpandableMarkodownSection'
import TextareaAutosizeStyled from '../../helping-components/TextareaAutosizeStyled'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchSupportingDocuments, resetSupportingDocuments } from 'src/store/activeDocument/activeDocument'
import { updateTaskNode, createTaskNodesBatch } from 'src/store/activeTaskNode/activeTaskNode'
import { toast } from 'react-hot-toast'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import CleanCollapse from 'src/views/custom-components/mui/collapse'
import WarningIcon from '@mui/icons-material/Warning'
import { DeleteConfirmDialog } from 'src/utils/dialogs/DeleteConfirmDialog'
import { chunk } from 'src/utils/tasks/taskUtils'

const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

const QuestionsDialog = ({
  open,
  onClose,
  activeQuestion,
  isAddQuestionsLoading = false,
  addQuestionMode = false,
  reloadAll
}) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query
  const [editMode, setEditMode] = useState(false)
  const [supportingDocsOpen, setSupportingDocsOpen] = useState(true)
  const [questionText, setQuestionText] = useState(activeQuestion?.text || '')
  const [questionTitle, setQuestionTitle] = useState(activeQuestion?.title || '')
  const [addNewQuestions, setAddNewQuestions] = useState([{ title: '', text: '' }])
  const [tempSupportingDocs, setTempSupportingDocs] = useState([])
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [hasBreakingChanges, setHasBreakingChanges] = useState(false)
  const [openConfirmAnswersDelete, setOpenConfirmAnswersDelete] = useState(false)
  const { supportingDocuments, isLoading } = useSelector(state => state.activeDocument)
  const safeQuestions = Array.isArray(addNewQuestions) ? addNewQuestions : ['']

  const isViewMode = !addQuestionMode && !editMode
  const isEditMode = editMode
  const isAddMode = addQuestionMode

  useEffect(() => {
    if (!open) return

    setEditMode(false)
    setQuestionText(activeQuestion?.text || '')
    setQuestionTitle(activeQuestion?.title || '')
    setTempSupportingDocs(activeQuestion?.supportingDocumentIds || [])
  }, [open])

  useEffect(() => {
    if (!open) return

    // If no temp docs → clean view
    if (!tempSupportingDocs?.length) {
      dispatch(resetSupportingDocuments())
      return
    }

    dispatch(
      fetchSupportingDocuments({
        organizationId,
        projectId,
        documentIds: tempSupportingDocs,
        token
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
      await dispatch(
        updateTaskNode({
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

  // save questions handler for QuestionsDialog
  const handleAddQuestions = async () => {
    // Filter out empty questions
    const validQuestions = addNewQuestions.filter(q => q.text.trim().length > 0 || q.title.trim().length > 0)

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

      // chunk is used to send batches of 10
      const batches = chunk(payloads, 10)

      for (const batch of batches) {
        await dispatch(
          createTaskNodesBatch({
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
    dispatch(resetSupportingDocuments())
    setEditMode(false)
    setSupportingDocsOpen(true)
    onClose()
  }

  const handleCancel = () => {
    setEditMode(false)
    setQuestionText(activeQuestion?.text || '')
    setQuestionTitle(activeQuestion?.title || '')
    setTempSupportingDocs(activeQuestion?.supportingDocumentIds || [])
  }

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...addNewQuestions]
    updated[idx][field] = value
    setAddNewQuestions(updated)
  }

  const handleAddQuestion = () => {
    setAddNewQuestions([...addNewQuestions, { title: '', text: '' }])
  }

  const handleRemoveQuestion = idx => {
    setAddNewQuestions(addNewQuestions.filter((_, i) => i !== idx))
  }

  const handleAddSupportingDoc = newDocIds => {
    setTempSupportingDocs(prev => Array.from(new Set([...prev, ...newDocIds])))
    setOpenAddDocDialog(false)
  }

  const handleRemoveSupportingDoc = id => {
    setTempSupportingDocs(prev => prev.filter(docId => docId !== id))
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      fullWidth
      maxWidth='xl'
      aria-labelledby='question-dialog-title'
    >
      {dialogLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'all'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <DialogTitle
        id='question-dialog-title'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600
        }}
      >
        {isAddMode ? 'Add Questions' : isEditMode ? 'Edit Question' : 'View Question'}
        {isViewMode ? (
          <Tooltip title='Edit question'>
            <IconButton aria-label='Edit question' onClick={() => setEditMode(true)} sx={{ color: 'primary.main' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            p: 2,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          {/* TITLE SECTION */}
          {!isAddMode && (
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 2,
                mb: 3
              }}
            >
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: 700, mb: 1, color: 'text.primary', letterSpacing: 0.2 }}
              >
                Title
              </Typography>
              {isEditMode ? (
                <TextField
                  fullWidth
                  multiline
                  maxRows={1}
                  value={questionTitle}
                  onChange={e => setQuestionTitle(e.target.value)}
                  autoFocus
                  variant='outlined'
                  placeholder='Enter a title...'
                  sx={{
                    backgroundColor: 'background.paper'
                  }}
                />
              ) : (
                /* VIEW MODE */
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 3,
                    backgroundColor: 'background.paper'
                  }}
                >
                  {questionTitle || 'No question title'}
                </Typography>
              )}
            </Paper>
          )}
          {/* BREAKING CHANGES WARNING */}
          {hasBreakingChanges && isEditMode && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main',
                backgroundColor: 'warning.light',
                color: 'warning.dark',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <WarningIcon />
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                You changed the question or supporting documents. All related answers will be deleted when you save.
              </Typography>
            </Box>
          )}

          {/* QUESTION TEXT */}
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 2,
              mb: 3
            }}
          >
            <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1, color: 'text.primary', letterSpacing: 0.2 }}>
              Question Text
            </Typography>

            {safeQuestions.map((q, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2
                }}
              >
                {/* Circle Label */}
                {isAddMode ? (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                      fontWeight: 700,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem'
                    }}
                  >
                    {isAddMode ? idx + 1 : 'Q'}
                  </Box>
                ) : null}

                {/* EDIT / ADD / VIEW modes */}
                {isEditMode ? (
                  <TextareaAutosizeStyled
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    minRows={3}
                    autoFocus
                  />
                ) : isAddMode ? (
                  <Box
                    sx={{
                      flex: 1,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <TextField
                      fullWidth
                      value={q.title}
                      onChange={e => handleQuestionChange(idx, 'title', e.target.value)}
                      placeholder='Enter title...'
                      sx={{
                        mb: 2,
                        '& input': { fontWeight: 600 }
                      }}
                    />

                    <TextareaAutosizeStyled
                      style={{
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      value={q.text}
                      onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                      placeholder='Enter question text...'
                      minRows={3}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 1,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <ExpandableMarkdownSection
                      label=''
                      markdown={questionText || '*No question text*'}
                      maxHeight={MAX_COLLAPSED_HEIGHT}
                    />
                  </Box>
                )}

                {/* Remove Button (Add Mode Only) */}
                {isAddMode && addNewQuestions.length > 1 && (
                  <IconButton
                    aria-label='Remove question'
                    onClick={() => handleRemoveQuestion(idx)}
                    sx={{ mt: 1 }}
                    size='small'
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                )}
              </Box>
            ))}

            {/*  ADD QUESTION BUTTON  */}
            {isAddMode && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestion}
                  variant='contained'
                  sx={{
                    px: 4,
                    py: 1.4,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    backgroundColor: theme.palette.primary.main,
                    boxShadow: 2,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      boxShadow: 4
                    }
                  }}
                >
                  Add New Question
                </Button>
              </Box>
            )}
          </Paper>

          {!isAddMode && (
            <CleanCollapse
              title='Supporting Documents'
              open={supportingDocsOpen}
              onToggle={() => setSupportingDocsOpen(!supportingDocsOpen)}
            >
              <Box>
                <Tooltip title={isViewMode ? 'You must be in edit mode to add documents' : ''}>
                  <span>
                    <Button
                      variant='outlined'
                      startIcon={<DocumentScannerIcon />}
                      onClick={() => setOpenAddDocDialog(true)}
                      sx={{ mb: 2 }}
                      disabled={isViewMode}
                    >
                      Add Document
                    </Button>
                  </span>
                </Tooltip>

                <Paper
                  elevation={0}
                  sx={{
                    maxHeight: 260,
                    overflowY: 'auto',
                    p: 1,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
                    }}
                  >
                    {supportingDocuments.map(doc => (
                      <Paper
                        key={doc.documentId}
                        elevation={1}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 120,
                          transition: '0.2s',
                          backgroundColor: 'background.paper',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DescriptionIcon color='primary' />
                          <Typography sx={{ fontWeight: 600, flex: 1 }}>{doc.title}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Button
                            variant='outlined'
                            size='small'
                            href={`http://localhost:3000/gendox/document-instance/?organizationId=${organizationId}&documentId=${doc.id}&projectId=${projectId}`}
                            target='_blank'
                            sx={{ textTransform: 'none' }}
                          >
                            Open
                          </Button>
                          <Tooltip title={isViewMode ? 'You must be in edit mode to remove documents' : ''}>
                            <span>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => handleRemoveSupportingDoc(doc.id)}
                                disabled={isViewMode}
                              >
                                <DeleteOutlineIcon fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </CleanCollapse>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'right', py: 2 }}>
        {isAddMode ? (
          <Box sx={{ display: 'flex', gap: 1, mt: 4 }}>
            <Button
              onClick={() => {
                setAddNewQuestions([''])
                handleClose()
              }}
              variant='outlined'
              disabled={dialogLoading}
            >
              {dialogLoading ? 'Saving...' : 'Close'}
            </Button>
            <Button variant='contained' onClick={handleAddQuestions} disabled={dialogLoading}>
              {dialogLoading ? 'Saving...' : 'Save Questions'}
            </Button>
          </Box>
        ) : isEditMode ? (
          <Box sx={{ display: 'flex', gap: 1, mt: 4 }}>
            <Button variant='outlined' onClick={handleCancel}>
              {dialogLoading ? 'Saving...' : 'Cancel'}
            </Button>
            <Button
              variant='contained'
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
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, mt: 4 }}>
            <Button onClick={handleClose} variant='outlined' disabled={dialogLoading}>
              Close
            </Button>
          </Box>
        )}
      </DialogActions>
      <AddNewDocumentDialog
        open={openAddDocDialog}
        onClose={() => setOpenAddDocDialog(false)}
        existingDocumentIds={activeQuestion?.supportingDocumentIds || []}
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        token={token}
        mode='supporting'
        onConfirm={newIds => handleAddSupportingDoc(newIds)}
        onUploadSuccess={newDocIds => handleAddSupportingDoc(newDocIds)}
      />
      <DeleteConfirmDialog
        open={openConfirmAnswersDelete}
        onClose={() => setOpenConfirmAnswersDelete(false)}
        onConfirm={() => {
          setHasBreakingChanges(false)
          setOpenConfirmAnswersDelete(false)
          handleSave()
        }}
        title='Confirm Question Update'
        contentText='You changed the question or its supporting documents. All related answers will be permanently deleted. Do you want to proceed?'
        confirmButtonText='Yes, continue'
        cancelButtonText='Cancel'
      />
    </Dialog>
  )
}

export default QuestionsDialog
