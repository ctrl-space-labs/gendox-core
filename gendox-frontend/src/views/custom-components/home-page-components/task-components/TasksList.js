import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import { DataGrid } from '@mui/x-data-grid'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { localStorageConstants } from 'src/utils/generalConstants'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import CreateOrEditTaskDialog from './CreateOrEditTaskDialog'
import DuplicateTaskDialog from './DuplicateTaskDialog'
import { deleteTask } from 'src/store/activeTask/activeTask'

// Map your codes to user-friendly labels + colors
const TASK_TYPE_MAP = {
  DEEP_RESEARCH: { label: 'Deep Research', color: 'primary' },
  DOCUMENT_INSIGHTS: { label: 'Document Insights', color: 'success' },
  DOCUMENT_DIGITIZATION: { label: 'Document Digitization', color: 'warning' }
}

const TasksList = ({ projectTasks, page }) => {
  const dispatch = useDispatch()
  const { projectDetails } = useSelector(state => state.activeProject)
  const router = useRouter()
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const { id: projectId, organizationId } = projectDetails
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filteredTasks, setFilteredTasks] = useState(projectTasks)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)

  useEffect(() => {
    setFilteredTasks(projectTasks || [])
  }, [projectTasks])

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredTasks(projectTasks)
    } else {
      const filtered = projectTasks.filter(task =>
        Object.values(task).some(value => value && value.toString().toLowerCase().includes(searchText.toLowerCase()))
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
  }

  const openDeleteConfirm = () => {
    setConfirmDeleteOpen(true)
    handleMenuClose()
  }

  const closeDeleteConfirm = () => {
    setConfirmDeleteOpen(false)
  }

  const openEditDialog = () => {
    setEditDialogOpen(true)
    handleMenuClose()
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return
    setIsDeleting(true)

    try {
      await dispatch(deleteTask({ organizationId, projectId, taskId: selectedTask.id, token })).unwrap()
      toast.success(`Task "${selectedTask.title}" deleted.`)
      closeDeleteConfirm()
    } catch (error) {
      toast.error(`Failed to delete task: ${getErrorMessage(error)}`)
    } finally {
      setIsDeleting(false)
      setSelectedTask(null)
    }
  }

  const handleRowClick = params => {
    const typeCode = params.row.taskType?.value || params.row.taskType?.name || params.row.type || ''

    let route = ''
    if (typeCode === 'DOCUMENT_INSIGHTS') {
      route = `/gendox/tasks/document-insights/?organizationId=${organizationId}&projectId=${projectId}&taskId=${params.row.id}`
    } else if (typeCode === 'DOCUMENT_DIGITIZATION') {
      route = `/gendox/tasks/document-digitization/?organizationId=${organizationId}&projectId=${projectId}&taskId=${params.row.id}`
    } else {
      // fallback, e.g. stay on page or show error/toast
      return
    }

    router.push(route)
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
      flex: 0.3,
      minWidth: 160,
      sortable: true,
      renderCell: params => {
        const typeCode = params.row.taskType?.value || params.row.taskType?.name || ''
        const typeInfo = TASK_TYPE_MAP[typeCode] || { label: 'Unknown', color: 'default' }
        return (
          <Tooltip title={typeInfo.label} arrow>
            <Chip
              label={typeInfo.label}
              color={typeInfo.color}
              variant='outlined'
              size='small'
              sx={{ cursor: 'default', userSelect: 'none' }}
            />
          </Tooltip>
        )
      }
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
              event.currentTarget.blur();
              handleMenuClick(event, params.row)
            }}
            disabled={isDeleting}
            size='small'
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
            <MenuItem
              onClick={event => {
                event.currentTarget.blur()
                handleMenuClose()
                setTimeout(() => {
                  setEditDialogOpen(true)
                }, 20)
              }}
              disabled={isDeleting}
              sx={{
                gap: 1.5,
                py: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Icon icon='mdi:pencil-outline' width={20} />
              Edit Task
            </MenuItem>

            {selectedTask?.taskType?.name === 'DOCUMENT_INSIGHTS' && (
              <MenuItem
                onClick={event => {
                  event.currentTarget.blur()
                  handleMenuClose()
                  setTimeout(() => {
                    setDuplicateDialogOpen(true)
                  }, 20)
                }}
                disabled={isDeleting}
                sx={{
                  gap: 1.5,
                  py: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Icon icon='mdi:content-copy' width={20} />
                Duplicate Task
              </MenuItem>
            )}

            <MenuItem
              onClick={openDeleteConfirm}
              disabled={isDeleting}
              sx={{
                gap: 1.5,
                py: 1,
                color: 'error.main',
                '&:hover': { color: 'error.dark' }
              }}
            >
              <Icon icon='mdi:trash-can-outline' width={20} />
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

      {!filteredTasks || filteredTasks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Box sx={{ fontSize: 48, mb: 2 }} role='img' aria-label='Empty inbox'>
            📭
          </Box>
          <Typography variant='h6' sx={{ mb: 1, fontWeight: 'bold' }}>
            No tasks here yet!
          </Typography>
          <Typography variant='body2'>
            Looks like you don’t have any tasks yet. Why not create one and get started? 🚀
          </Typography>
        </Box>
      ) : (
        <DataGrid
          rows={filteredTasks}
          columns={columns}
          pageSizeOptions={[10, 20, 40, 100]}
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
          selectedTask ? (
            <Box>
              Are you sure you want to delete the task{' '}
              <Typography component='span' sx={{ fontWeight: 'bold' }}>
                "{selectedTask.title}"
              </Typography>
              ? This action cannot be undone.
            </Box>
          ) : (
            'Are you sure you want to delete this task? This action cannot be undone.'
          )
        }
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
        disableConfirm={isDeleting}
      />
      <CreateOrEditTaskDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        initialData={selectedTask || {}}
        editMode={true}
        TASK_TYPE_MAP={TASK_TYPE_MAP}
      />
      <DuplicateTaskDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        task={selectedTask}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
      />
    </Card>
  )
}

export default TasksList
