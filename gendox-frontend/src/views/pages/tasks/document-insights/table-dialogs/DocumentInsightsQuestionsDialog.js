import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import taskService from 'src/gendox-sdk/taskService'
import { toast } from 'react-hot-toast'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import CleanCollapse from 'src/views/custom-components/mui/collapse'
const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

const QuestionsDialog = ({
  open,
  onClose,
  questions,
  setQuestions,
  onConfirm,
  handleUpdateQuestion,
  activeQuestion,
  addQuestionMode = false,
  isLoading = false
}) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query
  const [editMode, setEditMode] = useState(false)
  const [supportingDocsOpen, setSupportingDocsOpen] = useState(true)
  const [questionText, setQuestionText] = useState(activeQuestion?.text || '')
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const supportingDocuments = useSelector(state => state.activeDocument.supportingDocuments)
  const safeQuestions = Array.isArray(questions) ? questions : ['']

  const isViewMode = !addQuestionMode && !editMode
  const isEditMode = editMode
  const isAddMode = addQuestionMode

  useEffect(() => {
    setQuestionText(activeQuestion?.text || '')
  }, [activeQuestion, open])

  useEffect(() => {
    if (!activeQuestion) return
    if (!activeQuestion.supportingDocumentIds || activeQuestion.supportingDocumentIds.length === 0) return

    dispatch(
      fetchSupportingDocuments({
        organizationId,
        projectId,
        documentIds: activeQuestion.supportingDocumentIds,
        token
      })
    )
  }, [activeQuestion, dispatch])

  const handleClose = () => {
    dispatch(resetSupportingDocuments())
    setEditMode(false)
    setSupportingDocsOpen(true)
    onClose()
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

  const handleAddSupportingDoc = async newDocIds => {
    if (!activeQuestion) return
    // setSaving(true)

    try {
      const existingIds = activeQuestion.supportingDocumentIds || []

      // Combine existing + new
      const updatedIds = Array.from(new Set([...existingIds, ...newDocIds]))

      const updateData = {
        taskNodeId: activeQuestion.id,
        supportingDocumentIds: updatedIds
      }

      await taskService.updateTaskNodeForDocumentMetadata(organizationId, projectId, taskId, updateData, token)

      toast.success('Supporting documents added!')

      activeQuestion.supportingDocumentIds = updatedIds

      // Also refetch supporting docs from backend
      dispatch(
        fetchSupportingDocuments({
          organizationId,
          projectId,
          documentIds: updatedIds,
          token
        })
      )

      setOpenAddDocDialog(false)
    } catch (error) {
      console.error('Error adding supporting docs:', error)
      toast.error('Failed to add supporting documents')
    }
  }

  const handleRemoveSupportingDoc = async docIdToRemove => {
    if (!activeQuestion) return

    try {
      const oldIds = activeQuestion.supportingDocumentIds || []
      const updatedIds = oldIds.filter(id => id !== docIdToRemove)

      const updateData = {
        taskNodeId: activeQuestion.id,
        supportingDocumentIds: updatedIds
      }

      await taskService.updateTaskNodeForDocumentMetadata(organizationId, projectId, taskId, updateData, token)

      toast.success('Supporting document removed!')

      activeQuestion.supportingDocumentIds = updatedIds

      dispatch(
        fetchSupportingDocuments({
          organizationId,
          projectId,
          documentIds: updatedIds,
          token
        })
      )
    } catch (error) {
      console.error('Failed removing supporting document', error)
      toast.error('Failed to remove supporting document')
    }
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
      {isLoading && (
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
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            p: 2,
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <Box sx={{ px: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                Question Text
              </Typography>

              {isViewMode ? (
                <Tooltip title='Edit question'>
                  <IconButton
                    aria-label='Edit question'
                    onClick={() => setEditMode(true)}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : isEditMode ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={() => {
                      setEditMode(false)
                      setQuestionText(activeQuestion?.text || '')
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Cancel'}
                  </Button>
                  <Button
                    variant='contained'
                    size='small'
                    disabled={isLoading}
                    onClick={() => {
                      handleUpdateQuestion(questionText)
                      setEditMode(false)
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              ) : null}
            </Box>

            {safeQuestions.map((q, idx) => (
              <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    minWidth: 30,
                    height: 30,
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    mt: '4px'
                  }}
                >
                  {isAddMode ? idx + 1 : 'Q'}
                </Box>

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
                    onChange={e => isAddMode && handleQuestionChange(idx, e.target.value)}
                  />
                ) : (
                  <Box sx={{ mt: 1, flex: 1 }}>
                    <ExpandableMarkdownSection
                      label=''
                      markdown={questionText || '*No question text*'}
                      maxHeight={MAX_COLLAPSED_HEIGHT}
                    />
                  </Box>
                )}

                {isAddMode && questions.length > 1 && (
                  <IconButton
                    aria-label='Remove question'
                    onClick={() => handleRemoveQuestion(idx)}
                    sx={{ ml: 1, mt: 1 }}
                    size='small'
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                )}
              </Box>
            ))}

            {isAddMode && (
              <Button startIcon={<AddIcon />} onClick={handleAddQuestion} sx={{ mb: 1 }} variant='outlined' fullWidth>
                Add New
              </Button>
            )}
          </Box>

          {!isAddMode && (
            <CleanCollapse
              title='Supporting Documents'
              open={supportingDocsOpen}
              onToggle={() => setSupportingDocsOpen(!supportingDocsOpen)}
            >
              <Box>
                <Button
                  variant='outlined'
                  startIcon={<DocumentScannerIcon />}
                  onClick={() => setOpenAddDocDialog(true)}
                  sx={{ mb: 2 }}
                >
                  Add Document
                </Button>

                <Box
                  sx={{
                    maxHeight: 260,
                    overflowY: 'auto',
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
                        <IconButton size='small' color='error' onClick={() => handleRemoveSupportingDoc(doc.id)}>
                          <DeleteOutlineIcon fontSize='small' />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </CleanCollapse>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'right', py: 2 }}>
        {isAddMode ? (
          <>
            <Button
              onClick={() => {
                setQuestions([''])
                handleClose()
              }}
              variant='outlined'
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Close'}
            </Button>
            <Button variant='contained' onClick={onConfirm} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Questions'}
            </Button>
          </>
        ) : (
          <Box sx={{ mt: 4 }}>
            <Button onClick={handleClose} variant='outlined' disabled={isLoading}>
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
