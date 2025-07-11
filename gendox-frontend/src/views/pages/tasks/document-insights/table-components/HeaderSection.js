import React from 'react'
import { Box, Typography, Stack, Button, Tooltip, Divider } from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import DescriptionIcon from '@mui/icons-material/Description'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import Icon from 'src/views/custom-components/mui/icon/icon'

const HeaderSection = ({ title, description, openUploader, onAddQuestion, onGenerateAll, disableGenerateAll, isLoading }) => {
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
            <Button
              variant='outlined'
              startIcon={<DocumentScannerIcon />}
              onClick={openUploader}
              disabled={isLoading}
              size='medium'
            >
              Add Document
            </Button>
          </Tooltip>
          <Tooltip title={isLoading ? 'Loading data, please wait...' : 'Add a new question to the list'}>
            <Button
              variant='outlined'
              startIcon={<DescriptionIcon />}
              onClick={onAddQuestion}
              disabled={isLoading}
              size='medium'
            >
              Add Question
            </Button>
          </Tooltip>
        </Stack>

        {/* Generate ALL button */}

        <Tooltip
          title={
            disableGenerateAll
              ? 'Add documents and questions first'
              : isLoading
              ? 'Loading answers...'
              : 'Generate answers for all documents'
          }
        >
          <span>
            <Button
              variant='contained'
              color='primary'
              size='large'
              startIcon={<RocketLaunchIcon />}
              onClick={onGenerateAll}
              disabled={disableGenerateAll || isLoading}
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 3px 10px rgb(0 0 0 / 0.15)',
                ':hover': {
                  boxShadow: '0 6px 15px rgb(0 0 0 / 0.3)'
                }
              }}
            >
              Generate ALL
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  )
}

export default HeaderSection
