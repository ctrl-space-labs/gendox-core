import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import { DataGrid } from '@mui/x-data-grid'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import documentService from 'src/gendox-sdk/documentService.js'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { fetchProjectDocuments } from 'src/store/activeProject/activeProject'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { localStorageConstants } from 'src/utils/generalConstants'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'

const TasksList = ({ projectTasks, page }) => {
  const dispatch = useDispatch()
  const { projectDetails } = useSelector(state => state.activeProject)
  const router = useRouter()
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const { id: projectId, organizationId } = projectDetails

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filteredTasks, setFilteredTasks] = useState(projectTasks)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 })

  useEffect(() => {
    setFilteredTasks(projectTasks || [])
  }, [projectTasks])

  // Filter tasks by search
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredTasks(projectTasks)
    } else {
      const filtered = projectTasks.filter(task =>
        Object.values(task).some(value =>
          value &&
          value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      )
      setFilteredTasks(filtered)
    }
  }, [searchText, projectTasks])

  const handleMenuClick = (event, task) => {
    setAnchorEl(event.currentTarget)
    setSelectedTask(task)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedTask(null)
  }

  const openDeleteConfirm = () => {
    setConfirmDeleteOpen(true)
    handleMenuClose()
  }

  const closeDeleteConfirm = () => {
    setConfirmDeleteOpen(false)
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return
    setIsDeleting(true)

    try {
      await documentService.deleteDocument(organizationId, projectId, selectedTask.id, token)
      toast.success(`Task "${selectedTask.title}" deleted.`)
      closeDeleteConfirm()
      dispatch(fetchProjectDocuments({ organizationId, projectId, token, page }))
    } catch (error) {
      toast.error(`Failed to delete task: ${getErrorMessage(error)}`)
    } finally {
      setIsDeleting(false)
      setSelectedTask(null)
    }
  }

  const handleRowClick = params => {
    router.push(`/gendox/tasks/document-insights/?organizationId=${organizationId}&taskId=${params.row.id}&projectId=${projectId}`)
  }

  const columns = [
    {
      field: 'title',
      headerName: 'Task',
      flex: 0.4,
      minWidth: 220,
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body1'
          sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={params.row.title}
        >
          {params.row.title}
        </Typography>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.2,
      minWidth: 160,
      sortable: true,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
          {params.row.taskType?.name || '—'}
        </Typography>
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 0.4,
      minWidth: 280,
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={params.value}
        >
          {params.value || 'No description'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      renderCell: params => (
        <>
          <IconButton
            aria-label='task actions'
            onClick={event => {
              event.stopPropagation()
              handleMenuClick(event, params.row)
            }}
          >
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && selectedTask?.id === params.row.id}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <MenuItem onClick={openDeleteConfirm} disabled={isDeleting}>
              Delete Task
            </MenuItem>
          </Menu>
        </>
      )
    }
  ]

  return (
    <Card
      sx={{
        position: 'relative',
        filter: isDeleting ? 'blur(3px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      {isDeleting && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}    

      {!filteredTasks.length ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant='body1' sx={{ mb: 2 }}>
            No tasks found.
          </Typography>
          <Typography variant='body2'>Try adjusting your search or create a new task.</Typography>
        </Box>
      ) : (
        <DataGrid
          autoHeight
          rows={filteredTasks}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          sx={{
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-cell': { py: 1.5 }
          }}
        />
      )}

      <DeleteConfirmDialog
        open={confirmDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteTask}
        title='Confirm Task Deletion'
        contentText={
          selectedTask
            ? `Are you sure you want to delete the task "${selectedTask.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this task? This action cannot be undone.'
        }
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </Card>
  )
}

export default TasksList
