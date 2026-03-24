import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { Icon } from '@iconify/react'

export default function SaveActions({
  createEOScriptLoading,
  hasUnsavedChanges,
  hasPendingChange,
  onSave,
  onKeepAll,
  onUndoAll
}) {
  return (
    <>
      <Divider orientation='vertical' flexItem sx={{ mx: 0.25 }} />

      <Tooltip
        title={createEOScriptLoading ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'Saved'}
        placement='bottom'
      >
        <span>
          <IconButton
            size='small'
            onClick={onSave}
            disabled={createEOScriptLoading || !hasUnsavedChanges}
            sx={{ borderRadius: 1, color: hasUnsavedChanges ? 'warning.main' : 'text.disabled' }}
          >
            {createEOScriptLoading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <Icon icon='mdi:content-save-outline' width={18} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {hasPendingChange && (
        <>
          <Tooltip title='Keep all changes and clear preview' placement='bottom'>
            <Button
              size='small'
              variant='outlined'
              onClick={onKeepAll}
              startIcon={<Icon icon='mdi:check-all' width={16} />}
              sx={{ textTransform: 'none', fontSize: 12, py: 0.25, borderColor: 'success.main', color: 'success.main' }}
            >
              Keep all
            </Button>
          </Tooltip>
          <Tooltip title='Revert to content before this edit' placement='bottom'>
            <Button
              size='small'
              variant='outlined'
              onClick={onUndoAll}
              startIcon={<Icon icon='mdi:undo' width={16} />}
              sx={{ textTransform: 'none', fontSize: 12, py: 0.25, borderColor: 'text.secondary', color: 'text.secondary' }}
            >
              Undo all
            </Button>
          </Tooltip>
        </>
      )}
    </>
  )
}
