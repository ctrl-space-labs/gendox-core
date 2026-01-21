import SeaScopeLayout from '../../../layouts/SeaScopeLayout'
import Box from '@mui/material/Box'
import SeaScopeWorkspacePage from 'src/views/pages/sea-scope/SeaScopeWorkspacePage'
import { useTheme } from '@mui/material/styles'

function SeaScopeHomePage() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - 3.5rem)`,
        width: '100%',
        display: 'flex',
        overflow: 'hidden',
        minHeight: 0
      }}
    >
      <SeaScopeWorkspacePage />
    </Box>
  )
}

SeaScopeHomePage.getLayout = page => <SeaScopeLayout>{page}</SeaScopeLayout>
SeaScopeHomePage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default SeaScopeHomePage
