import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Icon } from '@iconify/react'

import { fmtRelative } from '../utils/editorDateUtils'

export default function ScriptSelectorMenu({
  currentScriptName,
  hasUnsavedChanges,
  distinctScripts,
  scriptMenuAnchor,
  setScriptMenuAnchor,
  isFirstScript,
  onSelectScript,
  onOpenNewScriptDialog
}) {
  return (
    <>
      <Tooltip title='Switch script' placement='bottom'>
        <Button
          size='small'
          variant='text'
          endIcon={<Icon icon='mdi:chevron-down' width={12} />}
          onClick={e => setScriptMenuAnchor(e.currentTarget)}
          sx={{ textTransform: 'none', px: 0.75, minWidth: 0, fontWeight: 600, fontSize: 12 }}
        >
          <Icon icon='mdi:file-code-outline' width={14} style={{ marginRight: 4, flexShrink: 0, opacity: 0.6 }} />
          <Typography noWrap sx={{ fontSize: 12, maxWidth: 130, fontWeight: 600 }}>
            {currentScriptName}
          </Typography>
          {hasUnsavedChanges && (
            <Box
              component='span'
              sx={{
                ml: 0.5,
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'warning.main',
                flexShrink: 0,
                display: 'inline-block'
              }}
            />
          )}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={scriptMenuAnchor}
        open={Boolean(scriptMenuAnchor)}
        onClose={() => setScriptMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 220, maxHeight: 320 } } }}
      >
        {distinctScripts.map(script => (
          <MenuItem
            key={script.id}
            selected={script.title === currentScriptName}
            onClick={() => onSelectScript(script)}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <Typography variant='body2' noWrap>
                {script.title}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {fmtRelative(script.createdAt)}
              </Typography>
            </Box>
            {script.title === currentScriptName && (
              <Icon icon='mdi:check' width={14} style={{ marginLeft: 8, flexShrink: 0, opacity: 0.7 }} />
            )}
          </MenuItem>
        ))}

        {distinctScripts.length > 0 && <Divider />}

        <MenuItem onClick={onOpenNewScriptDialog} disabled={isFirstScript}>
          <Icon icon='mdi:plus' width={16} style={{ marginRight: 8, opacity: 0.7 }} />
          <Typography variant='body2'>New Script...</Typography>
        </MenuItem>
      </Menu>
    </>
  )
}
