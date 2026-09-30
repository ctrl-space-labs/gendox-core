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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'

import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import DescriptionIcon from '@mui/icons-material/Description'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandableMarkdownSection from '../../helping-components/ExpandableMarkodownSection'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchDocuments, resetSupportingDocuments } from 'src/store/activeDocument/activeDocument'
import { updateTaskNode, createTaskNodesBatch, deleteTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { toast } from 'react-hot-toast'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import CleanCollapse from 'src/views/custom-components/mui/collapse'
import WarningIcon from '@mui/icons-material/Warning'
import { DeleteConfirmDialog } from 'src/utils/dialogs/DeleteConfirmDialog'
import { chunk } from 'src/utils/tasks/taskUtils'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'
import DecisionQuestionConfigFields from './DecisionQuestionConfigFields'

const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

const DEFAULT_BOOLEAN_CRITERIA = {
  true: 'The criteria are satisfied',
  false: 'The criteria are not satisfied'
}

const defaultDecisionOptions = () => [
  { key: 'option_1', label: 'Option 1' },
  { key: 'option_2', label: 'Option 2' }
]

const defaultDecisionDetails = () => ({
  instructions: '',
  booleanCriteria: { ...DEFAULT_BOOLEAN_CRITERIA },
  options: defaultDecisionOptions(),
  advancedOpen: false
})

const newQuestion = () => ({
  title: '',
  text: '',
  answerMode: 'AUTO',
  decisionKind: 'BOOLEAN',
  decisionDetails: defaultDecisionDetails()
})

const decisionDetailsFromConfig = (config, questionText) => {
  const decision = config?.decision

  const options =
    decision?.kind === 'CHOICE'
      ? Object.entries(decision.choices || {}).map(([key, label]) => ({ key, label }))
      : (decision?.scoreCriteria || []).map((label, index) => ({ key: `option_${index + 1}`, label }))

  return {
    instructions: decision?.instructions === questionText ? '' : decision?.instructions || '',
    booleanCriteria: { ...DEFAULT_BOOLEAN_CRITERIA, ...(decision?.booleanCriteria || {}) },
    options: options.length > 0 ? options : defaultDecisionOptions(),
    advancedOpen: false
  }
}

const decisionValidationError = ({ answerMode, decisionKind, decisionDetails }) => {
  if (answerMode !== 'DECISION') return null

  if (decisionKind === 'BOOLEAN') {
    if (!decisionDetails.booleanCriteria.true.trim() || !decisionDetails.booleanCriteria.false.trim()) {
      return 'Yes and No meanings are required'
    }

    return null
  }

  const options = decisionDetails.options || []
  if (options.length < 2 || options.some(option => !option.label.trim())) {
    return 'Choice and rating decisions need at least two named options'
  }
  if (decisionKind === 'SCORE' && options.length > 10) {
    return 'Rating decisions support up to ten levels'
  }
  if (decisionKind === 'CHOICE') {
    const keys = options.map(option => option.key.trim())
    if (keys.some(key => !key) || new Set(keys).size !== keys.length) {
      return 'Choice option keys must be present and unique'
    }
  }

  return null
}

const buildInsightConfig = ({ answerMode, decisionKind, questionText, decisionDetails, sourceQuestion }) => {
  if (answerMode !== 'DECISION') return { version: 1, answerMode }
  const options = decisionDetails.options

  const decision = {
    kind: decisionKind,
    instructions: decisionDetails.instructions.trim() || questionText.trim(),
    booleanCriteria: {},
    choices: {},
    scoreCriteria: []
  }
  if (decisionKind === 'BOOLEAN') {
    decision.booleanCriteria = decisionDetails.booleanCriteria
  } else if (decisionKind === 'CHOICE') {
    decision.choices = Object.fromEntries(options.map(option => [option.key.trim(), option.label.trim()]))
  } else {
    decision.scoreCriteria = options.map(option => option.label.trim())
  }

  return { version: 1, answerMode, decision, ...(sourceQuestion ? { sourceQuestion } : {}) }
}

const modeLabel = mode => ({ AUTO: 'Auto', GENERATED_TEXT: 'Written answer', DECISION: 'Decision' }[mode] || mode)
const decisionKindLabel = kind => ({ BOOLEAN: 'Yes / No', CHOICE: 'Choose one', SCORE: 'Rating' }[kind] || kind)

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
  const [answerMode, setAnswerMode] = useState(activeQuestion?.insightConfig?.answerMode || 'GENERATED_TEXT')
  const [decisionKind, setDecisionKind] = useState(activeQuestion?.insightConfig?.decision?.kind || 'BOOLEAN')
  const [decisionDetails, setDecisionDetails] = useState(defaultDecisionDetails())
  const [addNewQuestions, setAddNewQuestions] = useState([newQuestion()])
  const [tempSupportingDocs, setTempSupportingDocs] = useState([])
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [hasBreakingChanges, setHasBreakingChanges] = useState(false)
  const [openDeleteQuestionConfirm, setOpenDeleteQuestionConfirm] = useState(false)
  const [openConfirmAnswersDelete, setOpenConfirmAnswersDelete] = useState(false)
  const { supportingDocuments, isLoading } = useSelector(state => state.activeDocument)

  const isViewMode = !addQuestionMode && !editMode
  const isEditMode = editMode
  const isAddMode = addQuestionMode
  const questionsToRender = isAddMode ? addNewQuestions : [null]
  const sourceQuestion = activeQuestion?.insightConfig?.sourceQuestion || ''

  const resetQuestionState = () => {
    if (!activeQuestion) return

    const config = activeQuestion.insightConfig || { answerMode: 'GENERATED_TEXT' }
    setQuestionText(activeQuestion.text || '')
    setQuestionTitle(activeQuestion.title || '')
    setAnswerMode(config.answerMode || 'GENERATED_TEXT')
    setDecisionKind(config.decision?.kind || 'BOOLEAN')
    setDecisionDetails(decisionDetailsFromConfig(config, activeQuestion.text || ''))
    setTempSupportingDocs(activeQuestion.supportingDocumentIds || [])
  }

  useEffect(() => {
    if (!open || !activeQuestion) return

    setEditMode(false) // always reset to view mode on open
    resetQuestionState()
  }, [open])

  useEffect(() => {
    if (!open) return

    // If no temp docs → clean view
    if (!tempSupportingDocs?.length) {
      dispatch(resetSupportingDocuments())

      return
    }

    dispatch(
      fetchDocuments({
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

    const configChanged =
      JSON.stringify(
        buildInsightConfig({
          answerMode,
          decisionKind,
          questionText,
          decisionDetails,
          sourceQuestion
        })
      ) !== JSON.stringify(activeQuestion.insightConfig || { version: 1, answerMode: 'GENERATED_TEXT' })

    setHasBreakingChanges(textChanged || docsChanged || configChanged)
  }, [questionText, tempSupportingDocs, answerMode, decisionKind, decisionDetails, sourceQuestion, activeQuestion])

  const handleSave = async () => {
    if (!questionText.trim()) {
      toast.error('Question text is required')

      return
    }
    const validationError = decisionValidationError({ answerMode, decisionKind, decisionDetails })
    if (validationError) {
      toast.error(validationError)

      return
    }

    setDialogLoading(true)

    const updateData = {
      id: activeQuestion.id,
      taskId,
      nodeType: 'QUESTION',
      nodeValue: {
        message: questionText,
        questionTitle: questionTitle,
        insightConfig: buildInsightConfig({
          answerMode,
          decisionKind,
          questionText,
          decisionDetails,
          sourceQuestion
        }),
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
    if (addNewQuestions.some(q => q.title.trim().length > 0 && q.text.trim().length === 0)) {
      toast.error('Question text is required')

      return
    }

    const validQuestions = addNewQuestions.filter(q => q.text.trim().length > 0)

    if (validQuestions.length === 0) {
      toast.error('No questions to save!')

      return
    }

    const validationError = validQuestions.map(decisionValidationError).find(Boolean)
    if (validationError) {
      toast.error(validationError)

      return
    }

    try {
      const payloads = validQuestions.map((q, idx) => ({
        taskId,
        nodeType: 'QUESTION',
        nodeValue: {
          message: q.text,
          questionTitle: q.title,
          order: idx,
          insightConfig: buildInsightConfig({
            answerMode: q.answerMode,
            decisionKind: q.decisionKind,
            questionText: q.text,
            decisionDetails: q.decisionDetails
          })
        }
      }))

      for (const batch of chunk(payloads, 10)) {
        await dispatch(createTaskNodesBatch({ organizationId, projectId, taskNodesPayload: batch, token })).unwrap()
      }

      toast.success('Questions added!')
      reloadAll()
      onClose()
      setAddNewQuestions([newQuestion()])
    } catch (error) {
      console.error(error)
      toast.error('Failed to save questions')
    }
  }

  const handleClose = () => {
    dispatch(resetSupportingDocuments())
    setTempSupportingDocs([])
    setEditMode(false)
    setSupportingDocsOpen(true)
    onClose()
  }

  const handleCancel = () => {
    setEditMode(false)
    resetQuestionState()
  }

  const handleQuestionChange = (idx, field, value) => {
    setAddNewQuestions(questions =>
      questions.map((question, index) => (index === idx ? { ...question, [field]: value } : question))
    )
  }

  const handleDeleteQuestion = async () => {
    setDialogLoading(true)
    try {
      await dispatch(
        deleteTaskNode({
          organizationId,
          projectId,
          taskNodeId: activeQuestion.id,
          token
        })
      ).unwrap()
      toast.success('Question deleted successfully')
      reloadAll()
      onClose() // Close the dialog after deletion
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    } finally {
      setDialogLoading(false)
      setOpenDeleteQuestionConfirm(false)
    }
  }

  const handleAddQuestion = () => {
    setAddNewQuestions(questions => [...questions, newQuestion()])
  }

  const handleRemoveQuestion = idx => {
    setAddNewQuestions(questions => questions.filter((_, index) => index !== idx))
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
          <Box>
            <Tooltip title='Edit question'>
              <IconButton
                aria-label='Edit question'
                onClick={() => setEditMode(true)}
                sx={{ color: 'primary.main', mr: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete question'>
              <IconButton
                aria-label='Delete question'
                onClick={() => setOpenDeleteQuestionConfirm(true)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
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
                Column name
              </Typography>
              {isEditMode ? (
                <TextField
                  fullWidth
                  value={questionTitle}
                  onChange={e => setQuestionTitle(e.target.value)}
                  autoFocus
                  variant='outlined'
                  placeholder='Enter a column name...'
                  helperText='Shown as the column header in the insights board.'
                  sx={{
                    backgroundColor: 'background.paper'
                  }}
                />
              ) : (
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
                color: 'warning.dark',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <WarningIcon />
              <Typography variant='body1' sx={{ fontWeight: 600 }}>
                You changed the question, answer mode, decision setup, or supporting documents. All related answers will
                be deleted when you save.
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
              {isAddMode ? 'Questions' : 'Question'}
            </Typography>

            {!isAddMode && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {isEditMode ? (
                  <FormControl size='small' sx={{ minWidth: 180 }}>
                    <InputLabel>Answer mode</InputLabel>
                    <Select
                      value={answerMode}
                      label='Answer mode'
                      onChange={event => setAnswerMode(event.target.value)}
                    >
                      <MenuItem value='GENERATED_TEXT'>Written answer</MenuItem>
                      <MenuItem value='DECISION'>Decision</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    size='small'
                    label={modeLabel(answerMode)}
                    color={answerMode === 'DECISION' ? 'secondary' : 'default'}
                  />
                )}
                {answerMode === 'DECISION' &&
                  (isEditMode ? (
                    <FormControl size='small' sx={{ minWidth: 160 }}>
                      <InputLabel>Decision type</InputLabel>
                      <Select
                        value={decisionKind}
                        label='Decision type'
                        onChange={event => setDecisionKind(event.target.value)}
                      >
                        <MenuItem value='BOOLEAN'>Yes / No</MenuItem>
                        <MenuItem value='CHOICE'>Choose one</MenuItem>
                        <MenuItem value='SCORE'>Rating</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip size='small' variant='outlined' label={decisionKindLabel(decisionKind)} />
                  ))}
              </Box>
            )}

            {questionsToRender.map((q, idx) => (
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
                  <Box sx={{ flex: 1, width: '100%' }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label='Question'
                      value={questionText}
                      onChange={e => setQuestionText(e.target.value)}
                      helperText='Ask one clear question about each document.'
                    />
                    {answerMode === 'DECISION' && (
                      <DecisionQuestionConfigFields
                        kind={decisionKind}
                        value={decisionDetails}
                        onChange={setDecisionDetails}
                      />
                    )}
                  </Box>
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
                      label='Column name'
                      placeholder='For example: Neighbourhood-level implementation'
                      helperText='Shown as the column header in the insights board.'
                      sx={{
                        mb: 2,
                        '& input': { fontWeight: 600 }
                      }}
                    />

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <FormControl size='small' sx={{ minWidth: 170 }}>
                        <InputLabel>Answer mode</InputLabel>
                        <Select
                          value={q.answerMode}
                          label='Answer mode'
                          onChange={event => handleQuestionChange(idx, 'answerMode', event.target.value)}
                        >
                          <MenuItem value='AUTO'>Auto</MenuItem>
                          <MenuItem value='GENERATED_TEXT'>Written answer</MenuItem>
                          <MenuItem value='DECISION'>Decision</MenuItem>
                        </Select>
                      </FormControl>
                      {q.answerMode === 'DECISION' && (
                        <FormControl size='small' sx={{ minWidth: 160 }}>
                          <InputLabel>Decision type</InputLabel>
                          <Select
                            value={q.decisionKind}
                            label='Decision type'
                            onChange={event => handleQuestionChange(idx, 'decisionKind', event.target.value)}
                          >
                            <MenuItem value='BOOLEAN'>Yes / No</MenuItem>
                            <MenuItem value='CHOICE'>Choose one</MenuItem>
                            <MenuItem value='SCORE'>Rating</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      value={q.text}
                      onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                      label={q.answerMode === 'AUTO' ? 'Request' : 'Question'}
                      placeholder={
                        q.answerMode === 'AUTO'
                          ? 'Describe the information or decisions you need...'
                          : 'Enter the question shown to users...'
                      }
                      helperText={
                        q.answerMode === 'AUTO'
                          ? 'Jev will decide whether this needs a written answer or one or more independent decision columns.'
                          : 'Ask one clear question about each document.'
                      }
                    />
                    {q.answerMode === 'DECISION' && (
                      <DecisionQuestionConfigFields
                        kind={q.decisionKind}
                        value={q.decisionDetails}
                        onChange={value => handleQuestionChange(idx, 'decisionDetails', value)}
                      />
                    )}
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
                    {answerMode === 'DECISION' && (
                      <DecisionQuestionConfigFields
                        kind={decisionKind}
                        value={decisionDetails}
                        onChange={setDecisionDetails}
                        readOnly
                      />
                    )}
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

          {/* SUPPORTING DOCUMENTS SECTION */}
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
                          cursor: 'default',
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
                          <Typography sx={{ fontWeight: 600, flex: 1 }}>
                            {<TruncatedText text={doc.title} cursor='default' />}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Button
                            variant='outlined'
                            size='small'
                            href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${doc.id}&projectId=${projectId}`}
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
                setAddNewQuestions([newQuestion()])
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
        taskType='document-insights'
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
        contentText='You changed the question, answer mode, decision setup, or supporting documents. All related answers will be permanently deleted. Do you want to proceed?'
        confirmButtonText='Yes, continue'
        cancelButtonText='Cancel'
      />
      <DeleteConfirmDialog
        open={openDeleteQuestionConfirm}
        onClose={() => setOpenDeleteQuestionConfirm(false)}
        onConfirm={handleDeleteQuestion}
        title='Remove Question'
        contentText='Are you sure you want to remove this question? This action cannot be undone.'
        confirmButtonText='Remove'
        cancelButtonText='Cancel'
      />
    </Dialog>
  )
}

export default QuestionsDialog
