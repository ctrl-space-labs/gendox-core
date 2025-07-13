import React, { useMemo, useState } from 'react'
import AnswerDialog from '../table-dialogs/AnswerDialog'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CircularProgress from '@mui/material/CircularProgress'
import QuestionsDialog from '../table-dialogs/QuestionsDialog'

const DocumentInsightsGrid = ({
  documents,
  questions,
  answers,
  openUploader,
  onDeleteQuestionOrDocumentNode,
  onGenerate,
  isLoadingAnswers,
  isLoading
}) => {
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [selectedQuestionText, setSelectedQuestionText] = useState('')

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

  const sortedQuestions = useMemo(() => {
  return [...questions].sort((a, b) => a.order - b.order)
}, [questions])

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
                  disabled={sortedQuestions.length === 0}
                >
                  Generate
                </Button>
              </Tooltip>
            </Box>
          )
        }
      },
      ...sortedQuestions.map(q => ({
        field: `q_${q.id}`,
        headerName: q.text.length > 30 ? q.text.slice(0, 30) + '...' : q.text,
        width: 240,
        editable: false,
        resizable: true,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        cellClassName: 'answer-cell',
        renderHeader: params => (
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1.5,
              pr: 1,
              userSelect: 'none',
              cursor: 'default',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 600,
              flexGrow: 1,
              '&:hover .delete-icon': {
                opacity: 1,
                pointerEvents: 'auto'
              }
            }}
            title={q.text}
          >
            <Box
              component='button'
              type='button'
              onClick={() => {
                setSelectedQuestionText(q.text)
                setQuestionDialogOpen(true)
              }}
              aria-label={`View question details for ${q.text}`}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                flexGrow: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '28px', // space for delete icon
                '&:hover, &:focus-visible': {
                  textDecoration: 'underline',
                  outline: 'none'
                }
              }}
            >
              {params.colDef.headerName}
            </Box>

            {/* Hover-reveal Delete Icon */}
            <DeleteOutlineIcon
              className='delete-icon'
              sx={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: 'error.main',
                fontSize: '1.2rem',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.25s ease',
                '&:hover': {
                  color: 'error.dark'
                }
              }}
              onClick={e => {
                e.stopPropagation()
                onDeleteQuestionOrDocumentNode(q.id)
              }}
              aria-label={`Delete question ${q.text}`}
            />
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
          const docId = params.id
          const questionId = q.id
          const answerObj = answers.find(a => a.documentNodeId === docId && a.questionNodeId === questionId)
          return (
            <Box
              sx={{
                width: '100%',
                padding: '4px 8px',
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                color: 'inherit',
                cursor: isLoadingAnswers || isLoading ? 'default' : 'pointer',
                opacity: isLoadingAnswers || isLoading ? 0.5 : 1,
                userSelect: 'none',
                borderRadius: 1,
                border: '1px solid transparent',
                '&:hover': {
                  borderColor: isLoadingAnswers || isLoading ? 'transparent' : 'primary.main'
                }
              }}
              onClick={() => {
                if (!isLoadingAnswers && !isLoading) {
                  setSelectedAnswer(answerObj)
                  setAnswerDialogOpen(true)
                }
              }}
              title='Click to see answer details'
            >
              {answerObj?.answerValue || <em>Click to generate</em>}{' '}
            </Box>
          )
        }
      }))
    ]
  }, [sortedQuestions, answers, onDeleteQuestionOrDocumentNode, openUploader, onGenerate, isLoadingAnswers, isLoading])

  const rows = useMemo(() => {
    return documents.map(doc => {
      const row = {
        id: doc.id,
        name: doc.name || '',
        documentId: doc.documentId
      }

      sortedQuestions.forEach(q => {
        const answerObj = answers.find(a => a.documentNodeId === doc.id && a.questionNodeId === q.id)
        row[`q_${q.id}`] = answerObj ? answerObj.answerValue : ''
      })

      return row
    })
  }, [documents, sortedQuestions, answers])

  if (!documents.length && !questions.length) {
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
        filter: isLoading ? 'blur(6px)' : 'none', 
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

      <AnswerDialog open={answerDialogOpen} onClose={() => setAnswerDialogOpen(false)} answer={selectedAnswer} />
      <QuestionsDialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
        questionText={selectedQuestionText}
        readOnly={true}
      />
    </Box>
  )
}

export default DocumentInsightsGrid
