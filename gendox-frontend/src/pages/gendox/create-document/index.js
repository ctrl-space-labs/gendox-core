import React, { useState, useRef, useEffect } from 'react'
import Tooltip from '@mui/material/Tooltip'
import { useRouter } from 'next/router'
import Typography from '@mui/material/Typography'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import documentService from 'src/gendox-sdk/documentService'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import NewDocument from 'src/views/pages/create-document/NewDocument'
import toast from 'react-hot-toast'
import { getErrorMessage } from 'src/utils/errorHandler'
import { localStorageConstants } from 'src/utils/generalConstants'

const CreateDocument = () => {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [documentTitle, setDocumentTitle] = useState('')
  const [documentValue, setDocumentValue] = useState('')
  const [isCreatingDocument, setIsCreatingDocument] = useState(false)
  const [titleError, setTitleError] = useState(false) // State for title validation

  const handleGoBack = () => {
    router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`)
  }

  const handleSave = async () => {
    if (!documentTitle) {
      setTitleError(true)
      toast.error('Document title is required.')
      return // Prevent saving if the title is empty
    }

    setTitleError(false)
    setIsCreatingDocument(true)
    try {
      // Convert documentValue (EditorState) to plain text
      const plainText = documentValue

      // Create a Blob from the plain text
      const blob = new Blob([plainText], { type: 'text/plain' })
      const file = new File([blob], `${documentTitle}.txt`, { type: 'text/plain' })

      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)

      // Upload the document
      await documentService.uploadDocument(organizationId, projectId, formData, token)

      toast.success('Document created successfully')
      router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`)
    } catch (error) {
      toast.error(`Document did not save. Error: ${getErrorMessage(error)}`)
      console.error('Error saving document:', error)
    } finally {
      setIsCreatingDocument(false)
    }
  }

  return (
    <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
      <ResponsiveCardContent sx={{ backgroundColor: 'background.paper' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h4' sx={{ mb: 6, fontWeight: 600, textAlign: 'left' }}>
            Create New Document
          </Typography>

          <Box sx={{ display: 'inline-flex', gap: 1 }}>
            {' '}
            {/* Adjusts the gap between the icons */}
            <Tooltip title='Back'>
              <IconButton
                onClick={handleGoBack}
                sx={{
                  mb: 6,
                  width: 'auto',
                  height: 'auto',
                  color: 'primary.main'
                }}
              >
                <Icon icon='mdi:arrow-left-bold' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Save Document'>
              <IconButton
                onClick={handleSave}
                sx={{
                  mb: 6,
                  width: 'auto',
                  height: 'auto',
                  color: 'primary.main'
                }}
              >
                <Icon icon='mdi:content-save-outline' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </ResponsiveCardContent>
      <Box sx={{ height: 20 }} />

      <ResponsiveCardContent
        sx={{
          backgroundColor: 'background.paper',
          pt: 3,
          pb: 3,
          mb: 6,
          filter: isCreatingDocument ? 'blur(6px)' : 'none', // Apply blur during loading
          transition: 'filter 0.3s ease'
        }}
      >
        <NewDocument
          documentTitle={documentTitle}
          setDocumentTitle={setDocumentTitle}
          markdownValue={documentValue}
          setMarkdownValue={setDocumentValue}
          titleError={titleError}
        />
      </ResponsiveCardContent>
    </Card>
  )
}

export default CreateDocument
