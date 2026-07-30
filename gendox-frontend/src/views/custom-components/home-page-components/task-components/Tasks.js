import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import { Box, Typography, Button, IconButton, Tooltip, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Icon from 'src/views/custom-components/mui/icon/icon'
import toast from 'react-hot-toast'

import TasksList from './TasksList'
import CreateTaskDialog from './CreateOrEditTaskDialog'
import { fetchTasks, createTask } from 'src/store/activeTask/activeTask'
import { isValidOrganizationAndProject } from 'src/utils/validators'
import { localStorageConstants } from 'src/utils/generalConstants'
import SearchBar from 'src/utils/SearchBar'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'

const DEFAULT_SORT = 'createdAt,desc'
const SORTABLE_FIELDS = new Set(['title', 'type', 'description', 'createdAt'])

const sortModelToParam = sortModel => {
  const active = sortModel?.[0]
  if (!active?.field || !active?.sort || !SORTABLE_FIELDS.has(active.field)) {
    return DEFAULT_SORT
  }
  // Type is a relation — sort by the type name column
  const field = active.field === 'type' ? 'taskType.name' : active.field
  return `${field},${active.sort}`
}

const sortParamToModel = (sortParam = DEFAULT_SORT) => {
  const [rawField, sort] = sortParam.split(',')
  const field = rawField === 'taskType.name' ? 'type' : rawField
  if (!SORTABLE_FIELDS.has(field) || (sort !== 'asc' && sort !== 'desc')) {
    return [{ field: 'createdAt', sort: 'desc' }]
  }
  return [{ field, sort }]
}

const Tasks = () => {
  const { user } = useAuth()
  const router = useRouter()
  const dispatch = useDispatch()

  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const { projectTasks, isLoading } = useSelector(state => state.activeTask)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [taskNameContains, setTaskNameContains] = useState('')
  const [sort, setSort] = useState(DEFAULT_SORT)
  const skipDebounceRef = useRef(false)
  const isSearchMountedRef = useRef(false)

  const sortModel = useMemo(() => sortParamToModel(sort), [sort])

  useEffect(() => {
    setSearchInput('')
    setTaskNameContains('')
    setSort(DEFAULT_SORT)
    isSearchMountedRef.current = false
  }, [projectId])

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      dispatch(
        fetchTasks({
          organizationId,
          projectId,
          token,
          taskNameContains: taskNameContains || undefined,
          sort
        })
      )
    }
  }, [organizationId, projectId, taskNameContains, sort, dispatch, token, user])

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
      if (searchInput !== taskNameContains) {
        setTaskNameContains(searchInput)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput, taskNameContains])

  const applySearch = value => {
    skipDebounceRef.current = true
    setSearchInput(value)
    if (value !== taskNameContains) {
      setTaskNameContains(value)
    }
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      applySearch(searchInput)
    }
  }

  const handleSortModelChange = useCallback(
    nextSortModel => {
      const nextSort = sortModelToParam(nextSortModel)
      if (nextSort === sort) return
      setSort(nextSort)
    },
    [sort]
  )

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
      dispatch(
        fetchTasks({
          organizationId,
          projectId,
          token,
          taskNameContains: taskNameContains || undefined,
          sort
        })
      )
      applySearch('')
    } catch (error) {
      toast.error(`Failed to create task: ${error}`)
    }
  }

  const showEmpty = !isLoading && projectTasks.length === 0 && !taskNameContains

  return (
    <ResponsiveCardContent
      sx={{
        backgroundColor: 'action.hover',
        filter: isLoading ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
      aria-busy={isLoading}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems='center'
        spacing={2}
        mb={3}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='h5' fontWeight={700}>
            Document Analytics Tasks
          </Typography>
          <Tooltip title='Create and manage tasks for your project' arrow>
            <IconButton color='primary' aria-label='info about tasks'>
              <Icon icon='mdi:information-outline' />
            </IconButton>
          </Tooltip>
        </Box>

        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
          disabled={isLoading}
          aria-label='Create new task'
        >
          Create New Task
        </Button>
      </Stack>

      {/* Search */}
      {(projectTasks.length > 0 || taskNameContains) && (
        <Box mb={3}>
          <SearchBar
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder='Search tasks'
            clearable
            sx={{ maxWidth: 400 }}
          />
        </Box>
      )}

      {/* Content */}
      {showEmpty ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant='body2' sx={{ mb: 2, fontStyle: 'italic' }}>
            There are currently no tasks available. Consider creating a new task to begin organizing your work
            efficiently.
          </Typography>
        </Box>
      ) : (
        <TasksList
          projectTasks={projectTasks}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          emptySearch={Boolean(taskNameContains) && projectTasks.length === 0}
        />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleCreateTask}
        initialData={{ title: '', description: '', taskType: '' }}
      />
    </ResponsiveCardContent>
  )
}

export default Tasks
