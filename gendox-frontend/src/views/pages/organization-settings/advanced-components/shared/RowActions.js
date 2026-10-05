import { Stack, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'

/**
 * The controls a row ends with.
 *
 * They are always there — a control that appears only once the pointer finds it
 * is a control you have to discover. What keeps them from shouting is their
 * weight, not their absence: in the text colour, and delete turns red only under
 * the pointer, because red is what it does rather than what it is.
 *
 * A disabled action keeps its tooltip, so the row can say why instead of just
 * refusing.
 */
const RowActions = ({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  editIcon = 'mdi:pencil-outline',
  editDisabled = false,
  deleteDisabled = false,
  children
}) => {
  const quiet = hoverColor => ({
    color: 'text.secondary',
    transition: 'color .15s ease',
    '&:hover': { color: hoverColor, bgcolor: 'action.hover' }
  })

  const stop = fn => event => {
    event.stopPropagation()
    fn?.()
  }

  return (
    <Stack direction='row' spacing={0.25} sx={{ flexShrink: 0 }}>
      {children}

      {onEdit && (
        <Tooltip title={editLabel}>
          <span>
            <IconButton size='small' disabled={editDisabled} onClick={stop(onEdit)} sx={quiet('primary.main')}>
              <Icon icon={editIcon} style={{ fontSize: '1.15rem' }} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip title={deleteLabel}>
          <span>
            <IconButton size='small' disabled={deleteDisabled} onClick={stop(onDelete)} sx={quiet('error.main')}>
              <Icon icon='mdi:trash-can-outline' style={{ fontSize: '1.15rem' }} />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  )
}

export default RowActions
