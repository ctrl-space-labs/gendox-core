import React, { useMemo, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, IconButton, Tooltip, Popper, Paper, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CircularProgress from '@mui/material/CircularProgress'

const DocumentInsightsGrid = ({
  documents,
  questions,
  answers,
  onAnswerChange,
  openUploader,
  onDeleteQuestionOrDocumentNode,
  onGenerate,
  isLoadingAnswers,
  isLoading
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [hoveredQuestion, setHoveredQuestion] = useState(null)

  const handleHeaderMouseEnter = (event, q) => {
    setAnchorEl(event.currentTarget)
    setHoveredQuestion(q)
  }

  const handleHeaderMouseLeave = () => {
    setAnchorEl(null)
    setHoveredQuestion(null)
  }

  const loadingTextAnimation = {
    '@keyframes pulseOpacity': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.3 }
    },
    pulseEffect: {
      animation: 'pulseOpacity 1.5s ease-in-out infinite',
      color: '#999',
      fontStyle: 'italic',
      userSelect: 'none',
      pointerEvents: 'none'
    }
  }

  const columns = useMemo(() => {
    return [
      {
        field: 'name',
        headerName: 'Document',
        width: 350,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                cursor: !params.row.documentId ? 'pointer' : 'default'
              }}
              onClick={() => !params.row.documentId && openUploader()}
              title={params.value || (params.row.documentId ? 'Unknown Document' : 'Select Document')}
            >
              {params.row.documentId ? (
                <Tooltip title='Delete Document'>
                  <span>
                  <IconButton
                    color='error'
                    size='small'
                    onClick={e => {
                      e.stopPropagation() // prevent row click
                      onDeleteQuestionOrDocumentNode(params.row.id) // use correct handler
                    }}
                    aria-label='delete document'
                  >
                    <DeleteOutlineIcon fontSize='small' />
                  </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title='Select Document'>
                  <IconButton
                    color='primary'
                    size='small'
                    onClick={e => {
                      e.stopPropagation() // prevent row click
                      openUploader()
                    }}
                    aria-label='select document'
                  >
                    <UploadFileIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}

              <Box
                component='span'
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexGrow: 1,
                  color: params.row.documentId ? 'text.primary' : 'primary.main',
                  fontWeight: params.row.documentId ? 'normal' : '600',
                  userSelect: 'none'
                }}
              >
                {params.value || (params.row.documentId ? 'Unknown Document' : 'Select Document')}
              </Box>
              <Tooltip title='Generate Document'>
                <Button
                  variant='contained'
                  size='small'
                  onClick={() => onGenerate(params.row)}
                  sx={{ textTransform: 'none', fontWeight: '600' }}
                  aria-label={`Generate answers for document ${params.row.name}`}
                >
                  Generate
                </Button>
              </Tooltip>
            </Box>
          )
        }
      },
      ...questions.map(q => ({
        field: `q_${q.id}`,
        headerName: (
          <Box
            sx={{ cursor: 'help', whiteSpace: 'normal', wordBreak: 'break-word', fontWeight: 600 }}
            onMouseEnter={e => handleHeaderMouseEnter(e, q)}
            onMouseLeave={handleHeaderMouseLeave}
            title={q.text}
          >
            {q.text.length > 30 ? q.text.slice(0, 30) + '...' : q.text}
          </Box>
        ),
        width: 240,
        editable: true,
        resizable: true,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        cellClassName: 'answer-cell',
        renderHeader: params => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              pr: 1
            }}
            title={q.text}
          >
            <Box
              component='span'
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1,
                cursor: 'default',
                fontWeight: 600
              }}
            >
              {params.colDef.headerName}
            </Box>
            <Tooltip title='Delete question'>
              <DeleteOutlineIcon
                sx={{
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: 'error.main',
                  '&:hover': { color: 'error.dark' }
                }}
                onClick={e => {
                  e.stopPropagation()
                  onDeleteQuestionOrDocumentNode(q.id) // same handler used for questions
                }}
                aria-label={`Delete question ${q.text}`}
              />
            </Tooltip>
          </Box>
        ),
        renderCell: params => {
          if (isLoadingAnswers) {
            return (
              <Box
                sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
              >
                <span style={loadingTextAnimation.pulseEffect}>Loading…</span>
              </Box>
            )
          }
          return (
            <Box sx={{ width: '100%' }}>
              <input
                type='text'
                value={params.value || ''}
                placeholder='Click generate'
                onChange={e => {
                  params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  padding: '4px 8px',
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  pointerEvents: isLoadingAnswers || isLoading ? 'none' : 'auto',
                  opacity: isLoadingAnswers || isLoading ? 0.5 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </Box>
          )
        }
      }))
    ]
  }, [questions, onDeleteQuestionOrDocumentNode, openUploader, onGenerate, isLoadingAnswers, isLoading])

  const rows = useMemo(() => {
    return documents.map(doc => {
      const row = {
        id: doc.id,
        name: doc.name || '',
        documentId: doc.documentId
      }

      questions.forEach(q => {
        const answerObj = answers.find(a => a.documentNodeId === doc.id && a.questionNodeId === q.id)
        row[`q_${q.id}`] = answerObj ? answerObj.answerValue : ''
      })

      return row
    })
  }, [documents, questions, answers])

  const handleCellEditCommit = params => {
    const questionId = params.field.replace('q_', '')
    const docIdx = documents.findIndex(d => d.id === params.id)
    const qIdx = questions.findIndex(q => q.id.toString() === questionId)

    if (docIdx >= 0 && qIdx >= 0) {
      onAnswerChange(docIdx, qIdx, params.value)
    }
  }

  if (!documents.length || !questions.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        No documents or questions to display. Please add some above.
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: 650,
        width: '100%',
        overflowX: 'auto',
        filter: isLoading ? 'brightness(0.85)' : 'none',
        transition: 'filter 0.3s ease',
        borderRadius: 1
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        onCellEditCommit={handleCellEditCommit}
        pagination
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        checkboxSelection={false}
        disableSelectionOnClick={true}
        experimentalFeatures={{ newEditingApi: true }}
        componentsProps={{
          cell: {
            title: '' // disables native tooltip on all cells
          }
        }}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          '& .MuiDataGrid-cell': {
            outline: 'none',
            transition: 'background-color 0.15s ease',
            '&:focus-within': {
              backgroundColor: 'rgba(25,118,210,0.08)'
            },
            whiteSpace: 'normal',
            lineHeight: 1.4,
            py: 1
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.paper',
            fontWeight: 600,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            whiteSpace: 'normal',
            lineHeight: 1.3,
            paddingBottom: 10,
            maxHeight: 60
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.3,
            fontSize: '0.875rem'
          },
          '&::-webkit-scrollbar': {
            height: 10
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 5
          }
        }}
      />
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement='top'
        modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
      >
        {hoveredQuestion && (
          <Paper sx={{ p: 1.5, maxWidth: 300, boxShadow: 3 }}>
            <Typography variant='body2' sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
              {hoveredQuestion.text}
            </Typography>
          </Paper>
        )}
      </Popper>
    </Box>
  )
}

export default DocumentInsightsGrid
