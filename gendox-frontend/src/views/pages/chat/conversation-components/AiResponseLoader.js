import React, { useState, useEffect, useCallback } from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'

const AiResponseLoader = ({ isSending }) => {
  const [statusMessage, setStatusMessage] = useState('')

  // TODO this is an approximation, it needs to be updated with actual data, once SSE is enabled
  const simulateStatusUpdates = useCallback(async () => {
    setStatusMessage('Gathering local context...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStatusMessage('Searching for related documents...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStatusMessage('Generating answer...')
  }, [])

  useEffect(() => {
    if (isSending) {
      simulateStatusUpdates()
    }
  }, [isSending, simulateStatusUpdates])

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
