// ** React Imports
import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import GlobalSearchDialog from 'src/views/custom-components/global-search/GlobalSearchDialog'

const GlobalSearch = ({ hidden, user }) => {
  const [globalSearchDialogOpen, setGlobalSearchDialogOpen] = useState(false)

  const openGlobalSearchDialog = () => {
    setGlobalSearchDialogOpen(true)
  }

  const closeGlobalSearchDialog = () => {
    setGlobalSearchDialogOpen(false)
  }

  return (
    <Box onClick={openGlobalSearchDialog} sx={{ display: 'flex', cursor: 'pointer', alignItems: 'center' }}>
      <IconButton color='inherit' size='small' >
        <Icon icon='mdi:magnify' />
      </IconButton>
      {!hidden && <Typography sx={{ color: 'text.disabled' }}>Global Search</Typography>}

      <GlobalSearchDialog globalSearchDialogOpen={globalSearchDialogOpen} closeGlobalSearchDialog={closeGlobalSearchDialog} user={user} />
    </Box>
  )
}

export default GlobalSearch
