import React, { useMemo, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, IconButton, Tooltip, Menu, MenuItem } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CircularProgress from '@mui/material/CircularProgress'
import { answerFlagEnum } from 'src/utils/tasks/answerFlagEnum'
import Checkbox from '@mui/material/Checkbox'
import ReplayIcon from '@mui/icons-material/Replay'
import { useTheme } from '@mui/material/styles'
import DescriptionIcon from '@mui/icons-material/Description'
import SchemaIcon from '@mui/icons-material/Schema'
import DocumentDialog from '../table-dialogs/DocumentDigitizationDocumentDialog'
import Icon from 'src/views/custom-components/mui/icon/icon'
import EditIcon from '@mui/icons-material/Edit'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'

const DocumentDigitizationGrid = ({
  openDialog,
  documents,
  answers,
  onGenerate,
  isLoadingAnswers,
  isLoading,
  isBlurring,
  page,
  pageSize,
  setPage,
  setPageSize,
  totalDocuments,
  isSelectingDocuments = false,
  selectedDocuments = [],
  onSelectDocument = () => {},
  onGenerateSingleAnswer = () => {},
  isGeneratingAll
}) => {
  const theme = useTheme()

  const [generateMenuAnchor, setGenerateMenuAnchor] = useState(null)
  const [generateMenuDoc, setGenerateMenuDoc] = useState(null)

  const docMaxPages = useMemo(() => {
    const map = {}
    documents.forEach(doc => {
      const docAnswers = answers.filter(a => a.nodeDocumentId === doc.id)
      map[doc.id] = docAnswers.length ? Math.max(...docAnswers.map(a => a.order ?? 0)) : 0
    })
    return map // { [docId]: maxPage }
  }, [documents, answers])

  const maxPageOverall = useMemo(() => {
    return Math.max(0, ...Object.values(docMaxPages))
  }, [docMaxPages])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: maxPageOverall }, (_, i) => i + 1)
  }, [maxPageOverall])

  function truncateText(text, maxLength = 60) {
    if (!text) return ''
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
  }

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [documents])

  const columns = useMemo(
    () => [
      {
        field: 'order',
        headerName: 'Order',
        width: 100,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => <b>Page {params.value}</b>,
        renderHeader: () => <b>Pages</b>
      },
      ...sortedDocuments.map(doc => ({
        field: doc.id,
        width: 280,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,

        renderHeader: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: 68,
              px: 0.5,
              py: 1,
              background: 'transparent'
            }}
          >
            {/* Left: Checkbox */}
            {isSelectingDocuments && (
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 38, pr: 1 }}>
                <Checkbox
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={e => onSelectDocument(doc.id, e.target.checked)}
                  size='small'
                  sx={{ p: 0.5 }}
                />
              </Box>
            )}

            {/* Center: Title and Prompt */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 0.5,
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => openDialog('docDetail', doc, false)}
              title='Click to view details'
            >
              <Box
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  lineHeight: 1.25,
                  mb: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={doc.name}
              >
                {doc.name || 'Unknown Document'}
              </Box>
              <Tooltip title={truncateText(doc.prompt, 200) || 'No prompt, Please add one'} placement='bottom'>
                <Box
                  component='span'
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    fontSize: 13,
                    color: 'text.secondary',
                    minHeight: 36, // or minHeight: 18 for 1 line (tweak for your font)
                    maxHeight: 36, // or remove for 1 line
                    lineHeight: 1.2
                  }}
                >
                  {truncateText(doc.prompt, 60) || <em>No prompt, Please add one</em>}
                </Box>
              </Tooltip>
            </Box>

            {/* Right: Icon buttons vertically */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 0.5,
                minWidth: 38,
                ml: 1
              }}
            >
              <Tooltip title='Edit'>
                <IconButton
                  aria-label='Edit document'
                  onClick={e => {
                    e.stopPropagation()
                    openDialog('docDetail', doc, true)
                  }}
                  size='small'
                  sx={{ p: 0.5 }}
                >
                  <EditIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Generate'>
                <IconButton
                  size='small'
                  sx={{ color: 'primary.main', p: 0.5 }}
                  onClick={e => {
                    e.stopPropagation()
                    setGenerateMenuAnchor(e.currentTarget)
                    setGenerateMenuDoc(doc)
                  }}
                >
                  <RocketLaunchIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete'>
                <IconButton
                  size='small'
                  sx={{ p: 0.5 }}
                  onClick={e => {
                    e.stopPropagation()
                    openDialog('delete', doc)
                  }}
                  color='error'
                >
                  <DeleteOutlineIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ),

        renderCell: params => {
          const doc = sortedDocuments.find(d => d.id === params.field)
          const order = params.row.order

          if (order > docMaxPages[doc.id]) {
            return null
          }
          const answerObj = answers.find(a => a.nodeDocumentId === doc?.id && (a.order ?? 0) === order)

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
                    openDialog('answerDetail', answerObj)
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
    [documents, selectedDocuments, onSelectDocument]
  )

  const rows = useMemo(() => {
    return pageNumbers.map(order => {
      const row = { id: `order-${order}`, order }
      sortedDocuments.forEach(doc => {
        const answer = answers.find(a => a.documentId === doc.documentId && (a.nodeValue?.order ?? 0) === order)
        row[doc.id] = answer ? answer.message : ''
      })
      return row
    })
  }, [pageNumbers, sortedDocuments, answers])

  if (!sortedDocuments.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        No documents to display. Please add some above.
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

      <Menu
        anchorEl={generateMenuAnchor}
        open={Boolean(generateMenuAnchor)}
        onClose={() => {
          setGenerateMenuAnchor(null)
          setGenerateMenuDoc(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem
          onClick={() => {
            setGenerateMenuAnchor(null)
            if (generateMenuDoc) onGenerate([generateMenuDoc]) // whole document
          }}
        >
          Generate Document
        </MenuItem>
        <MenuItem
          onClick={() => {
            setGenerateMenuAnchor(null)
            if (generateMenuDoc) {
              // Here you should trigger your page generation logic, e.g. open another dialog
              // or set some "select page(s)" UI
              // For example:
              // setPageGenerationDialogOpen(true)
              // setPageGenerationDoc(generateMenuDoc)
              // or call a prop: onGeneratePages(generateMenuDoc)
              onGenerateSingleAnswer(generateMenuDoc)
            }
          }}
        >
          Generate Pages
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default DocumentDigitizationGrid
