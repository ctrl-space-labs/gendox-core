import React, { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import AnswerDialog from '../table-dialogs/AnswerDialog'
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
import DocumentDialog from '../table-dialogs/DocumentDialog'
import Icon from 'src/views/custom-components/mui/icon/icon'
import taskService from 'src/gendox-sdk/taskService'
import { fetchTaskNodesByCriteria } from 'src/store/activeTask/activeTask'

const DocumentHeaderMenu = ({ doc, onDelete, onEdit }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = e => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }
  const handleMenuClose = e => {
    if (e) e.stopPropagation()
    setAnchorEl(null)
  }
  const handleDelete = e => {
    e.stopPropagation()
    onDelete(doc)
    handleMenuClose(e)
  }
  const handleEdit = e => {
    e.stopPropagation()
    onEdit(doc)
    handleMenuClose(e)
  }

  return (
    <>
      <IconButton size='small' onClick={handleMenuOpen} sx={{ ml: 1, color: 'primary.main' }} aria-label='Actions'>
        <Icon icon='mdi:dots-vertical' />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={e => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </>
  )
}

const DocumentDigitizationGrid = ({
  organizationId,
  projectId,
  taskId,
  token,
  documents,
  answers,
  onDeleteDocumentNode,
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
  const dispatch = useDispatch()
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

  const handleSaveDoc = async updatedDoc => {
    const taskNodePayload = {
      taskNodeId: updatedDoc.id || activeDoc.id,
      prompt: updatedDoc.prompt,
      structure: updatedDoc.structure
    }

    await taskService.updateTaskNodeForDocumentDigitization(organizationId, projectId, taskId, taskNodePayload, token)
    setOpenDocDialog(false)
    await dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['DOCUMENT'] },
        token
      })
    )
  }

  const pageNumbers = useMemo(() => {
    // Unique page numbers present in answers
    return Array.from(new Set(answers.map(a => a.pageNumber))).sort((a, b) => a - b)
  }, [answers])

  function truncateText(text, maxLength = 60) {
    if (!text) return ''
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
  }
  
  const columns = useMemo(
    () => [
      {
        field: 'pageNumber',
        headerName: 'Pages',
        width: 100,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
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
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer', // clickable for dialog
              transition: 'box-shadow 0.2s',
              pt: 3,
              pb: 2
            }}
            onClick={() => handleOpenDialog(doc)}
            title='Click to view details'
          >
            {/* Title */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: 16,
                // color: 'primary.main',
                p: 1,
                pl: 1.5,
                pb: 0.5,
                minHeight: 32
              }}
              title={doc.name}
            >
              <span>{doc.name || 'Unknown Document'}</span>
              <DocumentHeaderMenu
                doc={doc}
                onDelete={() => onDeleteDocumentNode(doc.id)}
                onEdit={() => handleOpenDialog(doc, true) /* true = editMode */}
              />
            </Box>

            {/* Prompt Section */}            
              <Tooltip title={truncateText(doc.prompt, 200) || 'No prompt, Please add one'} placement='bottom'>
                <Box
                  component='span'
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2, // Change to 1 if you want only 1 line
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
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
        ),

        renderCell: params => {
          const doc = documents.find(d => d.id === params.field)
          const pageNumber = params.row.pageNumber
          const answerObj = answers.find(a => a.documentId === doc?.documentId && a.pageNumber === pageNumber)

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
    [documents, selectedDocuments, onSelectDocument, onDeleteDocumentNode]
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

      <AnswerDialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        answer={selectedAnswer}
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
