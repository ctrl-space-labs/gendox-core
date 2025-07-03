import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/views/custom-components/mui/icon/icon'
import toast from 'react-hot-toast'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchTaskById } from 'src/store/activeTask/activeTask'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import DocumentInsightsTable from 'src/views/pages/tasks/document-insights/DocumentInsightsTable'

const DocumentInsights = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const { organizationId, taskId, projectId } = router.query

  const { selectedTask, isLoading } = useSelector(state => state.activeTask)
  
  const handleGoBack = () => {
    router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`)
  }

  useEffect(() => {
    if (organizationId && projectId && taskId && token) {
      dispatch(fetchTaskById({ organizationId, projectId, taskId, token }))
    }
  }, [organizationId, projectId, taskId, token, dispatch])

  

  const IconButtons = () => (
    <Box sx={{ display: 'inline-flex', gap: 1 }}>
      <Tooltip title='Back'>
        <IconButton
          onClick={handleGoBack}
          sx={{
            mb: 6,
            width: 'auto',
            height: 'auto',
            color: 'primary.main'
          }}
        >
          <Icon icon='mdi:arrow-left-bold' />
        </IconButton>
      </Tooltip>

      <Tooltip title='Edit Document Insights'>
        <IconButton
          onClick={() => {
            toast.error('Edit Document Insights feature is not implemented yet.')
          }}
          sx={{
            mb: 6,
            width: 'auto',
            height: 'auto',
            color: 'primary.main'
          }}
        >
          <Icon icon='mdi:pencil-outline' />
        </IconButton>
      </Tooltip>
    </Box>
  )

  return (
    <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
      <ResponsiveCardContent sx={{ backgroundColor: 'background.paper' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            filter: isLoading ? 'blur(6px)' : 'none', // Apply blur to SectionCard
            transition: 'filter 0.3s ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {' '}
            <Typography variant='h4' sx={{ fontWeight: 600, textAlign: 'left' }}>
              Document Insights
            </Typography>
            <Tooltip title='View and manage insights for your document'>
              <IconButton color='primary' sx={{ ml: 1, mb: 6, width: 'auto', height: 'auto' }}>
                <Icon icon='mdi:information-outline' />
              </IconButton>
            </Tooltip>
          </Box>

          <IconButtons />
        </Box>
      </ResponsiveCardContent>
      <Box sx={{ height: 20 }} />

      {/* Main content area */}
      <DocumentInsightsTable selectedTask={selectedTask} organizationId={organizationId} />

      <Box
        sx={{
          py: 2,
          backgroundColor: 'action.hover',
          textAlign: 'center'
        }}
      >
        <IconButtons />
      </Box>
    </Card>
  )
}

export default DocumentInsights
