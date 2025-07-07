import React, { useMemo } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { buildAnswerMap } from 'src/utils/tasks/buildAnswerMap'

const DocumentInsightsGrid = ({
  documents,
  questions,
  onAnswerChange,
  openUploader,
  onDeleteQuestionOrDocumentNode,
  onGenerate,
  taskEdgesList,
  isLoading
}) => {
  const answerMap = useMemo(() => buildAnswerMap(taskEdgesList?.content || []), [taskEdgesList])

  const columns = useMemo(() => {
    return [
      {
        field: 'name',
        headerName: 'Document',
        width: 350,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              cursor: !params.row.documentId ? 'pointer' : 'default'
            }}
            onClick={() => !params.row.documentId && openUploader()}
            title={params.value || (params.row.documentId ? 'Unknown Document' : 'Upload Document')}
          >
            {params.row.documentId ? (
              <Tooltip title='Delete Document'>
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
              </Tooltip>
            ) : (
              <Tooltip title='Upload Document'>
                <IconButton
                  color='primary'
                  size='small'
                  onClick={e => {
                    e.stopPropagation() // prevent row click
                    openUploader()
                  }}
                  aria-label='upload document'
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
              {params.value || (params.row.documentId ? 'Unknown Documen2t' : 'Upload Document')}
            </Box>
          </Box>
        )
      },
      {
        field: 'generate',
        headerName: 'Generate',
        width: 130,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => (
          <Button
            variant='contained'
            size='small'
            onClick={() => onGenerate(params.row)}
            sx={{ textTransform: 'none', fontWeight: '600' }}
            aria-label={`Generate answers for document ${params.row.name}`}
          >
            Generate
          </Button>
        )
      },
      ...questions.map(q => ({
        field: `q_${q.id}`,
        headerName: q.text.length > 15 ? `${q.text.slice(0, 12)}...` : q.text,
        width: 180,
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
                // onClick={e => {
                //   e.stopPropagation() // Prevent sorting on header click
                //   // Call your question delete handler here, pass question id
                //   if (typeof onDeleteQuestion === 'function') {
                //     onDeleteQuestion(q.id)
                //   }
                // }}
                onClick={e => {
                  e.stopPropagation()
                  onDeleteQuestionOrDocumentNode(q.id) // same handler used for questions
                }}
                aria-label={`Delete question ${q.text}`}
                title={`Delete question: ${q.text}`}
              />
            </Tooltip>
          </Box>
        ),
        renderCell: params => (
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
                color: 'inherit'
              }}
            />
          </Box>
        )
      }))
    ]
  }, [questions, onDeleteQuestionOrDocumentNode, openUploader, onGenerate])

  const rows = useMemo(() => {
    return documents.map(doc => {
      const row = {
        id: doc.id,
        name: doc.name || '',
        documentId: doc.documentId
      }
      questions.forEach(q => {
        const key = `${doc.id}-${q.id}`
        row[`q_${q.id}`] = answerMap.get(key) || ''
      })
      return row
    })
  }, [documents, questions, answerMap])

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
        height: 650,
        width: '100%',
        overflowX: 'auto',
        filter: isLoading ? 'blur(6px)' : 'none', // Apply blur to SectionCard
        transition: 'filter 0.3s ease'
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        onCellEditCommit={handleCellEditCommit}
        pagination
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          '& .MuiDataGrid-cell': {
            outline: 'none',
            transition: 'background-color 0.15s ease',
            '&:focus-within': {
              backgroundColor: 'rgba(25,118,210,0.08)'
            }
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.paper',
            fontWeight: 600
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
    </Box>
  )
}

export default DocumentInsightsGrid
