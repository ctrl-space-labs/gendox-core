import React from 'react'
import { Box, IconButton, useTheme } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Chip from '../../../custom-components/mui/chip'

const InsightHeader = ({ closeInsightsToggle, selectedChatInsightsTab, setSelectedChatInsightsTab, currentMessageMetadata }) => {
  const theme = useTheme()
  const metadataCount = currentMessageMetadata?.metadata?.length || ''

  return (
    <Box
      sx={{
        height: 60,
        flexShrink: 0,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          borderRadius: '5994px',
          bgcolor: theme.palette.background.paper,
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* "Agent" Chip */}
        <Chip
          label='Agent'
          clickable // or onClick alone
          onClick={() => setSelectedChatInsightsTab('Agent')}
          // Conditionally style when selected or not:
          color={selectedChatInsightsTab === 'Agent' ? 'primary' : 'secondary'}
          variant={'outlined'}
          theme={theme}
          sx={{
            borderRadius: 999, // make it pill-shaped
            mr: 1
            // Optionally override default background colors, etc.
          }}
        />

        {/* “Sources” Chip */}
        <Chip
          label={`${metadataCount} Sources`}
          clickable
          onClick={() => setSelectedChatInsightsTab('Sources')}
          color={selectedChatInsightsTab === 'Sources' ? 'primary' : 'secondary'}
          variant={'outlined'}
          theme={theme}
          sx={{ borderRadius: 999 }}
        />
      </Box>
      <IconButton
        onClick={closeInsightsToggle}
        sx={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        <Icon icon='mdi:close' fontSize='1rem' />
      </IconButton>
    </Box>
  )
}

export default InsightHeader
