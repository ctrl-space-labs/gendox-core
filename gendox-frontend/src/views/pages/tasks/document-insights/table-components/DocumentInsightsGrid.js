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
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const DocumentInsightsGrid = ({
  openDialog,
  documents,
  questions,
  answers,
  isPageLoading,
  page,
  pageSize,
  setPage,
  setPageSize,
  totalDocuments,
  selectedDocuments = [],
  setSelectedDocuments,
  onSelectDocument = () => {},
  handleGenerate,
  isGeneratingCells = {},
  isGenerating,
  onMoveQuestion = () => {}
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
        field: 'summaryAction',
        headerName: '',
        width: 50,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => {
          const summaryFlag = params.row._doc?.insightsSummary?.answerFlagEnum
          return (
            <Tooltip title='View Summary'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  openDialog('summaryDetail', params.row._doc)
                }}
              >
                {answerFlagEnum(summaryFlag, theme)}
              </IconButton>
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
              {/* DOCUMENT TITLE */}
              <Tooltip title='View Document'>
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
                  {<TruncatedText text={params.value} /> ||
                    (params.row.documentId ? 'Unknown Document' : 'Select Document')}
                </Box>
              </Tooltip>

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

      // Dynamic question columns
      ...sortedQuestions.map((q, idx) => ({
        field: `q_${q.id}`,
        headerName: <TruncatedText text={q.text} />,
        width: 240,
        editable: false,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        cellClassName: 'answer-cell',

        renderHeader: () => {
          const isFirst = idx === 0
          const isLast = idx === sortedQuestions.length - 1

          return (
            <Box
              sx={{
                width: '100%',
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover .header-actions': { opacity: 1, pointerEvents: 'auto' }
              }}
            >
              {/* Title (takes remaining space) */}
              <Box
                onClick={() => openDialog('questionDetail', q)}
                sx={{
                  minWidth: 0,
                  flex: '1 1 auto',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                <TruncatedText text={q.title || q.text} />
              </Box>

              {/* Actions pinned to the right */}
              <Box
                className='header-actions'
                sx={{
                  marginLeft: 'auto', // ✅ pushes it to the far right
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.25,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(4px)',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.15s ease, background-color 0.15s ease'
                }}
              >
                <Tooltip title={isFirst ? 'Already first' : 'Move left'} arrow>
                  {/* span needed so Tooltip works on disabled button */}
                  <span>
                    <IconButton
                      size='small'
                      disabled={isFirst}
                      onClick={e => {
                        e.stopPropagation()
                        onMoveQuestion(q.id, 'LEFT')
                      }}
                      sx={{ width: 24, height: 24, '&.Mui-disabled': { opacity: 0.25 } }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title={isLast ? 'Already last' : 'Move right'} arrow>
                  <span>
                    <IconButton
                      size='small'
                      disabled={isLast}
                      onClick={e => {
                        e.stopPropagation()
                        onMoveQuestion(q.id, 'RIGHT')
                      }}
                      sx={{ width: 24, height: 24, '&.Mui-disabled': { opacity: 0.25 } }}
                    >
                      <ChevronRightIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title='More actions' arrow>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      setQuestionMenuItem(q)
                      setQuestionMenuAnchor(e.currentTarget)
                    }}
                    sx={{ width: 24, height: 24 }}
                  >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )
        },

        renderCell: params => {
          const docId = params.id
          const questionId = q.id
          const answerObj = answers.find(a => a.documentNodeId === docId && a.questionNodeId === questionId)
          const cellKey = `${docId}_${questionId}`
          const docKey = `${docId}_all`
          const isCellGenerating = !!isGeneratingCells[cellKey]
          const isDocGenerating = !!isGeneratingCells[docKey]
          const hasAnswer = !!answerObj
          const isGenerateBlocked = !hasAnswer && isGenerating

          if (isCellGenerating || isDocGenerating) {
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
                height: '100%',
                padding: '4px 8px',
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                color: 'inherit',
                cursor: isPageLoading ? 'default' : 'pointer',
                opacity: isPageLoading ? 0.5 : 1,
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
                if (isPageLoading) return

                if (!answerObj?.answerValue) {
                  handleGenerate({ documentsToGenerate: params.row, questionsToGenerate: q })
                } else {
                  openDialog('answerDetail', answerObj)
                }
              }}
            >
              {answerFlagEnum(answerObj?.answerFlagEnum, theme)}
              <Tooltip
                title={
                  hasAnswer
                    ? 'Click to see answer details'
                    : isGenerating
                    ? 'Generation in progress'
                    : 'Click to generate this answer'
                }
                arrow
                placement='top'
              >
                <span
                  style={{
                    cursor: isGenerateBlocked ? 'not-allowed' : 'pointer',
                    opacity: isGenerateBlocked ? 0.5 : 1,
                    userSelect: 'none'
                  }}
                >
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
                <Tooltip title={isGenerating ? 'Generation in progress' : 'Regenerate answer'}>
                  <ReplayIcon
                    className='regenerate-icon'
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.2rem',
                      opacity: isGenerating ? 0.3 : 0,
                      pointerEvents: isGenerating ? 'none' : 'auto',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      color: isGenerating ? 'action.disabled' : 'primary.main',
                      transition: 'opacity 0.25s ease',
                      '&:hover': {
                        color: isGenerating ? 'action.disabled' : 'primary.dark'
                      }
                    }}
                    onClick={e => {
                      if (isGenerating) return
                      e.stopPropagation()
                      handleGenerate({ documentsToGenerate: params.row, questionsToGenerate: q })
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
    isPageLoading,
    documents,
    selectedDocuments,
    onSelectDocument,
    openDialog,
    isGeneratingCells,
    handleGenerate,
    theme
  ])

  const rows = useMemo(() => {
    const sortedDocs = [...documents].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.createdAt || 0)
      const dateB = new Date(b.createdAt || b.createdAt || 0)
      return dateA - dateB
    })
    return sortedDocs.map(doc => {
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
        filter: isPageLoading ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease',
        borderRadius: 1
      }}
    >
      {isPageLoading && (
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
        hideFooterSelectedRowCount
        disableRowSelectionOnClick
        paginationMode='server'
        rowCount={totalDocuments}
        estimatedRowCount={totalDocuments}
        paginationModel={{ page, pageSize }}
        pageSizeOptions={[20]}
        onPaginationModelChange={({ page: newPage }) => {
          setPage(newPage)
        }}
        componentsProps={{
          pagination: { showFirstButton: true, showLastButton: true }
        }}
        loading={isPageLoading}
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
              setSelectedDocuments([])
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineIcon sx={{ mr: 1 }} fontSize='small' />
            Remove Document
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
