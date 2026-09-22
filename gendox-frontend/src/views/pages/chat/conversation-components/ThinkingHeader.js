import React, { useState } from 'react'
import { Box, Typography, Collapse, useTheme } from '@mui/material'
import PsychologyIcon from '@mui/icons-material/Psychology'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import GendoxMarkdownRenderer from '../../markdown-renderer/GendoxMarkdownRenderer'

/**
 * Collapsed header revealing the model's reasoning. Mirrors ToolCallHeader, since both
 * show what the assistant did before answering and sit side by side in the thread.
 *
 * @param {string} props.reasoning - normalized by the backend, so provider-agnostic
 */
const ThinkingHeader = ({ reasoning }) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  if (!reasoning) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        mb: 1
      }}
    >
      <Box
        onClick={() => setOpen(x => !x)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          border: `1px solid ${theme.palette.divider}`,
          // Quieter than a tool call at a glance.
          borderLeft: `4px solid ${theme.palette.secondary.main}`,
          borderRadius: 1,
          px: 1,
          py: 0.5,
          minHeight: 32,
          userSelect: 'none',
          alignSelf: 'flex-start'
        }}
      >
        <PsychologyIcon fontSize='small' sx={{ mr: 0.5, color: theme.palette.secondary.main }} />
        <Typography variant='body2' sx={{ flex: 1, lineHeight: 1.1 }}>
          {open ? 'Hide thinking' : 'Show thinking'}
        </Typography>
        <ExpandMoreIcon
          fontSize='small'
          sx={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease'
          }}
        />
      </Box>

      <Collapse in={open} timeout='auto'>
        <Box
          sx={{
            mt: 0.5,
            ml: 4,
            borderLeft: `2px solid ${theme.palette.divider}`,
            pl: 1,
            // Traces get long; cap rather than push the answer off screen.
            maxHeight: 400,
            overflowY: 'auto',
            color: theme.palette.text.secondary,
            '& p, & li': { fontSize: '0.8125rem' }
          }}
        >
          <GendoxMarkdownRenderer markdownText={reasoning} />
        </Box>
      </Collapse>
    </Box>
  )
}

export default ThinkingHeader
