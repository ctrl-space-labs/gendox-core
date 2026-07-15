import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { Box, Typography, Stack, Button, Tooltip, Divider, Menu, MenuItem, CircularProgress } from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import StopIcon from '@mui/icons-material/Stop'
import toast from 'react-hot-toast'

import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import RequireOrgRoles from 'src/authentication/components/RequireOrgRoles'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'

const HeaderSection = ({
  title,
  description,
  openAddDocument,
  handleGenerate,
  isLoading,
  selectedDocuments,
  isDigitizationGenerating = false,
  documents = []
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

  const canGenerateAll = useHasOrgRole({ organizationId, roles: ['ROLE_OWNER', 'ROLE_ADMIN'] })

  const disableGenerate = isLoading || documents.length === 0 || isDigitizationGenerating
  const dropdownDisabled = isLoading || documents.length === 0 || (!canGenerateAll && selectedDocuments.length === 0)

  const canStopGeneration =
    isDigitizationGenerating &&
    generationJobExecutionId != null &&
    taskId != null &&
    String(generationTaskId) === String(taskId)

  const handleStopGeneration = async () => {
    setAnchorEl(null)
    if (!canStopGeneration || !organizationId || !projectId || !token) return

    toast('Stopping may take up to a minute for the job to fully stop.', {
      icon: '⚠️'
    })

    try {
      await taskService.stopJob(organizationId, projectId, generationJobExecutionId, token)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  useEffect(() => {
      if (!isDigitizationGenerating) {
        setGeneratingType(null)
      }
    }, [isDigitizationGenerating])

  // Execute the actual generation
  const executeGeneration = type => {
    setConfirmGeneration(null)
    setAnchorEl(null)
    setGeneratingType(type)

    switch (type) {
      case 'all':
        handleGenerate({ documentsToGenerate: [], reGenerateExistingAnswers: true })
        break
      case 'new':
        if (selectedDocuments.length > 0) {
          const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
          handleGenerate({ documentsToGenerate: selectedDocs, reGenerateExistingAnswers: false })
        } else {
          handleGenerate({ documentsToGenerate: [], reGenerateExistingAnswers: false })
        }
        break
      case 'selected':
        const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
        handleGenerate({ documentsToGenerate: selectedDocs, reGenerateExistingAnswers: true })
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
    if (isDigitizationGenerating && generatingType) {
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
        loading: isDigitizationGenerating,
        disabled: disableGenerate
      }
    }

    // Always default to "Generate New" as main button
    return {
      text: `Generate New`,
      type: 'new',
      loading: isDigitizationGenerating,
      disabled: disableGenerate
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

      {/* Action buttons: Add Document */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent='space-between'
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap='100%'>
          <Tooltip title={isLoading ? 'Loading data, please wait...' : 'Add a new document to your task'}>
            <span>
              <Button
                variant='outlined'
                startIcon={<DocumentScannerIcon />}
                onClick={openAddDocument}
                disabled={isLoading}
                size='medium'
                fullWidth
              >
                Add Document
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap='100%'>
          <Tooltip title={isLoading ? 'Loading...' : buttonConfig.text}>
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
                  onClick={() => setConfirmGeneration(buttonConfig.type)}
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

                {isDigitizationGenerating && (
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
                    alignSelf: 'stretch',
                    flexShrink: 0,
                    minWidth: '40px',
                    px: 0,
                    py: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    ml: '-1px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                  disabled={disableGenerate}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isDigitizationGenerating ? (
                      <CircularProgress size={16} color='primary' />
                    ) : (
                      <RocketLaunchIcon fontSize='small' color='primary' />
                    )}
                    Generate New ({selectedDocuments.length})
                  </Box>
                </MenuItem>,

                <RequireOrgRoles key='generate-all' organizationId={organizationId} roles={['ROLE_OWNER', 'ROLE_ADMIN']}>
                  <MenuItem
                    onClick={() => setConfirmGeneration('all')}
                    disabled={
                      disableGenerate ||
                      (() => {
                        const docsWithPrompts = documents.filter(
                          doc => doc.prompt && doc.prompt.trim() && isFileTypeSupported(doc.url || doc.name)
                        )

                        return docsWithPrompts.length === 0
                      })()
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isDigitizationGenerating ? (
                        <CircularProgress size={16} color='success' />
                      ) : (
                        <RocketLaunchIcon fontSize='small' color='success' />
                      )}
                      Generate All
                    </Box>
                  </MenuItem>
                </RequireOrgRoles>
              ]}

              {/* When main button is "Generate New" - show only Generate All */}
              {selectedDocuments.length === 0 && (
                <RequireOrgRoles organizationId={organizationId} roles={['ROLE_OWNER', 'ROLE_ADMIN']}>
                  <MenuItem
                    onClick={() => setConfirmGeneration('all')}
                    disabled={
                      disableGenerate ||
                      (() => {
                        const docsWithPrompts = documents.filter(
                          doc => doc.prompt && doc.prompt.trim() && isFileTypeSupported(doc.url || doc.name)
                        )

                        return docsWithPrompts.length === 0
                      })()
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isDigitizationGenerating ? (
                        <CircularProgress size={16} color='success' />
                      ) : (
                        <RocketLaunchIcon fontSize='small' color='success' />
                      )}
                      Generate All
                    </Box>
                  </MenuItem>
                </RequireOrgRoles>
              )}

              {disableGenerate && (
                <Box sx={{ px: 2, pb: 1, pt: 0.5, fontSize: '0.85rem', color: 'grey.600' }}>
                  {isLoading ? 'Loading, please wait...' : 'Add documents to enable generation.'}
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
