import { Avatar } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'

/**
 * The square brand mark used by every advanced-settings list: the service's own
 * logo when we have one, its initial otherwise. `dim` is for services that are
 * present but not in use.
 */
const ServiceAvatar = ({ meta, dim, size = 36 }) => {
  return (
    <Avatar
      variant='rounded'
      sx={{
        width: size,
        height: size,
        bgcolor: dim ? 'action.selected' : meta.color,

        // a mark that carries its own colours keeps them; the rest are drawn in white
        color: dim ? 'text.disabled' : meta.brandMark ? 'inherit' : 'common.white',
        border: meta.brandMark && !dim ? '1px solid' : undefined,
        borderColor: 'divider',
        fontSize: size * 0.42,
        fontWeight: 700
      }}
    >
      {meta.icon ? <Icon icon={meta.icon} style={{ fontSize: size * 0.5 }} /> : meta.label[0]}
    </Avatar>
  )
}

export default ServiceAvatar
