import { useState, useRef, useLayoutEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import GendoxMarkdownRenderer from 'src/views/pages/markdown-renderer/GendoxMarkdownRenderer'

const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

function ExpandableMarkdownSection({ label, markdown, maxHeight = MAX_COLLAPSED_HEIGHT }) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const contentRef = useRef(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setShowButton(contentRef.current.scrollHeight > maxHeight + 2) // Allow for rounding errors
    }
  }, [markdown, maxHeight])

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant='caption'
        sx={{
          fontWeight: 700,
          color: theme.palette.primary.main,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 1,
          display: 'block'
        }}
      >
        {label}
      </Typography>
      <Box
        ref={contentRef}
        sx={{
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          minHeight: 54,
          maxHeight: expanded ? '500px' : `${maxHeight}px`,
          overflowY: expanded ? 'auto' : 'hidden',
          overflowX: 'auto',
          position: 'relative',
          transition: 'max-height 0.3s ease',

          '&::-webkit-scrollbar': {
            height: '6px',
            width: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.divider,
            borderRadius: '4px'
          }
        }}
      >
        <GendoxMarkdownRenderer markdownText={markdown} />
      </Box>
      {showButton && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 0.5 }}>
          <Button
            size='small'
            variant='text'
            sx={{
              color: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 0,
              p: 0
            }}
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default ExpandableMarkdownSection
