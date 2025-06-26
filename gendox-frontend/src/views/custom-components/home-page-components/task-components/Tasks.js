import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import Box from '@mui/material/Box'
import AddIcon from '@mui/icons-material/Add'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import toast from 'react-hot-toast'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { useTheme } from '@mui/material/styles'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import TasksList from './TasksList'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchTasks, createTask } from 'src/store/activeTask/activeTask'
import { isValidOrganizationAndProject } from 'src/utils/validators'
import CreateTaskDialog from './CreateTaskDialog'

const Tasks = () => {
  const { user } = useAuth()

  const router = useRouter()
  const dispatch = useDispatch()

  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { projectTasks, isLoading } = useSelector(state => state.activeTask)

  console.log('Project Tasks:', projectTasks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const theme = useTheme()

  useEffect(() => {
    setCurrentPage(0)
  }, [projectId])

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      dispatch(fetchTasks({ organizationId, projectId, token }))
    }
  }, [organizationId, projectId, dispatch])

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
      // Refresh tasks after creation
      dispatch(fetchTasks({ organizationId, projectId, token }))
    } catch (error) {
      toast.error(`Failed to create task: ${error}`)
    }
  }

  return projectId && projectId !== 'null' ? (
    <ResponsiveCardContent
      sx={{
        backgroundColor: 'action.hover',
        filter: isLoading ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
      aria-busy={isLoading}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: projectTasks.length ? 4 : 0 // Add margin only if documents exist
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {' '}
          <Typography variant='h5' sx={{ fontWeight: 600, textAlign: 'left' }}>
            Document Analytics Task
          </Typography>
          <Tooltip title='Create and manage tasks for your project'>
            <IconButton color='primary' sx={{ ml: 1, mb: 6, width: 'auto', height: 'auto' }}>
              <Icon icon='mdi:information-outline' />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleDialogOpen}>
            Create New Task
          </Button>
        </Box>
      </Box>

      {/* Empty State */}
      {!projectTasks.length ? (
        <Typography variant='body2' sx={{ textAlign: 'center', mt: 40, color: 'text.secondary' }}>
          No Task available. 
        </Typography>
      ) : (
        // Tasks List
        <TasksList projectTasks={projectTasks} page={currentPage} />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleCreateTask}
        initialData={{ title: '', description: '', taskType: '' }}
      />
    </ResponsiveCardContent>
  ) : (
    <CardContent
      sx={{
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        backgroundSize: 'cover',
        py: theme => `${theme.spacing(25)} !important`,
        backgroundImage: theme => `url(/images/pages/pages-header-bg-${theme.palette.mode}.png)`
      }}
    >
      <Typography
        variant='h5'
        sx={{
          fontWeight: 600,
          fontSize: '1.5rem !important',
          color: 'primary.main'
        }}
      >
        Hello, would you like to create a new document?
      </Typography>
      <Box mt={10}>
        <Typography variant='body2'>or choose an action from the buttons above</Typography>
      </Box>
    </CardContent>
  )
}

export default Tasks
