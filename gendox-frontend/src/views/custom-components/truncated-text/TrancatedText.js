import React from 'react'
import { Tooltip, Box } from '@mui/material'

const TruncatedText = ({ text, limit = 30, tooltipTextSize = 3, sx = {}, cursor = 'pointer' }) => {
    if(!text) return ''
  const shouldTruncate = text && text.length > limit
  const displayText = text.length > limit ? text.slice(0, limit) + '...' : text
  const tooltipLimitedText = text.length > limit * tooltipTextSize ? text.slice(0, limit * tooltipTextSize) + '...' : text

  if (!shouldTruncate) {
    return (
      <Box component="span" sx={sx}>
        {text}
      </Box>
    )
  }

  return (
    <Tooltip title={tooltipLimitedText} arrow placement="top">
      <Box component="span" sx={{ cursor, ...sx }}>
        {displayText}
      </Box>
    </Tooltip>
  )
}

export default TruncatedText