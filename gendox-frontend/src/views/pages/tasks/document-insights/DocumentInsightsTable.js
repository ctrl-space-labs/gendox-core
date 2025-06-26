import React, { useState } from 'react'
import { Box, Button, Typography, IconButton, Tooltip, TextField, Paper, Stack, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import Icon from 'src/views/custom-components/mui/icon/icon'
import UploaderDocument from 'src/views/custom-components/home-page-components/project-buttons-components/UploaderDocument'
import Modal from '@mui/material/Modal'

const DocumentInsightsTable = ({ selectedTask }) => {
  const [documents, setDocuments] = useState([])
  const [questions, setQuestions] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const handleOpenUploader = () => setShowUploader(true)
  const handleCloseUploader = () => setShowUploader(false)

  const handleAddDocument = () => {
    setDocuments(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        answers: questions.map(() => '')
      }
    ])
  }

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, `Prompt ${prev.length + 1}`])
    setDocuments(docs =>
      docs.map(doc => ({
        ...doc,
        answers: [...doc.answers, '']
      }))
    )
  }

  const handleUpload = index => {
    // Implement real file upload logic here
    const newName = `Document_${index + 1}.pdf`
    setDocuments(prev => {
      const updated = [...prev]
      updated[index].name = newName
      return updated
    })
  }

  const handleAnswerChange = (docIdx, qIdx, value) => {
    setDocuments(prev => {
      const updated = [...prev]
      updated[docIdx].answers[qIdx] = value
      return updated
    })
  }

  const generateAnswers = docIdx => {
    // Placeholder logic for generating answers
    setDocuments(prev => {
      const updated = [...prev]
      updated[docIdx].answers = questions.map(q => `Answer to "${q}" for ${updated[docIdx].name}`)
      return updated
    })
  }

  return (
    <Paper
      sx={{
        p: 3,
        overflowX: 'auto',
        backgroundColor: 'action.hover',
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        {/* Left icon + title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', gap: 1 }}>
          <Icon icon='mdi:clipboard-check-outline' fontSize='1.5rem' />
          <Typography variant='h6' fontWeight={600}>
            {selectedTask?.title ? selectedTask.title : 'Document Insights'}
          </Typography>
        </Box>

        {/* Middle description */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            px: 2,
            py: 1,
            boxShadow: 1,
            fontSize: '1rem',
            color: 'text.primary',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}
          title={selectedTask?.description ? selectedTask.description : 'Analyze and manage your document insights'}
        >
          {selectedTask?.description ? selectedTask.description : 'Analyze and manage your document insights'}
        </Box>

        {/* Right buttons */}
        <Stack direction='row' spacing={2} justifyContent='flex-end' sx={{ mb: 2 }}>
          <Button variant='outlined' startIcon={<AddIcon />} onClick={handleAddDocument}>
            Add Documents
          </Button>
          <Button variant='outlined' startIcon={<AddIcon />} onClick={handleAddQuestion}>
            Add Column
          </Button>
        </Stack>
      </Box>

      <Box sx={{ minWidth: 800 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', borderBottom: 2, borderColor: 'divider', py: 1 }}>
          <Typography sx={{ flex: 2, fontWeight: 600 }}>Document</Typography>
          {questions.map((question, idx) => (
            <Typography key={idx} sx={{ flex: 3, fontWeight: 600 }}>
              {question}
            </Typography>
          ))}
          <Typography sx={{ flex: 1 }} />
        </Box>

        {/* Rows */}
        {documents.map((doc, docIdx) => (
          <Box
            key={doc.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              py: 1,
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <Box sx={{ flex: 2, display: 'flex', alignItems: 'center' }}>
              <IconButton color='primary' onClick={() => handleOpenUploader()}>
                <UploadFileIcon />
              </IconButton>
              <Chip
                label={doc.name || 'Upload Document'}
                variant={doc.name ? 'filled' : 'outlined'}
                color={doc.name ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleOpenUploader()}
              />
            </Box>

            {questions.map((_, qIdx) => (
              <Box key={qIdx} sx={{ flex: 3, px: 1 }}>
                <TextField
                  fullWidth
                  size='small'
                  value={doc.answers[qIdx]}
                  placeholder='Click generate'
                  onChange={e => handleAnswerChange(docIdx, qIdx, e.target.value)}
                />
              </Box>
            ))}

            <Box sx={{ flex: 1 }}>
              <Button size='small' variant='contained' onClick={() => generateAnswers(docIdx)}>
                Generate
              </Button>
            </Box>
          </Box>
        ))}

        {/* Empty state */}
        {!documents.length && (
          <Typography variant='body2' sx={{ my: 4, color: 'text.secondary', textAlign: 'center' }}>
            No documents uploaded. Click "Add Documents" to start.
          </Typography>
        )}
      </Box>
      <Modal
        open={showUploader}
        onClose={handleCloseUploader}
        aria-labelledby='simple-modal-title'
        aria-describedby='simple-modal-description'
        disableEnforceFocus
        disableAutoFocus
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ outline: 'none', p: 2, bgcolor: 'background.paper' }}>
          <UploaderDocument closeUploader={handleCloseUploader} />
        </Box>
      </Modal>
    </Paper>
  )
}

export default DocumentInsightsTable
