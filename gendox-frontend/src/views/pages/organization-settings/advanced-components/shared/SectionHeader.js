import { CardHeader, Box, Tooltip, IconButton } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'

/**
 * The header every advanced-settings section shares: title, an info tooltip,
 * and an optional add action on the right.
 */
const SectionHeader = ({ title, tooltip, addLabel, onAdd }) => {
  return (
    <CardHeader
      title={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <span>{title}</span>
          {tooltip && (
            <Tooltip title={tooltip}>
              <IconButton color='primary' sx={{ ml: 1 }}>
                <Icon icon='mdi:information-outline' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
      action={
        addLabel && (
          <Tooltip title={addLabel}>
            <IconButton color='primary' onClick={onAdd}>
              <Icon icon='mdi:plus' />
            </IconButton>
          </Tooltip>
        )
      }
    />
  )
}

export default SectionHeader