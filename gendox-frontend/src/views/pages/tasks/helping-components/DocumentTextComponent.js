import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { useRouter } from 'next/router'

import GendoxMarkdownRenderer from 'src/views/pages/markdown-renderer/GendoxMarkdownRenderer'

const MAX_SECTIONS = 5

const DocumentTextComponent = ({ sections, isBlurring, documentId, projectId, organizationId }) => {
  const router = useRouter()

  // ---- EMPTY STATES ----
  if (!sections || sections.length === 0) {
    return <Typography sx={{ p: 3 }}>No sections available</Typography>
  }

  // ---- LOADING ----
  if (isBlurring) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant='body1' color='text.secondary'>
          Loading document content...
        </Typography>
      </Box>
    )
  }

  const visibleSections = sections.slice(0, MAX_SECTIONS)
  const hasMore = sections.length > MAX_SECTIONS

  const handleOpenFullDocument = () => {
    const url = `/gendox/document-instance?organizationId=${organizationId}&documentId=${documentId}&projectId=${projectId}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
      {visibleSections.map((section, index) => (
        <CardContent key={section.id || index} sx={{ px: 3, py: 2 }}>
          <GendoxMarkdownRenderer markdownText={section.sectionValue || ''} />
        </CardContent>
      ))}

      {/* Message + Button for the rest */}
      {hasMore && (
        <Box sx={{ mt: 4, textAlign: 'left' }}>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ mb: 2, fontWeight: 500 }}>
            Only a preview is shown. To view the full document, open the Document Page.
          </Typography>

          <Button variant='contained' sx={{ textTransform: 'none' }} onClick={handleOpenFullDocument}>
            Go to Document
          </Button>
        </Box>
      )}
    </Card>
  )
}

export default DocumentTextComponent
