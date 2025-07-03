import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Button from '@mui/material/Button'

const QuestionsHeader = ({ questions, openEditQuestionDialog }) => {
  return (
    <Box sx={{ display: 'flex', borderBottom: 2, borderColor: 'divider', py: 1 }}>
      <Typography sx={{ flex: 2, fontWeight: 600 }}>Document</Typography>
      {questions.map((q, idx) => (
        <Box key={q.id || idx} sx={{ flex: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            sx={{
              flexGrow: 0,
              marginRight: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {q.text}
          </Typography>
          <IconButton size='small' onClick={() => openEditQuestionDialog(q)} aria-label='edit question'>
            <Icon icon='mdi:pencil-outline' fontSize='1.2rem' />
          </IconButton>
        </Box>
      ))}
      <Typography sx={{ flex: 1 }} />
      {/* Optionally you can pass a generateAll function here */}
      <Box sx={{ flex: 1 }}>
        <Button
          size='small'
          variant='contained'
          onClick={() => {
            /* generate answers */
          }}
        >
          Generate ALL
        </Button>
      </Box>
    </Box>
  )
}

export default QuestionsHeader
