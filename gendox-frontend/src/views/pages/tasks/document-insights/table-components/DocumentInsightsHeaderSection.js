import React, { useState } from 'react'
import { Box, Typography, Stack, Button, Tooltip, Divider, Menu, MenuItem, CircularProgress } from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import DescriptionIcon from '@mui/icons-material/Description'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DownloadIcon from '@mui/icons-material/Download'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'

const HeaderSection = ({
  title,
  description,
  openAddDocument,
  onAddQuestion,
  onGenerateNew,
  onGenerateAll,
  onGenerateSelected,
  disableGenerate,
  isPageLoading,
  onExportCsv,
  isExportingCsv,
  selectedDocuments,
  generatingAll = false,
  generatingNew = false,
  generatingSelected = false,
  documents = [],
  questions = [],
  hasGeneratedContent = () => false
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [confirmGeneration, setConfirmGeneration] = useState(null) // 'all', 'new', 'selected', or null

  const handleToggle = event => {
    setAnchorEl(prev => (prev ? null : event.currentTarget.parentElement))
  }

  

  // Handle generation with confirmation check
  const handleGenerateClick = type => {
    let targetDocs = []

    switch (type) {
      case 'all':
        targetDocs = documents.filter(doc => doc.id)
        break
      case 'new':
        targetDocs = documents.filter(doc => !hasGeneratedContent(doc.id))
        break
      case 'selected':
        targetDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
        break
    }

    // Always show confirmation for all generation types
    setConfirmGeneration(type)
  }

  // Execute the actual generation
  const executeGeneration = type => {
    setConfirmGeneration(null)
    setAnchorEl(null)

    switch (type) {
      case 'all':
        if (onGenerateAll) onGenerateAll()
        break
      case 'new':
        if (onGenerateNew) onGenerateNew()
        break
      case 'selected':
        if (onGenerateSelected) onGenerateSelected()
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
    if (selectedDocuments.length > 0) {
      return {
        text: `Generate Selected (${selectedDocuments.length})`,
        type: 'selected',
        loading: generatingSelected,
        disabled: generatingAll || generatingNew || generatingSelected
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
      loading: generatingNew,
      disabled: generatingAll || generatingNew || generatingSelected ||  questions.length === 0 || newFields === 0
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
                  onClick={() => handleGenerateClick(buttonConfig.type)}
                  disabled={buttonConfig.disabled || isPageLoading || disableGenerate}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0
                  }}
                >
                  {buttonConfig.text}
                </Button>

                <Button
                  variant='outlined'
                  color='primary'
                  size='small'
                  onClick={handleToggle}
                  disabled={isPageLoading || disableGenerate}
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
              PaperProps={{
                sx: {
                  width: anchorEl?.offsetWidth ?? 'auto'
                }
              }}
            >
              {/* Menu items based on main button state */}

              {/* When main button is "Generate Selected" - show Generate New and Generate All */}
              {selectedDocuments.length > 0 && [
                <MenuItem
                  key='generate-new'
                  onClick={() => handleGenerateClick('new')}
                  disabled={
                    generatingAll ||
                    generatingNew ||
                    generatingSelected ||
                    isPageLoading ||
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
                    {generatingNew ? (
                      <CircularProgress size={16} color='primary' />
                    ) : (
                      <RocketLaunchIcon fontSize='small' color='primary' />
                    )}
                    Generate New
                  </Box>
                </MenuItem>,

                <MenuItem
                  key='generate-all'
                  onClick={() => handleGenerateClick('all')}
                  disabled={
                    generatingAll ||
                    generatingNew ||
                    generatingSelected ||
                    isPageLoading ||
                    documents.length === 0 ||
                    questions.length === 0
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {generatingAll ? (
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
                <MenuItem
                  onClick={() => handleGenerateClick('all')}
                  disabled={
                    generatingAll ||
                    generatingNew ||
                    generatingSelected ||
                    isPageLoading ||
                    documents.length === 0 ||
                    questions.length === 0
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {generatingAll ? (
                      <CircularProgress size={16} color='success' />
                    ) : (
                      <RocketLaunchIcon fontSize='small' color='success' />
                    )}
                    Generate All
                  </Box>
                </MenuItem>
              )}

              {(disableGenerate || isPageLoading) && (
                <Box sx={{ px: 2, pb: 1, pt: 0.5, fontSize: '0.85rem', color: 'grey.600' }}>
                  {isPageLoading ? 'Loading, please wait...' : 'Add documents and questions to enable generation.'}
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
