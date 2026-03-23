import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, LinearProgress, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import { pollDeepThinkingStatus, cancelDeepThinking, loadThread, chatActions } from 'src/store/chat/gendoxChat'
import { localStorageConstants } from 'src/utils/generalConstants'

const STEP_TYPE_LABELS = {
  LLM_CALL: 'AI Processing',
  TOOL_EXECUTION: 'Executing Tool',
  SUB_AGENT_CREATED: 'Sub-agent Created',
  SUB_AGENT_COMPLETED: 'Sub-agent Completed',
  FINAL_RESPONSE: 'Final Response',
  ERROR: 'Error'
}

const AiResponseLoader = ({ isSending }) => {
  const dispatch = useDispatch()
  const [statusMessage, setStatusMessage] = useState('')
  const pollingRef = useRef(null)

  const {
    isDeepThinking,
    deepThinkingJobId,
    deepThinkingSteps
  } = useSelector(state => state.gendoxChat)

  const currentThread = useSelector(state => state.gendoxChat.currentThread)

  // TODO this is an approximation, it needs to be updated with actual data, once SSE is enabled
  const simulateStatusUpdates = useCallback(async () => {
    setStatusMessage('Gathering local context...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStatusMessage('Searching for related documents...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStatusMessage('Generating answer...')
  }, [])

  useEffect(() => {
    if (isSending && !isDeepThinking) {
      simulateStatusUpdates()
    }
  }, [isSending, isDeepThinking, simulateStatusUpdates])

  useEffect(() => {
    if (!isDeepThinking || !deepThinkingJobId || !currentThread) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    const organizationId = currentThread.organizationId
    const projectId = currentThread.projectId
    const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
    let pollCount = 0

    const poll = () => {
      dispatch(
        pollDeepThinkingStatus({
          organizationId,
          projectId,
          jobExecutionId: deepThinkingJobId,
          token
        })
      ).then(action => {
        if (action.payload) {
          const { status } = action.payload
          if (['COMPLETED', 'FAILED', 'STOPPED', 'ABANDONED'].includes(status)) {
            clearInterval(pollingRef.current)
            pollingRef.current = null

            if (status === 'COMPLETED') {
              dispatch(
                loadThread({
                  threadId: currentThread.threadId,
                  projectId,
                  organizationId,
                  token
                })
              )
            }
          }
        }
      })
      pollCount++
    }

    const getInterval = () => {
      if (pollCount < 5) return 2000
      if (pollCount < 15) return 5000
      return 10000
    }

    poll()
    pollingRef.current = setInterval(poll, getInterval())

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isDeepThinking, deepThinkingJobId, currentThread, dispatch])

  const handleCancel = () => {
    if (!currentThread || !deepThinkingJobId) return

    dispatch(
      cancelDeepThinking({
        organizationId: currentThread.organizationId,
        projectId: currentThread.projectId,
        jobExecutionId: deepThinkingJobId,
        token: window.localStorage.getItem(localStorageConstants.accessTokenKey)
      })
    )
  }

  if (isDeepThinking) {
    return (
      <Box
        sx={{
          width: '90%',
          maxWidth: '800px',
          mt: 3,
          mb: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
          mx: 'auto'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Deep Thinking in progress...
          </Typography>
          <Button
            variant='outlined'
            color='error'
            size='small'
            startIcon={<StopCircleIcon />}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Box>

        <LinearProgress
          color='primary'
          sx={{
            height: 6,
            borderRadius: 1,
            mb: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }}
        />

        {deepThinkingSteps.length > 0 && (
          <Stepper activeStep={deepThinkingSteps.length - 1} orientation='vertical' sx={{ mt: 2 }}>
            {deepThinkingSteps.map((step, index) => (
              <Step key={step.id || index} completed={index < deepThinkingSteps.length - 1}>
                <StepLabel>
                  <Typography variant='body2' sx={{ fontWeight: index === deepThinkingSteps.length - 1 ? 'bold' : 'normal' }}>
                    {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                  </Typography>
                </StepLabel>
                {step.summary && (
                  <StepContent>
                    <Typography variant='caption' color='text.secondary'>
                      {step.summary}
                    </Typography>
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>
        )}
      </Box>
    )
  }

  return (
    isSending && (
      <Box
        sx={{
          width: '90%', // Reduce the width to leave space on the sides
          maxWidth: '800px', // Optional: Add a maximum width for better control
          mt: 3,
          mb: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)', // Slightly more prominent shadow
          textAlign: 'center',
          mx: 'auto' // Center the box horizontally
        }}
      >
        <LinearProgress
          color='primary'
          sx={{
            height: 6, // Slightly thinner for a sleeker look
            borderRadius: 1, // Adds rounded corners
            mb: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.1)' // Subtle background for contrast
          }}
        />
        <Typography variant='body1' sx={{
            mt: 1,
            fontWeight: 'bold', // Bold text for emphasis
            color: 'primary.main' // Use theme's primary color for text
          }}>
          {statusMessage}
        </Typography>
      </Box>
    )
  )
}

export default AiResponseLoader
