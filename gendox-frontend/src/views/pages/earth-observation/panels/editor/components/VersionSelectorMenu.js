import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Icon } from '@iconify/react'

import { fmtRelative } from '../utils/editorDateUtils'

export default function VersionSelectorMenu({
  currentScriptVersions,
  currentVersion,
  currentVersionId,
  versionMenuAnchor,
  setVersionMenuAnchor,
  onSelectVersion
}) {
  if (!currentScriptVersions.length) return null

  return (
    <>
      <Typography sx={{ opacity: 0.25, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>/</Typography>

      <Tooltip title='Browse version history' placement='bottom'>
        <Button
          size='small'
          variant='text'
          endIcon={<Icon icon='mdi:chevron-down' width={12} />}
          onClick={e => setVersionMenuAnchor(e.currentTarget)}
          sx={{ textTransform: 'none', px: 0.75, minWidth: 0, opacity: 0.65, fontSize: 11 }}
        >
          <Icon icon='mdi:history' width={13} style={{ marginRight: 4, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: 11, maxWidth: 150, color: 'text.secondary' }}>
            {currentVersion?.description || 'latest'}
          </Typography>
        </Button>
      </Tooltip>

      <Menu
        anchorEl={versionMenuAnchor}
        open={Boolean(versionMenuAnchor)}
        onClose={() => setVersionMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 240, maxHeight: 320 } } }}
      >
        {currentScriptVersions.map(version => (
          <MenuItem
            key={version.id}
            selected={version.id === currentVersionId}
            onClick={() => onSelectVersion(version)}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <Typography variant='body2' noWrap>
                {version.description || 'Version'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {fmtRelative(version.createdAt)}
              </Typography>
            </Box>
            {version.id === currentVersionId && (
              <Icon icon='mdi:check' width={14} style={{ marginLeft: 8, flexShrink: 0, opacity: 0.7 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
