import React, { useMemo, useState } from 'react'
import AnswerDialog from '../table-dialogs/AnswerDialog'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CircularProgress from '@mui/material/CircularProgress'
import { answerFlagEnum } from 'src/utils/tasks/answerFlagEnum'
import Checkbox from '@mui/material/Checkbox'
import ReplayIcon from '@mui/icons-material/Replay'
import { useTheme } from '@mui/material/styles'
import { getQuestionMessageById } from 'src/utils/tasks/taskUtils'
import DescriptionIcon from '@mui/icons-material/Description'
import SchemaIcon from '@mui/icons-material/Schema'
import EditIcon from '@mui/icons-material/Edit'
import DocumentDialog from '../table-dialogs/DocumentDialog'

const DocumentDigitizationGrid = ({
  documents,
  answers,
  openUploader,
  onDeleteQuestionOrDocumentNode,
  onGenerate,
  isLoadingAnswers,
  isLoading,
  isBlurring,
  page,
  pageSize,
  setPage,
  setPageSize,
  totalDocuments,
  selectedDocuments = [],
  onSelectDocument = () => {},
  onGenerateSingleAnswer = () => {},
  isGeneratingAll,
  isGeneratingCells
}) => {
  const theme = useTheme()
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  const [openDocDialog, setOpenDocDialog] = useState(false)
  const [activeDoc, setActiveDoc] = useState(null)
  const [editMode, setEditMode] = useState(false)

  const handleOpenDialog = (doc, editable = false) => {
    setActiveDoc(doc)
    setEditMode(editable)
    setOpenDocDialog(true)
  }

  // Save changes (replace this with your Redux or API logic as needed)
  const handleSaveDoc = updatedDoc => {
    // Ideally, update the document in your Redux state or backend
    // This is a local update for demo:
    // setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d))
    setOpenDocDialog(false)
  }

  console.log('DOCUMENTS', documents)
  console.log('ANSWERS', answers)

  const pageNumbers = useMemo(() => {
    // Unique page numbers present in answers
    return Array.from(new Set(answers.map(a => a.pageNumber))).sort((a, b) => a - b)
  }, [answers])

  const columns = useMemo(
    () => [
      {
        field: 'pageNumber',
        headerName: 'Pages',
        width: 100,
        renderCell: params => <b>Page {params.value}</b>,
        renderHeader: () => <b>Pages</b>
      },
      ...documents.map(doc => ({
        field: doc.id,
        width: 280,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        // Full-featured header
        renderHeader: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              height: '100%',
              borderRadius: 2,
              boxShadow: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer', // clickable for dialog
              transition: 'box-shadow 0.2s'
            }}
            onClick={() => handleOpenDialog(doc)} // open in view mode
            title='Click to view details'
          >
            {/* Title */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: 'primary.main',
                p: 1,
                pl: 1.5,
                pb: 0.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                minHeight: 32
              }}
              title={doc.name}
            >
              <DescriptionIcon fontSize='small' sx={{ mr: 1, color: 'primary.light' }} />
              {doc.name || 'Unknown Document'}
            </Box>
            {/* Info Section */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                px: 1.5,
                py: 0.5,
                gap: 0.5,
                minHeight: 44,
                justifyContent: 'center'
              }}
            >
              <Tooltip title={doc.prompt || 'No prompt'} placement='top'>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 13,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 0.2
                  }}
                >
                  <ReplayIcon fontSize='small' sx={{ mr: 0.7, opacity: 0.5 }} />
                  <span>{doc.prompt || <em>No prompt</em>}</span>
                </Box>
              </Tooltip>
              <Tooltip title={doc.structure || 'No structure'} placement='top'>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 13,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <SchemaIcon fontSize='small' sx={{ mr: 0.7, opacity: 0.5 }} />
                  <span>{doc.structure || <em>No structure</em>}</span>
                </Box>
              </Tooltip>
            </Box>
            {/* Footer actions */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                pt: 0.5,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
              onClick={e => e.stopPropagation()}
            >
              <Tooltip title='Delete Document'>
                <span>
                  <IconButton
                    color='error'
                    size='small'
                    onClick={() => onDeleteQuestionOrDocumentNode(doc.id)}
                    aria-label='delete document'
                    sx={{ mx: 0.2 }}
                  >
                    <DeleteOutlineIcon fontSize='small' />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title='Mark for Generation'>
                <span>
                  <Checkbox
                    checked={selectedDocuments.includes(doc.id)}
                    onChange={e => onSelectDocument(doc.id, e.target.checked)}
                    inputProps={{
                      'aria-label': `Mark document ${doc.name} for generation`
                    }}
                    sx={{ p: 0, mx: 0.2 }}
                  />
                </span>
              </Tooltip>
            </Box>
          </Box>
        ),

        renderCell: params => {
          // Get doc for this column (field)
  const doc = documents.find(d => d.id === params.field)
  // Get the pageNumber for this row
  const pageNumber = params.row.pageNumber
  // Find the answer for this doc and this page
  const answerObj = answers.find(
    a => a.documentId === doc?.documentId && a.pageNumber === pageNumber
  )

          if (isLoadingAnswers) {
            return (
              <Box
                sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
              >
                <CircularProgress size={20} />
              </Box>
            )
          }
          if (isGeneratingAll) {
            return (
              <Box
                sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
              >
                <CircularProgress size={20} />
              </Box>
            )
          }
          return (
            <Box
              sx={{
                width: '100%',
                padding: '4px 8px',
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                color: 'inherit',
                cursor: isLoadingAnswers || isLoading || isBlurring ? 'default' : 'pointer',
                opacity: isLoadingAnswers || isLoading || isBlurring ? 0.5 : 1,
                userSelect: 'none',
                borderRadius: 1,
                border: '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                position: 'relative',
                pr: 4,
                '&:hover .regenerate-icon': {
                  opacity: 1,
                  pointerEvents: 'auto'
                }
              }}
              onClick={() => {
                if (!isLoadingAnswers && !isLoading) {
                  if (!answerObj?.answerValue) {
                    // Trigger generate for this cell only
                    onGenerateSingleAnswer(params.row, q)
                  } else {
                    setSelectedAnswer(answerObj)
                    setAnswerDialogOpen(true)
                  }
                }
              }}
            >
              {answerFlagEnum(answerObj?.answerFlagEnum, theme)}
              <Tooltip
                title={!answerObj?.answerValue ? 'Click to generate this answer' : 'Click to see answer details'}
                arrow
                placement='top'
              >
                <span>{answerObj?.answerValue || <em>Click to generate</em>}</span>
              </Tooltip>
              {answerObj?.answerValue && (
                <Tooltip title='Regenerate answer'>
                  <ReplayIcon
                    className='regenerate-icon'
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: 'primary.main',
                      fontSize: '1.2rem',
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity 0.25s ease',
                      '&:hover': {
                        color: 'primary.dark'
                      }
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      onGenerateSingleAnswer(params.row, q)
                    }}
                    aria-label={`Regenerate answer for `}
                  />
                </Tooltip>
              )}
            </Box>
          )
        }
      }))
    ],
    [documents, selectedDocuments, onSelectDocument, onDeleteQuestionOrDocumentNode]
  )

  const rows = useMemo(() => {
    return pageNumbers.map(page => {
      const row = { id: `page-${page}`, pageNumber: page }
      documents.forEach(doc => {
        const answer = answers.find(a => a.documentId === doc.documentId && a.pageNumber === page)
        row[doc.id] = answer ? answer.message : ''
      })
      return row
    })
  }, [pageNumbers, documents, answers])

  if (!documents.length) {
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
        filter: isLoading || isBlurring ? 'blur(6px)' : 'none',
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
        columnHeaderHeight={108}
        paginationMode='server'
        rowCount={totalDocuments}
        estimatedRowCount={totalDocuments}
        paginationModel={{ page, pageSize }}
        pageSizeOptions={[20]}
        onPaginationModelChange={({ page: newPage }) => {
          setPage(newPage)
        }}
        disableRowSelectionOnClick
        componentsProps={{
          pagination: { showFirstButton: true, showLastButton: true }
        }}
        loading={isLoading || isBlurring}
        sx={{
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
          '& .MuiDataGrid-columnHeaderTitle': {
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.4,
            fontSize: '0.875rem'
          }
        }}
      />

      <AnswerDialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        answer={selectedAnswer}
        // questionText={selectedAnswer ? getQuestionMessageById(questions, selectedAnswer.questionNodeId) : ''}
      />

      <DocumentDialog
        open={openDocDialog}
        onClose={() => setOpenDocDialog(false)}
        document={activeDoc}
        onSave={handleSaveDoc}
      />
    </Box>
  )
}

export default DocumentDigitizationGrid
