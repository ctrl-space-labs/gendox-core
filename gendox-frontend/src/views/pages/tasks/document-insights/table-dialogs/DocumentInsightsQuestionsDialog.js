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
import { updateTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { toast } from 'react-hot-toast'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import CleanCollapse from 'src/views/custom-components/mui/collapse'
const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

const QuestionsDialog = ({
  open,
  onClose,
  questions,
  setQuestions,
  handleAddQuestions,
  activeQuestion,
  addQuestionMode = false,
  isAddQuestionsLoading = false,
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
  const [tempSupportingDocs, setTempSupportingDocs] = useState([])
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)
  const { supportingDocuments, isLoading } = useSelector(state => state.activeDocument)
  const safeQuestions = Array.isArray(questions) ? questions : ['']


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

  const handleQuestionChange = (idx, value) => {
    const updated = [...questions]
    updated[idx] = value
    setQuestions(updated)
  }

  const handleAddQuestion = () => {
    setQuestions([...questions, ''])
  }

  const handleRemoveQuestion = idx => {
    setQuestions(questions.filter((_, i) => i !== idx))
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
                  <TextareaAutosizeStyled
                    autoFocus={idx === safeQuestions.length - 1}
                    placeholder='Enter question text...'
                    value={q}
                    onChange={e => handleQuestionChange(idx, e.target.value)}
                    minRows={3}
                  />
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
                {isAddMode && questions.length > 1 && (
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

            {isAddMode && (
              <Button startIcon={<AddIcon />} onClick={handleAddQuestion} variant='outlined' sx={{ mt: 1 }} fullWidth>
                Add New Question
              </Button>
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
                setQuestions([''])
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
            <Button variant='contained' disabled={dialogLoading} onClick={handleSave}>
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
    </Dialog>
  )
}

export default QuestionsDialog
