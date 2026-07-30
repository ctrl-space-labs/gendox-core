import React, { useState, useEffect, useRef, useMemo } from 'react'
import { isValid, parseISO, format } from 'date-fns'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import { DataGrid } from '@mui/x-data-grid'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import documentService from 'src/gendox-sdk/documentService.js'
import SearchToolbar from 'src/utils/searchToolbar'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { fetchProjectDocuments } from 'src/store/activeDocument/activeDocument'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { localStorageConstants } from 'src/utils/generalConstants'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'

const DocumentsList = ({
  documents,
  page,
  pageSize = 20,
  totalElements = 0,
  documentNameContains = '',
  sort = 'createdAt,desc',
  sortModel = [{ field: 'createdAt', sort: 'desc' }],
  onSearch,
  onPaginationModelChange,
  onSortModelChange
}) => {
  const dispatch = useDispatch()
  const { projectDetails, projectMembers } = useSelector(state => state.activeProject)
  const router = useRouter()
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const { id: projectId, organizationId } = projectDetails

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [rowSelectionModel, setRowSelectionModel] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteMode, setDeleteMode] = useState('single') // 'single' | 'bulk'
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingCount, setDeletingCount] = useState(0)
  const [searchInput, setSearchInput] = useState(documentNameContains)
  const skipDebounceRef = useRef(false)
  const isSearchMountedRef = useRef(false)
  const ignorePaginationRef = useRef(true)

  const paginationModel = useMemo(() => ({ page, pageSize }), [page, pageSize])

  useEffect(() => {
    setSearchInput(documentNameContains)
  }, [documentNameContains])

  useEffect(() => {
    setRowSelectionModel([])
  }, [documents])

  // DataGrid can emit pagination events shortly after mount — ignore briefly so
  // opening/warming list view doesn't trigger a refetch + blur.
  useEffect(() => {
    ignorePaginationRef.current = true
    const timer = window.setTimeout(() => {
      ignorePaginationRef.current = false
    }, 300)
    return () => window.clearTimeout(timer)
  }, [])

  // Debounce search input → parent. Skip the initial mount so opening list view
  // doesn't wait ~500ms or trigger a needless refetch.
  useEffect(() => {
    if (!isSearchMountedRef.current) {
      isSearchMountedRef.current = true
      return
    }

    if (skipDebounceRef.current) {
      skipDebounceRef.current = false
      return
    }

    const timer = setTimeout(() => {
      if (searchInput !== documentNameContains) {
        onSearch?.(searchInput)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput, documentNameContains, onSearch])

  const handlePaginationModelChange = model => {
    if (ignorePaginationRef.current) {
      return
    }
    setRowSelectionModel([])
    onPaginationModelChange?.(model)
  }

  const handleSortModelChange = model => {
    if (ignorePaginationRef.current) {
      return
    }
    onSortModelChange?.(model)
  }

  const handleMenuClick = (event, document) => {
    setAnchorEl(event.currentTarget)
    setSelectedDocument(document)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDeleteConfirmOpen = () => {
    handleMenuClose()
    setDeleteMode('single')
    setConfirmDelete(true)
  }

  const handleBulkDeleteConfirmOpen = () => {
    setDeleteMode('bulk')
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const applySearch = value => {
    skipDebounceRef.current = true
    setSearchInput(value)
    if (value !== documentNameContains) {
      onSearch?.(value)
    }
  }

  const handleSearchInputChange = event => {
    setSearchInput(event.target.value)
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      applySearch(searchInput)
    }
  }

  const handleClearSearch = () => {
    applySearch('')
  }

  const refreshDocuments = () => {
    dispatch(
      fetchProjectDocuments({
        organizationId,
        projectId,
        token,
        page: page,
        size: pageSize,
        documentNameContains: documentNameContains || undefined,
        sort
      })
    )
  }

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return

    setConfirmDelete(false)
    setIsDeleting(true)
    setDeletingCount(1)

    try {
      await documentService.deleteDocument(organizationId, projectId, selectedDocument.id, token)
      toast.success('The document has been successfully deleted.')
      setSelectedDocument(null)
      setRowSelectionModel(prev => prev.filter(id => id !== selectedDocument.id))
      refreshDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error(`Document deletion failed. Error: ${getErrorMessage(error)}`)
      setSelectedDocument(null)
    } finally {
      setIsDeleting(false)
      setDeletingCount(0)
    }
  }

  const handleBulkDeleteDocuments = async () => {
    if (!rowSelectionModel.length) return

    const idsToDelete = [...rowSelectionModel]
    setConfirmDelete(false)
    setIsDeleting(true)
    setDeletingCount(idsToDelete.length)

    try {
      await documentService.deleteDocuments(organizationId, projectId, idsToDelete, token)
      setRowSelectionModel([])
      refreshDocuments()
      toast.success(
        idsToDelete.length === 1
          ? 'The document has been successfully deleted.'
          : `${idsToDelete.length} documents have been successfully deleted.`
      )
    } catch (error) {
      console.error('Failed to delete documents:', error)
      toast.error(`Document deletion failed. Error: ${getErrorMessage(error)}`)
    } finally {
      setIsDeleting(false)
      setDeletingCount(0)
    }
  }

  const handleConfirmDelete = () => {
    if (deleteMode === 'bulk') {
      handleBulkDeleteDocuments()
    } else {
      handleDeleteDocument()
    }
  }

  const handleRowClick = params => {
    const { id } = params.row
    router.push(`/gendox/document-instance/?organizationId=${organizationId}&documentId=${id}&projectId=${projectId}`)
  }

  const getDeleteDialogContent = () => {
    if (deleteMode === 'bulk') {
      const count = rowSelectionModel.length
      return count === 1
        ? 'Are you sure you want to delete the selected document? This action cannot be undone.'
        : `Are you sure you want to delete ${count} selected documents? This action cannot be undone.`
    }

    return selectedDocument
      ? `Are you sure you want to delete "${selectedDocument.title}"? This action cannot be undone.`
      : 'Are you sure you want to delete this document? This action cannot be undone.'
  }

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 0.3,
      minWidth: 200,
      sortable: true,
      renderCell: params => (
        <Typography variant='body2' sx={{ fontWeight: 600 }}>
          <TruncatedText text={params.row.title} />
        </Typography>
      )
    },
    {
      field: 'author',
      headerName: 'Author',
      flex: 0.2,
      minWidth: 150,
      sortable: false,
      valueGetter: params => {
        const documentAuthor = projectMembers.find(member => member.user.id === params?.row.createdBy)
        return documentAuthor?.user?.name || 'Unknown Author'
      },
      renderCell: params => <Typography variant='body2'>{params.value}</Typography>
    },
    {
      field: 'authorEmail',
      headerName: 'Author Email',
      flex: 0.2,
      minWidth: 200,
      sortable: false,
      valueGetter: params => {
        const documentAuthor = projectMembers.find(member => member.user.id === params?.row.createdBy)
        return documentAuthor?.user?.email || 'Unknown Email'
      },
      renderCell: params => <Typography variant='body2'>{params.value}</Typography>
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 0.2,
      minWidth: 150,
      sortable: true,
      renderCell: params => {
        const createdAt = params.row.createAt
        const formattedDate =
          createdAt && isValid(parseISO(createdAt)) ? format(parseISO(createdAt), 'dd/MM/yyyy - HH:mm') : 'Unknown Date'

        return <Typography variant='body2'>{formattedDate}</Typography>
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: params => (
        <>
          <IconButton
            onClick={event => {
              event.stopPropagation() // Prevent row click event
              handleMenuClick(event, params.row) // Open menu
            }}
          >
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            id='actions-menu'
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
          >
            <MenuItem onClick={handleDeleteConfirmOpen}>Delete Document</MenuItem>
          </Menu>
        </>
      )
    }
  ]

  return (
    <Card sx={{ position: 'relative' }}>
      {isDeleting && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />}

      {isDeleting && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress size={36} />
          <Typography variant='body1' color='text.primary'>
            {deletingCount === 1
              ? 'Deleting document...'
              : `Deleting ${deletingCount} documents...`}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          filter: isDeleting ? 'blur(3px)' : 'none',
          transition: 'filter 0.3s ease',
          pointerEvents: isDeleting ? 'none' : 'auto'
        }}
      >
        <CardHeader />
        <DataGrid
          autoHeight
          rows={documents || []}
          columns={columns}
          paginationMode='server'
          sortingMode='server'
          sortingOrder={['asc', 'desc']}
          rowCount={totalElements}
          pageSizeOptions={[10, 20, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          onRowClick={handleRowClick}
          slots={{ toolbar: SearchToolbar }}
          slotProps={{
            toolbar: {
              value: searchInput,
              clearSearch: handleClearSearch,
              onChange: handleSearchInputChange,
              onKeyDown: handleSearchKeyDown,
              leftContent:
                rowSelectionModel.length > 0 ? (
                  <>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      {rowSelectionModel.length} selected
                    </Typography>
                    <Button
                      variant='outlined'
                      color='error'
                      size='small'
                      startIcon={<Icon icon='mdi:delete-outline' />}
                      onClick={handleBulkDeleteConfirmOpen}
                      disabled={isDeleting}
                    >
                      Delete Selected
                    </Button>
                  </>
                ) : null
            }
          }}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer' // Make rows have a pointer cursor
            }
          }}
        />
      </Box>

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleConfirmDelete}
        title='Confirm Deletion'
        contentText={getDeleteDialogContent()}
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </Card>
  )
}

export default DocumentsList
