import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  useTheme,
  Paper
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'

import TasksList from './TasksList'
import CreateTaskDialog from './CreateTaskDialog'
import { fetchTasks, createTask } from 'src/store/activeTask/activeTask'
import { isValidOrganizationAndProject } from 'src/utils/validators'
import { localStorageConstants } from 'src/utils/generalConstants'
import SearchBar from 'src/utils/SearchBar'  

const Tasks = () => {
  const { user } = useAuth()
  const router = useRouter()
  const dispatch = useDispatch()
  const theme = useTheme()

  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const { projectTasks, isLoading } = useSelector(state => state.activeTask)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filteredTasks, setFilteredTasks] = useState([])
  const [currentPage, setCurrentPage] = useState(0)

  // Debounced search function for better UX/performance
  const debouncedSearch = useCallback(
    debounce(value => {
      if (!value) {
        setFilteredTasks(projectTasks)
        return
      }
      const lower = value.toLowerCase()
      setFilteredTasks(
        projectTasks.filter(task =>
          task.title.toLowerCase().includes(lower) ||
          (task.description && task.description.toLowerCase().includes(lower))
        )
      )
    }, 300),
    [projectTasks]
  )

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      dispatch(fetchTasks({ organizationId, projectId, token }))
    }
  }, [organizationId, projectId, dispatch, token, user])

  useEffect(() => {
    setFilteredTasks(projectTasks)
  }, [projectTasks])

  useEffect(() => {
    debouncedSearch(searchText)
  }, [searchText, debouncedSearch])

  useEffect(() => {
    setCurrentPage(0)
  }, [projectId])

  const handleDialogOpen = () => setDialogOpen(true)
  const handleDialogClose = () => setDialogOpen(false)

  const handleCreateTask = async taskData => {
    if (!organizationId || !projectId) return
    const payload = {
      projectId,
      type: taskData.taskType,
      title: taskData.title,
      description: taskData.description
    }
    try {
      await dispatch(createTask({ organizationId, projectId, taskPayload: payload, token })).unwrap()
      toast.success('Task created successfully!')
      handleDialogClose()
      dispatch(fetchTasks({ organizationId, projectId, token }))
      setSearchText('') // Reset search on new task creation
    } catch (error) {
      toast.error(`Failed to create task: ${error}`)
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        backgroundColor: theme.palette.action.hover,
        display: 'flex',
        flexDirection: 'column'
      }}
      aria-busy={isLoading}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        mb={3}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Document Analytics Tasks
          </Typography>
          <Tooltip title="Create and manage tasks for your project" arrow>
            <IconButton color="primary" aria-label="info about tasks">
              <Icon icon="mdi:information-outline" />
            </IconButton>
          </Tooltip>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
          disabled={isLoading}
          aria-label="Create new task"
        >
          Create New Task
        </Button>
      </Stack>

      {/* Search */}
      <Box mb={3}>
        <SearchBar
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search tasks"
          clearable
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress aria-label="Loading tasks" />
        </Box>
      ) : filteredTasks.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 6, flexGrow: 1 }}
          aria-live="polite"
        >
          No tasks found. {projectTasks.length > 0 && 'Try adjusting your search criteria.'}
        </Typography>
      ) : (
        <TasksList projectTasks={filteredTasks} page={currentPage} onPageChange={setCurrentPage} />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleCreateTask}
        initialData={{ title: '', description: '', taskType: '' }}
      />
    </Paper>
  )
}

export default Tasks

