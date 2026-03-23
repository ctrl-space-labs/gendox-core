import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { Box, Typography, Stack, Button, Tooltip, Divider, Menu, MenuItem, CircularProgress } from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DescriptionIcon from '@mui/icons-material/Description'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import StopIcon from '@mui/icons-material/Stop'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DownloadIcon from '@mui/icons-material/Download'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'

const HeaderSection = ({
  title,
  description,
  openAddDocument,
  onAddQuestion,
  handleGenerate,
  isPageLoading,
  onExportCsv,
  isExportingCsv,
  selectedDocuments,
  isGenerating = false,
  documents = [],
  questions = [],
  hasGeneratedContent = () => false
}) => {
  const router = useRouter()
  const { organizationId, projectId, taskId } = router.query
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null
  const { generationJobExecutionId, generationTaskId } = useSelector(state => state.activeTask.generationState)

  const [anchorEl, setAnchorEl] = useState(null)
  const [confirmGeneration, setConfirmGeneration] = useState(null) // 'all', 'new', 'selected', or null
  const [generatingType, setGeneratingType] = useState(null)

  const handleToggle = event => {
    setAnchorEl(prev => (prev ? null : event.currentTarget.parentElement))
  }

  const disableGenerate = isPageLoading || documents.length === 0 || questions.length === 0 || isGenerating
  const dropdownDisabled = isPageLoading || documents.length === 0 || questions.length === 0

  const canStopGeneration =
    isGenerating &&
    generationJobExecutionId != null &&
    taskId != null &&
    String(generationTaskId) === String(taskId)

  const handleStopGeneration = async () => {
    setAnchorEl(null)
    if (!canStopGeneration || !organizationId || !projectId || !token) return

    toast('Stopping may take up to a minute for the job to fully stop.', {
      icon: '⚠️',
    })

    try {
      await taskService.stopJob(organizationId, projectId, generationJobExecutionId, token)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  useEffect(() => {
    if (!isGenerating) {
      setGeneratingType(null)
    }
  }, [isGenerating])

  // Execute the actual generation
  const executeGeneration = type => {
    setConfirmGeneration(null)
    setAnchorEl(null)
    setGeneratingType(type)

    switch (type) {
      case 'all':
        handleGenerate({
          documentsToGenerate: [],
          questionsToGenerate: [],
          reGenerateExistingAnswers: true
        })
        break
      case 'new':
        handleGenerate({
          documentsToGenerate: [],
          questionsToGenerate: [],
          reGenerateExistingAnswers: false
        })
        break
      case 'selected':
        const selectedDocsObjects = documents.filter(doc => selectedDocuments.includes(doc.id))
        handleGenerate({
          documentsToGenerate: selectedDocsObjects,
          questionsToGenerate: questions,
          reGenerateExistingAnswers: true
        })
        break
    }
  }

  // Handle confirmation dialog actions
  const handleConfirmGeneration = () => {
    if (confirmGeneration) {
      executeGeneration(confirmGeneration)
    }
  }

  const handleCancelGeneration = () => {
    setConfirmGeneration(null)
  }

  // Calculate button state and text
  const getMainButtonConfig = () => {
    // when is generating, show loading state
    if (isGenerating && generatingType) {
      let loadingText = 'Generating...'
      if (generatingType === 'all') loadingText = 'Generating All...'
      if (generatingType === 'new') loadingText = 'Generating New...'
      if (generatingType === 'selected') loadingText = `Generating (${selectedDocuments.length})...`

      return {
        text: loadingText,
        type: generatingType,
        loading: true,
        disabled: true
      }
    }

    // normal states
    if (selectedDocuments.length > 0) {
      return {
        text: `Generate Selected (${selectedDocuments.length})`,
        type: 'selected',
        loading: isGenerating,
        disabled: disableGenerate
      }
    }

    // Check if there are new fields (document-question combinations) that haven't been generated
    const totalCombinations = documents.length * questions.length
    const generatedCombinations = documents.reduce((count, doc) => {
      return count + questions.filter(question => hasGeneratedContent(doc.id, question.id)).length
    }, 0)
    const newFields = totalCombinations - generatedCombinations

    // Always default to "Generate New" as main button
    return {
      text: `Generate New`,
      type: 'new',
      loading: isGenerating,
      disabled: disableGenerate || newFields === 0
    }
  }

  const buttonConfig = getMainButtonConfig()

  return (
    <Box sx={{ mb: 4, px: 2 }}>
      {/* Title + Description stacked vertically */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='mdi:clipboard-check-outline' fontSize='2rem' sx={{ color: 'primary.main' }} />
          <Typography variant='h4' fontWeight={700} color='text.primary'>
            {title || 'Document Insights'}
          </Typography>
        </Box>

        <Typography
          variant='body1'
          color='text.secondary'
          sx={{ fontWeight: 400, userSelect: 'none', maxWidth: '100%', whiteSpace: 'normal' }}
          title={description || 'Analyze and manage your document insights'}
        >
          {description || 'Analyze and manage your document insights'}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Action buttons: Add Document, Add Question */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent='space-between'
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap='100%'>
          <Tooltip title={isPageLoading ? 'Loading data, please wait...' : 'Add a new document to your task'}>
            <span>
              <Button
                variant='outlined'
                startIcon={<DocumentScannerIcon />}
                onClick={openAddDocument}
                disabled={isPageLoading}
                size='medium'
                fullWidth
              >
                Add Document
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={isPageLoading ? 'Loading data, please wait...' : 'Add a new question to the list'}>
            <span>
              <Button
                variant='outlined'
                startIcon={<DescriptionIcon />}
                onClick={onAddQuestion}
                disabled={isPageLoading}
                size='medium'
                fullWidth
              >
                Add Questions
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap='100%'>
          <Tooltip title={isPageLoading ? 'Loading data, please wait...' : 'Export data as CSV'}>
            <span>
              <Button
                variant='outlined'
                startIcon={isExportingCsv ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={onExportCsv}
                disabled={isPageLoading || isExportingCsv || documents.length === 0}
                size='medium'
                fullWidth
              >
                {isExportingCsv ? 'Exporting...' : 'Export CSV'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={isPageLoading ? 'Loading...' : buttonConfig.text}>
            <span>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  width: '100%' // keeps it full width on mobile
                }}
              >
                <Button
                  variant='contained'
                  color='primary'
                  fullWidth
                  startIcon={
                    buttonConfig.loading ? <CircularProgress size={20} color='inherit' /> : <RocketLaunchIcon />
                  }
                  onClick={() => !isGenerating && setConfirmGeneration(buttonConfig.type)}
                  disabled={buttonConfig.disabled || disableGenerate}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0
                  }}
                >
                  {buttonConfig.text}
                </Button>

                {isGenerating && (
                  <Tooltip
                    title={
                      canStopGeneration
                        ? 'Stop this generation run'
                        : 'Waiting for the job to be ready…'
                    }
                  >
                    <Box component='span' sx={{ display: 'inline-flex', alignItems: 'stretch' }}>
                      <Button
                        variant='outlined'
                        color='primary'
                        size='small'
                        onClick={handleStopGeneration}
                        disabled={!canStopGeneration}
                        aria-label='Stop generation'
                        sx={{
                          alignSelf: 'stretch',
                          flexShrink: 0,
                          minWidth: '40px',
                          px: 0,
                          py: 0,
                          ml: '-1px',
                          borderRadius: 0,
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <StopIcon fontSize='small' />
                      </Button>
                    </Box>
                  </Tooltip>
                )}

                <Button
                  variant='outlined'
                  color='primary'
                  size='small'
                  onClick={handleToggle}
                  disabled={dropdownDisabled}
                  sx={{
                    minWidth: '40px',
                    px: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    ml: '-1px'
                  }}
                >
                  <ArrowDropDownIcon fontSize='small' />
                </Button>
              </Box>
            </span>
          </Tooltip>

          <Box>
            <Menu
              id='generate-menu'
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {/* Menu items based on main button state */}

              {/* When main button is "Generate Selected" - show Generate New and Generate All */}
              {selectedDocuments.length > 0 && [
                <MenuItem
                  key='generate-new'
                  onClick={() => setConfirmGeneration('new')}
                  disabled={
                    disableGenerate ||
                    (() => {
                      const newDocs = documents.filter(doc => !hasGeneratedContent(doc.id))
                      const totalCombinations = documents.length * questions.length
                      const generatedCombinations = documents.reduce((count, doc) => {
                        return count + questions.filter(question => hasGeneratedContent(doc.id, question.id)).length
                      }, 0)
                      const newFields = totalCombinations - generatedCombinations
                      return newDocs.length === 0 || questions.length === 0 || newFields === 0
                    })()
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isGenerating ? (
                      <CircularProgress size={16} color='primary' />
                    ) : (
                      <RocketLaunchIcon fontSize='small' color='primary' />
                    )}
                    Generate New
                  </Box>
                </MenuItem>,

                <MenuItem key='generate-all' onClick={() => setConfirmGeneration('all')} disabled={disableGenerate}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isGenerating ? (
                      <CircularProgress size={16} color='success' />
                    ) : (
                      <RocketLaunchIcon fontSize='small' color='success' />
                    )}
                    Generate All
                  </Box>
                </MenuItem>
              ]}

              {/* When main button is "Generate New" - show only Generate All */}
              {selectedDocuments.length === 0 && (
                <MenuItem onClick={() => setConfirmGeneration('all')} disabled={disableGenerate}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isGenerating ? (
                      <CircularProgress size={16} color='success' />
                    ) : (
                      <RocketLaunchIcon fontSize='small' color='success' />
                    )}
                    Generate All
                  </Box>
                </MenuItem>
              )}

              {disableGenerate && (
                <Box sx={{ px: 2, pb: 1, pt: 0.5, fontSize: '0.85rem', color: 'grey.600' }}>
                  {isGenerating ? 'Loading, please wait...' : 'Add documents and questions to enable generation.'}
                </Box>
              )}
            </Menu>
          </Box>
        </Stack>
      </Stack>

      {/* Generation Confirmation Dialog */}
      <GenerateConfirmDialog
        open={Boolean(confirmGeneration)}
        onClose={handleCancelGeneration}
        onConfirm={handleConfirmGeneration}
        type={confirmGeneration}
        selectedCount={selectedDocuments.length}
      />
    </Box>
  )
}

export default HeaderSection
