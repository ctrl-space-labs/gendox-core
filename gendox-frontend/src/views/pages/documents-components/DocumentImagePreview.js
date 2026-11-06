import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import documentService from 'src/gendox-sdk/documentService'
import { getErrorMessage } from 'src/utils/errorHandler'

// Fetches the image with the user's token, so it is shown only to users who may read the document
const DocumentImagePreview = ({ documentId, title, token }) => {
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!documentId || !token) return

    let objectUrl = null
    let cancelled = false
    setIsLoading(true)
    setError(null)

    documentService
      .viewProjectDocumentContent(documentId, token)
      .then(response => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(response.data)
        setImageUrl(objectUrl)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Error loading document image', err)
        setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId, token])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  if (error || !imageUrl) {
    return <Typography sx={{ padding: 2 }}>Image could not be loaded{error ? `: ${error}` : ''}</Typography>
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Box
        component='img'
        src={imageUrl}
        alt={title || 'Document image'}
        sx={{ maxWidth: '100%', height: 'auto', borderRadius: 1 }}
      />
    </Box>
  )
}

export default DocumentImagePreview
