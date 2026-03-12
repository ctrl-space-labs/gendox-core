import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Icon } from '@iconify/react'

export default function FirstScriptOnboarding({ newScriptNameInput, setNewScriptNameInput, onCreateNewScript }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        px: 4,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 100%)'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Icon
          icon='mdi:satellite-variant'
          width={52}
          style={{ opacity: 0.18, display: 'block', margin: '0 auto 12px' }}
        />
        <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
          Start your first script
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Give it a name and click Create.
        </Typography>
      </Box>

      <Stack direction='row' gap={1} sx={{ width: '100%', maxWidth: 380 }}>
        <TextField
          autoFocus
          fullWidth
          size='small'
          label='Script name'
          placeholder='e.g. NDVI Analysis'
          value={newScriptNameInput}
          onChange={e => setNewScriptNameInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newScriptNameInput.trim()) onCreateNewScript()
          }}
        />
        <Button
          variant='contained'
          onClick={onCreateNewScript}
          disabled={!newScriptNameInput.trim()}
          sx={{ flexShrink: 0, px: 2.5 }}
        >
          Create
        </Button>
      </Stack>
    </Box>
  )
}
