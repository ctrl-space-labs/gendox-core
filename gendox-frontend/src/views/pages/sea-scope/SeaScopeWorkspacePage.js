import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled, alpha } from '@mui/material/styles'
import WorkspaceShell from './layout/WorkspaceShell'
import WorkspaceGrid from './layout/WorkspaceGrid'

const PageWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2)
}))

const GlassSurface = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  height: '100%',
  // p: 2,
  borderRadius: theme.shape.borderRadius * 2,
  border: 'none',
  background: alpha(theme.palette.background.paper, 0.08),
  backdropFilter: 'blur(10px)',
  overflow: 'hidden',
  padding: 0
}))

const SeaScopeWorkspacePage = () => {
  return (
    <PageWrapper>
      {/* Top Title row (like Gendox style header) */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant='h3' sx={{ fontWeight: 700 }}>
          Sea Scope
        </Typography>
      </Box>

      {/* Main glass surface (fills the remaining height) */}
      <GlassSurface>
        <WorkspaceShell>
          <WorkspaceGrid />
        </WorkspaceShell>
      </GlassSurface>
    </PageWrapper>
  )
}

export default SeaScopeWorkspacePage
