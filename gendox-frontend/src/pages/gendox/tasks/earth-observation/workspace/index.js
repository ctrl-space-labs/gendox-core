import EarthObservationLayout from 'src/layouts/EarthObservationLayout'
import Box from '@mui/material/Box'
import dynamic from 'next/dynamic'
import { useTheme } from '@mui/material/styles'

function EarthObservationHomePage() {
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
      <EarthObservationWorkspacePage />
    </Box>
  )
}

EarthObservationHomePage.getLayout = page => <EarthObservationLayout>{page}</EarthObservationLayout>
EarthObservationHomePage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default EarthObservationHomePage

const EarthObservationWorkspacePage = dynamic(
  () => import('src/views/pages/earth-observation/EarthObservationWorkspacePage'),
  { ssr: false }
)