import React, { useState, useRef } from 'react'
import { Box, Typography, Stack, Button, Tooltip, Divider, Menu, MenuItem } from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DownloadIcon from '@mui/icons-material/Download'
import CircularProgress from '@mui/material/CircularProgress'

const HeaderSection = ({
  title,
  description,
  openAddDocument,
  onGenerate,
  disableGenerateAll,
  isLoading,
  onExportCsv,
  isExportingCsv,
  onGenerateSelected = () => {},
  isSelectingDocuments,
  setIsSelectingDocuments,
  selectedDocuments,
  setSelectedDocuments
}) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleToggle = event => {
    setAnchorEl(prev => (prev ? null : event.currentTarget.parentElement))
  }

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
          <Tooltip title={isLoading ? 'Loading data, please wait...' : 'Export data as CSV'}>
            <span>
              <Button
                variant='outlined'
                startIcon={isExportingCsv ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={onExportCsv}
                disabled={isLoading || isExportingCsv || disableGenerateAll}
                size='medium'
                fullWidth
              >
                {isExportingCsv ? 'Exporting...' : 'Export CSV'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={isLoading ? 'Loading...' : 'Generate new answers'}>
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
                  startIcon={<RocketLaunchIcon />}
                  onClick={() => {
                    if (selectedDocuments.length > 0) {
                      onGenerateSelected()
                      setSelectedDocuments([])
                    } else {
                      if (!disableGenerateAll && !isLoading) onGenerate(false)
                    }
                  }}
                  disabled={disableGenerateAll || isLoading }
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0
                  }}
                >
                  {selectedDocuments.length > 0 ? `Generate Selected (${selectedDocuments.length})` : 'Generate New'}
                </Button>

                <Button
                  variant='outlined'
                  color='primary'
                  size='small'
                  onClick={handleToggle}
                  disabled={disableGenerateAll || isLoading }
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
              {selectedDocuments.length > 0 ? (
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null)
                    if (!disableGenerateAll && !isLoading) {
                      onGenerate(false)
                    }
                  }}
                  disabled={disableGenerateAll || isLoading}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RocketLaunchIcon fontSize='small' color='primary' />
                    Generate New
                  </Box>
                </MenuItem>
              ) : null}
              <MenuItem
                onClick={() => {
                  setAnchorEl(null)
                  if (!disableGenerateAll && !isLoading) {
                    onGenerate(true)
                  }
                }}
                disabled={disableGenerateAll || isLoading}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RocketLaunchIcon fontSize='small' color='success' />
                  Generate ALL
                </Box>
              </MenuItem>
             

              {(disableGenerateAll || isLoading) && (
                <Box sx={{ px: 2, pb: 1, pt: 0.5, fontSize: '0.85rem', color: 'grey.600' }}>
                  {isLoading ? 'Loading, please wait...' : 'Add documents to enable generation.'}
                </Box>
              )}
            </Menu>
          </Box>
        </Stack>
      </Stack>
      
      {/* Status indicator for selection mode */}
      {isSelectingDocuments && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
            📋 Selection Mode Active - {selectedDocuments.length} document(s) selected
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default HeaderSection
