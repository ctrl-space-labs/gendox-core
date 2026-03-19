import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled, alpha } from '@mui/material/styles'
import WorkspaceShell from './layout/WorkspaceShell'
import WorkspaceGrid from './layout/WorkspaceGrid'
import GeeAuthGuard from './gee/GeeAuthGuard'
import GeeSessionBanner from './gee/GeeAuthGuard/GeeSessionBanner'
import { fetchTaskById } from 'src/store/activeTask/activeTask'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useRouter } from 'next/router'

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

const EarthObservationWorkspacePage = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query
  const { selectedTask } = useSelector(state => state.activeTask)

  // Receives handleReconnect from GeeAuthGuard so GeeSessionBanner can live at page level
  const geeReconnectRef = useRef(null)

  useEffect(() => {
    if (organizationId && projectId && taskId && token) {
      dispatch(fetchTaskById({ organizationId, projectId, taskId, token }))
    }
  }, [organizationId, projectId, taskId, token, dispatch])

  return (
    <PageWrapper>
      {/* Top Title row (like Gendox style header) */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
        <Typography variant='h3' sx={{ fontWeight: 700 }}>
          Earth Observation
        </Typography>

        {selectedTask?.title && (
          <>
            <Typography variant='h5' sx={{ color: 'text.disabled', fontWeight: 400, lineHeight: 1 }}>
              /
            </Typography>
            <Typography
              variant='h5'
              sx={{
                fontWeight: 500,
                color: 'text.secondary',
                maxWidth: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {selectedTask.title}
            </Typography>
          </>
        )}
      </Box>

      {/* Session-expired banner lives outside GlassSurface so it overlays the full page */}
      <GeeSessionBanner onReconnect={() => geeReconnectRef.current?.()} />
        
      {/* Main glass surface (fills the remaining height) */}
      <GlassSurface>
        <GeeAuthGuard reconnectRef={geeReconnectRef}>
          <WorkspaceShell>
            <WorkspaceGrid />
          </WorkspaceShell>
        </GeeAuthGuard>
      </GlassSurface>
    </PageWrapper>
  )
}

export default EarthObservationWorkspacePage
