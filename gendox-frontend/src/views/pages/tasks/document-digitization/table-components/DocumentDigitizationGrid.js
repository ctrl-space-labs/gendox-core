import React, { useMemo, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, IconButton, Tooltip, Menu, MenuItem, Chip, Typography, Badge, Checkbox } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CircularProgress from '@mui/material/CircularProgress'
import EditIcon from '@mui/icons-material/Edit'
import DescriptionIcon from '@mui/icons-material/Description'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import BlockIcon from '@mui/icons-material/Block'
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'

const DocumentDigitizationGrid = ({
  openDialog,
  documents,
  documentPages,
  isLoading,
  page,
  pageSize,
  setPage,
  totalDocuments,
  selectedDocuments = [],
  onSelectDocument = () => {}, 
  isDocumentGenerating = () => false
}) => {
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null)
  const [actionMenuDoc, setActionMenuDoc] = useState(null)


  const docPagesMap = useMemo(() => {
    const map = {}
    // documentPages can be either an array directly or an object with content property
    const pages = Array.isArray(documentPages) ? documentPages : (documentPages?.content || [])
    pages.forEach(page => {
      if (page && page.taskDocumentNodeId) {
        map[page.taskDocumentNodeId] = page
      }
    })
    return map
  }, [documentPages])


  const renderDigitizationStatus = (params) => {
    const docPage = docPagesMap[params.row.id]
    const hasPages = docPage && docPage.numberOfNodePages > 0
    const hasPrompt = params.row.prompt && params.row.prompt.trim()
    const isGenerating = isDocumentGenerating(params.row.id)
    const isSupported = isFileTypeSupported(params.row.url)

    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: 0.5,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {!isSupported ? (
          <Chip
            icon={<BlockIcon sx={{ fontSize: '0.875rem' }} />}
            label="Unsupported Format"
            size="small"
            color="default"
            variant="filled"
            sx={{ 
              fontSize: '0.75rem',
              height: 24,
              fontWeight: 500,
              backgroundColor: 'grey.400',
              color: 'white',
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        ) : isGenerating ? (
          <Chip
            icon={<CircularProgress size={12} sx={{ color: 'white' }} />}
            label="Generating..."
            size="small"
            color="info"
            variant="filled"
            sx={{ 
              fontSize: '0.75rem',
              height: 24,
              fontWeight: 500,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        ) : hasPages ? (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '0.875rem' }} />}
            label="Digitized"
            size="small"
            color="success"
            variant="filled"
            sx={{ 
              fontSize: '0.75rem',
              height: 24,
              fontWeight: 500,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        ) : (
          <Chip
            icon={<ErrorIcon sx={{ fontSize: '0.875rem' }} />}
            label="Not Digitized"
            size="small"
            color="error"
            variant="filled"
            sx={{ 
              fontSize: '0.75rem',
              height: 24,
              fontWeight: 500,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        )}
        
        {!isGenerating && isSupported && (hasPrompt ? (
          <Chip
            label="✓ Prompt"
            size="small"
            color="primary"
            variant="filled"
            onClick={(e) => {
              e.stopPropagation()
              openDialog('docDetail', params.row._doc, false)
            }}
            sx={{ 
              fontSize: '0.75rem',
              height: 22,
              fontWeight: 500,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              cursor: 'pointer',
              '& .MuiChip-label': { px: 1.25 },
              '&:hover': {
                backgroundColor: 'primary.main'
              }
            }}
          />
        ) : (
          <Chip
            label="⚠ No prompt"
            size="small"
            color="warning"
            variant="filled"
            onClick={(e) => {
              e.stopPropagation()
              openDialog('docDetail', params.row._doc, true)
            }}
            sx={{ 
              fontSize: '0.75rem',
              height: 22,
              fontWeight: 500,
              cursor: 'pointer',
              '& .MuiChip-label': { px: 1.25 },
              '&:hover': {
                backgroundColor: 'warning.main'
              }
            }}
          />
        ))}
      </Box>
    )
  }

  const renderPageCount = (params) => {
    const docPage = docPagesMap[params.row.id]
    if (docPage && docPage.numberOfNodePages) {
      const { numberOfNodePages, documentPages } = docPage
      const missingPages = (documentPages ?? 0) - (numberOfNodePages ?? 0)
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={numberOfNodePages} color="primary">
            <DescriptionIcon color="action" />
          </Badge>
          <Typography variant="body2">
            {numberOfNodePages === 1 ? '1 page' : `${numberOfNodePages} pages`}
            {missingPages > 0 && (
              <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                ({missingPages} missing)
              </Typography>
            )}
          </Typography>
        </Box>
      )
    }
    return (
      <Typography variant="body2" color="text.secondary">
        No pages
      </Typography>
    )
  }


  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [documents])

  const columns = useMemo(
    () => [
      {
        field: 'select',
        headerName: '',
        width: 60,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => {
          const docsWithPrompts = documents.filter(doc => 
            doc.prompt && doc.prompt.trim() && isFileTypeSupported(doc.url)
          )
          const selectedDocsWithPrompts = selectedDocuments.filter(id => {
            const doc = documents.find(d => d.id === id)
            return doc?.prompt?.trim() && isFileTypeSupported(doc.url)
          })
          
          return (
            <Tooltip title="Select all supported documents with prompts">
              <Checkbox
                checked={docsWithPrompts.length > 0 && selectedDocsWithPrompts.length === docsWithPrompts.length}
                indeterminate={selectedDocsWithPrompts.length > 0 && selectedDocsWithPrompts.length < docsWithPrompts.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectDocument('all', docsWithPrompts.map(doc => doc.id))
                  } else {
                    onSelectDocument('none', [])
                  }
                }}
                size="small"
              />
            </Tooltip>
          )
        },
        renderCell: (params) => {
          const isSelected = selectedDocuments.includes(params.row.id)
          const hasPrompt = params.row.prompt && params.row.prompt.trim()
          const isSupported = isFileTypeSupported(params.row.url)
          const canSelect = hasPrompt && isSupported
          
          const tooltipTitle = !isSupported 
            ? "This file format is not supported for generation"
            : !hasPrompt 
            ? "Please add a prompt to enable selection for generation" 
            : ""
          
          return (
            <Tooltip title={tooltipTitle}>
              <span>
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => onSelectDocument(params.row.id, e.target.checked)}
                  disabled={!canSelect}
                  size="small"
                />
              </span>
            </Tooltip>
          )
        }
      },
      {
        field: 'name',
        headerName: 'Document',
        flex: 0.4,
        width: 250,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => {
          const isSelected = selectedDocuments.includes(params.row.id)
          const isGenerating = isDocumentGenerating(params.row.id)
          
          return (
            <Box 
              sx={{ 
                fontWeight: 700,
                color: isSelected ? 'primary.main' : isGenerating ? 'info.main' : 'text.primary',
                cursor: 'pointer',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                py: 1,
                gap: 1
              }}
              onClick={(e) => {
                e.stopPropagation()
                openDialog('pagePreview', params.row._doc)
              }}
            >
              {isGenerating && (
                <CircularProgress size={16} color="info" />
              )}
              {params.value}
            </Box>
          )
        }
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 180,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: renderDigitizationStatus
      },
      {
        field: 'pages',
        headerName: 'Pages',
        width: 220,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          return (
            <Box 
              sx={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                openDialog('pagePreview', params.row._doc)
              }}
            >
              {renderPageCount(params)}
            </Box>
          )
        }
      },
      {
        field: 'actions',
        headerName: '',
        width: 60,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          return (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setActionMenuDoc(params.row._doc)
                setActionMenuAnchor(e.currentTarget)
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )
        }
      }
    ],
    [documents, selectedDocuments, docPagesMap]
  )

  const rows = useMemo(() => {
    return sortedDocuments.map(doc => ({
      id: doc.id,
      name: doc.name || 'Unknown Document',
      url: doc.url || '', // Use the correct URL field
      prompt: doc.prompt || '',
      pages: '', // will be rendered by renderPageCount
      status: '', // will be rendered by renderDigitizationStatus
      actions: '', // will be rendered by actions renderCell
      _doc: doc // keep a reference for actions
    }))
  }, [sortedDocuments, docPagesMap])

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
        columnHeaderHeight={108}
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
        loading={isLoading }
        getRowClassName={(params) => {
          const isSelected = selectedDocuments.includes(params.row.id)
          return `${isSelected ? 'row-selected' : ''}`
        }}
        sx={{
          '& .MuiDataGrid-row': {
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'action.hover'
            },
            '&.row-selected': {
              backgroundColor: 'primary.50',
              '&:hover': {
                backgroundColor: 'primary.100'
              }
            }
          },
          '& .MuiDataGrid-cell': {
            outline: 'none',
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
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => {
          setActionMenuAnchor(null)
          setActionMenuDoc(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actionMenuDoc && (
          <>            
            <MenuItem
              onClick={() => {
                setActionMenuAnchor(null)
                openDialog('docDetail', actionMenuDoc, true)
                setActionMenuDoc(null)
              }}
            >
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Edit Document
            </MenuItem>
            <MenuItem
              onClick={() => {
                setActionMenuAnchor(null)
                openDialog('delete', actionMenuDoc)
                setActionMenuDoc(null)
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteOutlineIcon sx={{ mr: 1 }} fontSize="small" />
              Remove Document
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  )
}

export default DocumentDigitizationGrid
