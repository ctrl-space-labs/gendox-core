import React, { useState } from 'react'
import { Box, Typography, Collapse, useTheme } from '@mui/material'
import BuildCircleIcon from '@mui/icons-material/BuildCircle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

/**
 * A compact, one‐line header that toggles a small collapse.
 *
 * @param {Object} props
 * @param {Object} props.header    – the assistant message that invoked tools
 * @param {Array<Object>} props.toolResponses – the subsequent `tool` role messages
 */
const ToolCallHeader = ({ header, outputs }) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  // Grab each tool call from the header
  const calls = header.toolCalls || []

  return (
    <Box
      sx={{
        // overall container flex
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        mb: 1,               // small gap between items
      }}
    >
      {/* ───── HEADER ROW ───── */}
      <Box
        onClick={() => setOpen(x => !x)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          border: `1px solid ${theme.palette.divider}`,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
          px: 1,               // horizontal padding
          py: 0.5,             // very tight vertical
          minHeight: 32,       // force one‐line height
          userSelect: 'none',
          alignSelf: 'flex-start',
        }}
      >
        <BuildCircleIcon
          fontSize="small"
          sx={{ mr: 0.5, color: theme.palette.primary.main }}
        />
        <Typography
          variant="body2"
          sx={{ flex: 1, lineHeight: 1.1 }}
        >
          calling {calls.map(c => c.function.name).join(', ')}
        </Typography>
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease'
          }}
        />
      </Box>

      {/* ───── COLLAPSED BODY ───── */}
      <Collapse in={open} timeout="auto">
        <Box
          sx={{
            mt: 0.5,
            ml: 4,               // indent under the header
            borderLeft: `2px solid ${theme.palette.divider}`,
            pl: 1,
          }}
        >
          {calls.map((call, i) => (
            <Box key={call.id} sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.25 }}>
                ↳ args
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {JSON.stringify(call.function.arguments, null, 2)}
              </Box>

              {outputs
                .filter(r => r.toolCallId === call.id)
                .map(resp => (
                  <Box key={resp.messageId} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.25 }}>
                      ↳ result
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}
                    >
                      {resp.message}
                    </Box>
                  </Box>
                ))}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}

export default ToolCallHeader;
