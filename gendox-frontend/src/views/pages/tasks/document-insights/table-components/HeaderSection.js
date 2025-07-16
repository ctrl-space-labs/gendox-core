import React, { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Stack,
  Button,
  Tooltip,
  Divider,
  ClickAwayListener,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import DescriptionIcon from '@mui/icons-material/Description'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DownloadIcon from '@mui/icons-material/Download'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from 'react-hot-toast'

const HeaderSection = ({
  title,
  description,
  openUploader,
  onAddQuestion,
  onGenerate,
  disableGenerateAll,
  isLoading,
  onExportCsv,       // new callback prop for CSV export
  isExportingCsv     // new prop for loading state of export
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const anchorRef = useRef(null)

  const handleToggle = () => {
    setMenuOpen(prev => !prev)
  }

  const handleClose = event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return
    }
    setMenuOpen(false)
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

      {/* Action buttons: Add Document, Add Question */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent='space-between'
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
      >
        
        <Stack direction='row' spacing={2} flexWrap='wrap'>
          <Tooltip title={isLoading ? 'Loading data, please wait...' : 'Add a new document to your task'}>
            <span>
            <Button
              variant='outlined'
              startIcon={<DocumentScannerIcon />}
              onClick={openUploader}
              disabled={isLoading}
              size='medium'
            >
              Add Document
            </Button>
            </span>
          </Tooltip>
          <Tooltip title={isLoading ? 'Loading data, please wait...' : 'Add a new question to the list'}>
            <span>
            <Button
              variant='outlined'
              startIcon={<DescriptionIcon />}
              onClick={onAddQuestion}
              disabled={isLoading}
              size='medium'
            >
              Add Question
            </Button>
            </span>
          </Tooltip>
          
        </Stack>

        <Stack direction='row' spacing={1} alignItems='center'>
           <Tooltip title={isLoading ? 'Loading data, please wait...' : 'Export data as CSV'}>
            <span>
              <Button
                variant='outlined'
                startIcon={isExportingCsv ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={onExportCsv}
                disabled={isLoading || isExportingCsv || disableGenerateAll}
                size='medium'
              >
                {isExportingCsv ? 'Exporting...' : 'Export CSV'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={isLoading ? 'Loading...' : 'Generate new answers'}>
            <span>
              <Button
                variant='contained'
                color='primary'
                size='medium'
                startIcon={<RocketLaunchIcon />}
                onClick={() => {
                  if (!disableGenerateAll && !isLoading) {
                    onGenerate(false)   
                  }
                }}
                disabled={disableGenerateAll || isLoading}
                ref={anchorRef}
                aria-controls={menuOpen ? 'generate-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={menuOpen ? 'true' : undefined}
                sx={{ fontWeight: 700, textTransform: 'uppercase' }}
              >
                Generate New
              </Button>
            </span>
          </Tooltip>
         

          <ClickAwayListener onClickAway={handleClose}>
            <Box>
              <Tooltip title={menuOpen ? 'Close options' : 'More options'}>
                <span>
                <IconButton
                  color='primary'
                  size='large'
                  onClick={handleToggle}
                  aria-label='toggle generate options'
                  aria-controls={menuOpen ? 'generate-menu' : undefined}
                  aria-haspopup='true'
                  aria-expanded={menuOpen ? 'true' : undefined}
                  disabled={disableGenerateAll || isLoading}
                  sx={{ ml: 1 }}
                >
                  <ArrowDropDownIcon />
                </IconButton>
                </span>
              </Tooltip>

              <Menu
                id='generate-menu'
                anchorEl={anchorRef.current}
                open={menuOpen}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    if (!disableGenerateAll && !isLoading) {
                      onGenerate(true)    
                    }
                  }}
                  disabled={disableGenerateAll || isLoading}
                >
                  Generate ALL
                </MenuItem>
              </Menu>
            </Box>
          </ClickAwayListener>
        </Stack>
      </Stack>
    </Box>
  )
}

export default HeaderSection
