import React, { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Box
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { isValid, parseISO, format } from 'date-fns'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import toast from 'react-hot-toast'
import UploaderDocuments from 'src/views/pages/tasks/helping-components/UploaderDocuments'
import SearchToolbar from 'src/utils/searchToolbar'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'
import documentService from 'src/gendox-sdk/documentService'
import { fetchDocuments } from 'src/store/activeDocument/activeDocument'
import { useDispatch, useSelector } from 'react-redux'
import { getFileTypeValidator, fetchAllPages } from 'src/utils/tasks/taskUtils'
import { getErrorMessage } from 'src/utils/errorHandler'

const DEFAULT_PAGE_SIZE = 25

const sameIds = (a, b) => a.size === b.size && Array.from(a).every(id => b.has(id))

const formatDate = value =>
  value && isValid(parseISO(value)) ? format(parseISO(value), 'dd/MM/yyyy - HH:mm') : 'Unknown date'

const NoDocumentsOverlay = () => (
  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
    <DescriptionOutlinedIcon sx={{ fontSize: 60, mb: 1 }} color='disabled' />
    <Typography>No documents found</Typography>
    <Typography variant='body2' color='text.secondary'>
      Try uploading a new document or adjust your search.
    </Typography>
  </Box>
)

const DocumentsAddNewDialog = ({
  open,
  onClose,
  existingDocumentIds = [],
  loading,
  onConfirm,
  onConfirmDocuments,
  onRemove, // when given, documents already in the task can be unchecked to remove them
  onUploadSuccess,
  organizationId,
  projectId,
  token,
  taskId,
  mode = 'main',
  taskType = 'document-digitization',
  allowUpload = true,
  multiSelect = true,
  title = 'Select Project Documents',
}) => {
  const dispatch = useDispatch()
  const { projectDocuments, isBlurring } = useSelector(state => state.activeDocument)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [showUploader, setShowUploader] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [confirmRemoval, setConfirmRemoval] = useState(false)
  const [progress, setProgress] = useState(null) // { action, done, total } while applying

  const canRemove = typeof onRemove === 'function'
  const isFileTypeSupported = useMemo(() => getFileTypeValidator(taskType), [taskType])

  // Callers rebuild existingDocumentIds on every render, so depend on its contents
  // instead of its identity — otherwise a parent render would reset the selection.
  const existingIdsKey = existingDocumentIds.join(',')
  const existingDocIds = useMemo(() => new Set(existingDocumentIds), [existingIdsKey])

  // Documents already in the task start out checked, so unchecking one removes it
  const initialIds = useMemo(() => new Set(canRemove ? existingDocIds : []), [canRemove, existingDocIds])

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialIds))
    } else {
      setSearchTerm('')
      setShowUploader(false)
      setPage(0)
      setPageSize(DEFAULT_PAGE_SIZE)
    }
  }, [open, initialIds])

  useEffect(() => {
    if (!open || !organizationId || !projectId || !token) return

    const delayFetch = setTimeout(
      () => {
        dispatch(
          fetchDocuments({
            organizationId,
            projectId,
            token,
            page,
            size: pageSize,
            target: 'projectDocuments',
            documentNameContains: searchTerm || undefined
          })
        )
      },
      searchTerm ? 500 : 0
    )

    return () => clearTimeout(delayFetch)
  }, [open, organizationId, projectId, token, page, pageSize, searchTerm, dispatch])

  const rows = useMemo(() => projectDocuments?.content || [], [projectDocuments])
  const totalElements = projectDocuments?.totalElements || 0
  const selectionModel = useMemo(() => Array.from(selectedIds), [selectedIds])
  const addedIds = useMemo(() => selectionModel.filter(id => !existingDocIds.has(id)), [selectionModel, existingDocIds])
  const removedIds = useMemo(
    () => (canRemove ? Array.from(existingDocIds).filter(id => !selectedIds.has(id)) : []),
    [canRemove, existingDocIds, selectedIds]
  )
  const isApplying = progress !== null

  const isSelectable = doc => isFileTypeSupported(doc.remoteUrl) && (canRemove || !existingDocIds.has(doc.id))

  // Handlers
  const handleSelectionChange = model => {
    if (!multiSelect) {
      setSelectedIds(new Set(model))
      return
    }

    // DataGrid only knows the current page, and re-emits the model whenever the rows
    // change (paging, search). So apply it to this page's rows only and keep whatever
    // was selected on the other pages.
    const selectedOnPage = new Set(model)
    const next = new Set(selectedIds)
    rows.forEach(doc => (selectedOnPage.has(doc.id) ? next.add(doc.id) : next.delete(doc.id)))

    if (!sameIds(next, selectedIds)) setSelectedIds(next)
  }

  const handleSelectAllMatching = async () => {
    setIsSelectingAll(true)
    try {
      const criteria = {
        organizationId,
        projectId,
        ...(searchTerm ? { documentNameContains: searchTerm } : {})
      }
      const documents = await fetchAllPages((pageNumber, size) =>
        documentService
          .findDocumentsByCriteria(organizationId, projectId, criteria, token, pageNumber, size)
          .then(response => response.data)
      )

      setSelectedIds(new Set([...initialIds, ...documents.filter(isSelectable).map(doc => doc.id)]))
    } catch (error) {
      toast.error(`Failed to select all documents. Error: ${getErrorMessage(error)}`)
    } finally {
      setIsSelectingAll(false)
    }
  }

  const handlePaginationModelChange = model => {
    if (model.pageSize !== pageSize) {
      setPageSize(model.pageSize)
      setPage(0)
      return
    }
    setPage(model.page)
  }

  const handleSearchChange = e => {
    setSearchTerm(e.target.value)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setPage(0)
  }

  const trackProgress = action => (done, total) => setProgress({ action, done, total })

  const applyChanges = async () => {
    setConfirmRemoval(false)
    try {
      if (removedIds.length) {
        setProgress({ action: 'Removing', done: 0, total: removedIds.length })
        await onRemove(removedIds, trackProgress('Removing'))
      }
      setProgress({ action: 'Adding', done: 0, total: addedIds.length })
      await onConfirm(addedIds, trackProgress('Adding'))
      if (typeof onConfirmDocuments === 'function') {
        onConfirmDocuments(rows.filter(doc => selectedIds.has(doc.id)))
      }
    } catch (error) {
      // onRemove/onConfirm report their own errors; just don't leave it unhandled
      console.error('Failed to apply document selection:', error)
    } finally {
      setProgress(null)
    }
  }

  const handleConfirm = () => (removedIds.length ? setConfirmRemoval(true) : applyChanges())

  const columns = useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Title',
        flex: 0.5,
        minWidth: 200,
        sortable: false,
        renderCell: params => (
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            <TruncatedText text={params.row.title || 'Untitled Document'} />
          </Typography>
        )
      },
      {
        field: 'createAt',
        headerName: 'Created At',
        flex: 0.25,
        minWidth: 160,
        sortable: false,
        renderCell: params => <Typography variant='body2'>{formatDate(params.row.createAt)}</Typography>
      },
      {
        field: 'status',
        headerName: '',
        flex: 0.25,
        minWidth: 160,
        sortable: false,
        renderCell: params => {
          if (!isFileTypeSupported(params.row.remoteUrl)) {
            return (
              <Typography variant='caption' color='warning.main'>
                Unsupported format
              </Typography>
            )
          }
          if (!existingDocIds.has(params.row.id)) return null

          return removedIds.includes(params.row.id) ? (
            <Typography variant='caption' color='error'>
              Will be removed
            </Typography>
          ) : (
            <Typography variant='caption' color='text.secondary'>
              In this task
            </Typography>
          )
        }
      }
    ],
    [existingDocIds, isFileTypeSupported, removedIds]
  )

  const toolbarLeftContent = multiSelect ? (
    <>
      <Typography variant='body2'>
        {addedIds.length} to add
        {removedIds.length > 0 && ` · ${removedIds.length} to remove`}
      </Typography>
      <Button
        variant='outlined'
        size='small'
        onClick={handleSelectAllMatching}
        disabled={isSelectingAll || totalElements === 0}
      >
        {searchTerm ? `Select all ${totalElements} matching` : `Select all ${totalElements}`}
      </Button>
      {(addedIds.length > 0 || removedIds.length > 0) && (
        <Button variant='outlined' size='small' onClick={() => setSelectedIds(new Set(initialIds))}>
          Reset
        </Button>
      )}
    </>
  ) : null

  return (
    <>
      <Dialog open={open} onClose={onClose} disableEscapeKeyDown={false} fullWidth maxWidth='lg'>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
          {title}
          <IconButton onClick={onClose} size='small' aria-label='close'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {/* overflow hidden so the grid is the only thing that scrolls */}
        <DialogContent sx={{ overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', height: '60vh' }}>
            {isApplying && (
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
                  {`${progress.action} ${progress.done} of ${progress.total} documents...`}
                </Typography>
              </Box>
            )}
            <DataGrid
              rows={rows}
              columns={columns}
              loading={isBlurring || isSelectingAll || loading}
              paginationMode='server'
              rowCount={totalElements}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={handlePaginationModelChange}
              checkboxSelection={multiSelect}
              disableMultipleRowSelection={!multiSelect}
              disableRowSelectionOnClick={multiSelect}
              disableColumnMenu
              hideFooterSelectedRowCount
              keepNonExistentRowsSelected
              isRowSelectable={params => isSelectable(params.row)}
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={handleSelectionChange}
              slots={{ toolbar: SearchToolbar, noRowsOverlay: NoDocumentsOverlay }}
              slotProps={{
                toolbar: {
                  value: searchTerm,
                  onChange: handleSearchChange,
                  clearSearch: handleClearSearch,
                  leftContent: toolbarLeftContent
                }
              }}
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                filter: isApplying ? 'blur(3px)' : 'none',
                transition: 'filter 0.3s ease',
                pointerEvents: isApplying ? 'none' : 'auto'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {allowUpload && (
            <Button startIcon={<CloudUploadIcon />} variant='outlined' onClick={() => setShowUploader(true)}>
              Upload New Document
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            variant='contained'
            disabled={(addedIds.length === 0 && removedIds.length === 0) || loading || isApplying}
          >
            Confirm Selection
          </Button>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmRemoval}
        onClose={() => setConfirmRemoval(false)}
        onConfirm={applyChanges}
        title='Confirm Removal'
        contentText={`Removing ${removedIds.length} document(s) will also delete their existing answers. This action cannot be undone.`}
        confirmButtonText='Remove'
        cancelButtonText='Cancel'
      />

      {/* Nested uploader modal */}
      <Dialog
        open={showUploader}
        onClose={() => setShowUploader(false)}
        fullWidth
        maxWidth='sm'
        PaperProps={{ sx: { p: 3, maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' component='div'>
            Upload Document
          </Typography>
          <IconButton onClick={() => setShowUploader(false)} size='small' aria-label='close'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {allowUpload && (
            <UploaderDocuments
              closeUploader={() => setShowUploader(false)}
              taskId={taskId}
              onClose={onClose}
              onUploadSuccess={onUploadSuccess}
              mode={mode}
              taskType={taskType}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
export default DocumentsAddNewDialog
