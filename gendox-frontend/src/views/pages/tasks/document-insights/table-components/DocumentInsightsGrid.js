import React, { useMemo, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Tooltip, IconButton, Menu, MenuItem } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DescriptionIcon from '@mui/icons-material/Description'
import CircularProgress from '@mui/material/CircularProgress'
import { answerFlagEnum } from 'src/utils/tasks/answerFlagEnum'
import Checkbox from '@mui/material/Checkbox'
import ReplayIcon from '@mui/icons-material/Replay'
import { useTheme } from '@mui/material/styles'

const DocumentInsightsGrid = ({
  openDialog,
  documents,
  questions,
  answers,
  openUploader,
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
  isGeneratingCells = {}
}) => {
  const theme = useTheme()
  const [documentMenuAnchor, setDocumentMenuAnchor] = useState(null)
  const [documentMenuDoc, setDocumentMenuDoc] = useState(null)
  const [questionMenuAnchor, setQuestionMenuAnchor] = useState(null)
  const [questionMenuItem, setQuestionMenuItem] = useState(null)

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order)
  }, [questions])

  const columns = useMemo(() => {
    return [
      {
        field: 'select',
        headerName: '',
        width: 60,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => {
          const docsWithQuestions = documents.filter(doc => doc.id && sortedQuestions.length > 0)
          const selectedDocsWithQuestions = selectedDocuments.filter(id => {
            const doc = documents.find(d => d.id === id)
            return doc?.id && sortedQuestions.length > 0
          })

          return (
            <Tooltip title='Select all documents'>
              <Checkbox
                checked={docsWithQuestions.length > 0 && selectedDocsWithQuestions.length === docsWithQuestions.length}
                indeterminate={
                  selectedDocsWithQuestions.length > 0 && selectedDocsWithQuestions.length < docsWithQuestions.length
                }
                onChange={e => {
                  if (e.target.checked) {
                    onSelectDocument(
                      'all',
                      docsWithQuestions.map(doc => doc.id)
                    )
                  } else {
                    onSelectDocument('none', [])
                  }
                }}
                size='small'
              />
            </Tooltip>
          )
        },
        renderCell: params => {
          const isSelected = selectedDocuments.includes(params.row.id)
          const hasQuestions = sortedQuestions.length > 0
          const canSelect = hasQuestions

          const tooltipTitle = !hasQuestions ? 'Please add questions to enable selection for generation' : ''

          return (
            <Tooltip title={tooltipTitle}>
              <span>
                <Checkbox
                  checked={isSelected}
                  onChange={e => onSelectDocument(params.row.id, e.target.checked)}
                  disabled={!canSelect}
                  size='small'
                />
              </span>
            </Tooltip>
          )
        }
      },
      {
        field: 'name',
        headerName: 'Document',
        width: 350,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => {
          const isSelected = selectedDocuments.includes(params.row.id)

          return (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                // cursor: !params.row.documentId ? 'pointer' : 'default',
                cursor: 'pointer',
                pr: 4, // space for vertical icon
                '&:hover .vertical-icon': {
                  opacity: 1,
                  pointerEvents: 'auto'
                }
              }}
              onClick={e => {
                e.stopPropagation()
                openDialog('pagePreview', params.row._doc)
              }}
              title={params.value || (params.row.documentId ? 'Unknown Document' : 'Select Document')}
            >
              <Box
                component='span'
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexGrow: 1,
                  color: isSelected ? 'primary.main' : params.row.documentId ? 'text.primary' : 'primary.main',
                  fontWeight: isSelected ? '600' : params.row.documentId ? 'normal' : '600',
                  userSelect: 'none'
                }}
              >
                {params.value || (params.row.documentId ? 'Unknown Document' : 'Select Document')}
              </Box>

              {/* Hover-reveal vertical Icon */}
              <IconButton
                size='small'
                className='vertical-icon'
                sx={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.25s ease'
                }}
                onClick={e => {
                  e.stopPropagation()
                  setDocumentMenuDoc(params.row._doc)
                  setDocumentMenuAnchor(e.currentTarget)
                }}
              >
                <MoreVertIcon fontSize='small' />
              </IconButton>
            </Box>
          )
        }
      },
      ...sortedQuestions.map(q => ({
        field: `q_${q.id}`,
        headerName: q.text.length > 30 ? q.text.slice(0, 30) + '...' : q.text,
        width: 240,
        editable: false,
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
              '&:hover .vertical-icon': {
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
                openDialog('questionDetail', q)
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

            {/* Hover-reveal Vertical Icon */}
            <IconButton
              size='small'
              className='vertical-icon'
              sx={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.25s ease'
              }}
              onClick={e => {
                e.stopPropagation()
                setQuestionMenuItem(q)
                setQuestionMenuAnchor(e.currentTarget)
              }}
            >
              <MoreVertIcon fontSize='small' />
            </IconButton>
          </Box>
        ),

        renderCell: params => {
          const docId = params.id
          const questionId = q.id
          const answerObj = answers.find(a => a.documentNodeId === docId && a.questionNodeId === questionId)
          const cellKey = `${docId}_${questionId}`
          const isGenerating = !!isGeneratingCells[cellKey]

          if (isLoadingAnswers) {
            return (
              <Box
                sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
              >
                <CircularProgress size={20} />
              </Box>
            )
          }
          if (isGenerating || isGeneratingAll) {
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
                    openDialog('answerDetail', answerObj)
                  }
                }
              }}
            >
              {answerFlagEnum(answerObj?.answerFlagEnum, theme)}
              <Tooltip
                title={!answerObj ? 'Click to generate this answer' : 'Click to see answer details'}
                arrow
                placement='top'
              >
                <span>
                  {!answerObj ? (
                    <em>Click to generate</em>
                  ) : answerObj.answerValue === '' ? (
                    <em>Click to see answer details</em>
                  ) : (
                    answerObj.answerValue
                  )}
                </span>
              </Tooltip>
              {answerObj && (
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
                    aria-label={`Regenerate answer for ${q.text}`}
                  />
                </Tooltip>
              )}
            </Box>
          )
        }
      }))
    ]
  }, [
    sortedQuestions,
    answers,
    openUploader,
    onGenerate,
    isLoadingAnswers,
    isLoading,
    documents,
    selectedDocuments,
    onSelectDocument,
    openDialog,
    isGeneratingAll,
    isGeneratingCells,
    onGenerateSingleAnswer,
    theme
  ])

  const rows = useMemo(() => {
    return documents.map(doc => {
      const row = {
        id: doc.id,
        name: doc.name || '',
        documentId: doc.documentId,
        _doc: doc
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
      <Menu
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        anchorEl={documentMenuAnchor}
        open={Boolean(documentMenuAnchor)}
        onClose={() => {
          setDocumentMenuAnchor(null)
          setDocumentMenuDoc(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {documentMenuDoc && [
          <MenuItem
            key='document-view'
            onClick={() => {
              setDocumentMenuAnchor(null)
              openDialog('pagePreview', documentMenuDoc)
              setDocumentMenuDoc(null)
            }}
          >
            <DescriptionIcon sx={{ mr: 1 }} fontSize='small' />
            View Document
          </MenuItem>,

          <MenuItem
            key='document-delete'
            onClick={() => {
              setDocumentMenuAnchor(null)
              openDialog('delete', documentMenuDoc)
              setDocumentMenuDoc(null)
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineIcon sx={{ mr: 1 }} fontSize='small' />
            Delete Document
          </MenuItem>
        ]}
      </Menu>
      <Menu
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        anchorEl={questionMenuAnchor}
        open={Boolean(questionMenuAnchor)}
        onClose={() => {
          setQuestionMenuAnchor(null)
          setQuestionMenuItem(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {questionMenuItem && [
          <MenuItem
            key='question-view'
            onClick={e => {
              setQuestionMenuAnchor(null)
              openDialog('questionDetail', questionMenuItem)
              setQuestionMenuItem(null)
            }}
          >
            <DescriptionIcon sx={{ mr: 1 }} fontSize='small' />
            View Question
          </MenuItem>,

          <MenuItem
            key='question-delete'
            onClick={() => {
              setQuestionMenuAnchor(null)
              openDialog('delete', questionMenuItem)
              setQuestionMenuItem(null)
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineIcon sx={{ mr: 1 }} fontSize='small' />
            Delete Question
          </MenuItem>
        ]}
      </Menu>
    </Box>
  )
}

export default DocumentInsightsGrid
