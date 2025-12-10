import React from 'react'
// MUI Imports
import { Box, Collapse, IconButton, Paper, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'




const CleanCollapse = ({ title, open, onToggle, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        onClick={onToggle}
        sx={{
          px: 2.5,
          py: 1.8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        <IconButton size='small'>{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
      </Box>

      <Collapse in={open} timeout={180}>
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 2.5,
            backgroundColor: 'action.hover'
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default CleanCollapse
