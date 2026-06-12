import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { styled, alpha } from '@mui/material/styles'
import WorkspaceShell from './layout/WorkspaceShell'
import WorkspaceGrid from './layout/WorkspaceGrid'
import GeeAuthGuard from './gee/GeeAuthGuard'
import GeeSessionBanner from './gee/GeeAuthGuard/GeeSessionBanner'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Chip from 'src/views/custom-components/mui/chip'
import commonConfig from 'src/configs/common.config.js'
import { fetchTaskById } from 'src/store/activeTask/activeTask'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useRouter } from 'next/router'
import { CONNECTOR_TYPES } from 'src/gendox-sdk/organizationConnectorService'

const GEE_SETUP_DOC_URL = `${commonConfig.gendoxDocsUrl}/earth-observation/gee-project-setup`

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
  const connectors = useSelector(state => state.activeOrganization.organizationConnectors)
  const activeOrganizationId = useSelector(state => state.activeOrganization.activeOrganization?.id)
  const geeUserEmail = useSelector(state => state.earthObservation.map.geeUserEmail)
  const geeProjectFallbackActive = useSelector(state => state.earthObservation.map.geeProjectFallbackActive)
  const geeProjectId =
    (connectors || []).find(c => c.connectorType === CONNECTOR_TYPES.GOOGLE_EARTH_ENGINE)?.config?.projectId || null
  // The configured project is "effectively missing" if it was rejected by EE
  // (disabled API, wrong ID, no access) and we fell back to the shared tier.
  const showProjectWarning = !geeProjectId || geeProjectFallbackActive
  const geeUserLabel = geeUserEmail || 'Resolving Google account…'

  console.log('Workspace render', { geeUserEmail, geeProjectId, showProjectWarning })

  const orgSettingsHref = activeOrganizationId
    ? `/gendox/organization-settings/?organizationId=${activeOrganizationId}&tab=advancedSettings#connectors`
    : '/gendox/organization-settings/?tab=advancedSettings#connectors'

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
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
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

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignSelf: 'center', alignItems: 'center' }}>
          {/* Google account currently connected to EE (independent from Gendox auth user) */}
          <Tooltip
            title='Google account connected to Earth Engine. This is separate from your Gendox login.'
            placement='bottom'
          >
            <span style={{ cursor: 'default' }}>
              <Chip
                size='small'
                variant='outlined'
                color='primary'
                // icon={<Icon icon='mdi:google' fontSize={10} />}
                label={geeUserLabel}
                sx={{
                  maxWidth: 260,
                  cursor: 'default',
                  '& .MuiChip-label': { fontWeight: 500, cursor: 'default' }
                }}
              />
            </span>
          </Tooltip>

          {/* GEE Cloud project — neutral when healthy, warning + clickable when misconfigured */}
          {!showProjectWarning ? (
            <Tooltip
              title={`Earth Engine quota is billed to Google Cloud project "${geeProjectId}".`}
              placement='bottom'
            >
              <span style={{ cursor: 'default' }}>
                <Chip
                  size='small'
                  variant='outlined'
                  color='primary'
                  icon={<Icon icon='mdi:cloud-check-outline' fontSize={14} />}
                  label={geeProjectId}
                  sx={{
                    maxWidth: 260,
                    cursor: 'default',
                    '& .MuiChip-label': { fontWeight: 500, cursor: 'default' }
                  }}
                />
              </span>
            </Tooltip>
          ) : (
            <>
              <Tooltip
                title={
                  geeProjectFallbackActive
                    ? `The configured GEE project "${geeProjectId}" was rejected by Earth Engine — most likely the Earth Engine API is not enabled, the ID is wrong, or you lack access. Workspace is running on the shared rate-limited tier. Click to configure.`
                    : 'No organization GEE project is configured. Earth Engine tile requests are on the shared rate-limited pool and may fail intermittently. Click to configure.'
                }
                placement='bottom'
              >
                <span>
                  <Chip
                    size='small'
                    variant='outlined'
                    color='warning'
                    clickable
                    onClick={() => router.push(orgSettingsHref)}
                    icon={<Icon icon='mdi:alert-circle-outline' fontSize={14} />}
                    label={
                      geeProjectFallbackActive ? `${geeProjectId} · rate limited` : 'No project · rate limited'
                    }
                    sx={{ maxWidth: 320, '& .MuiChip-label': { fontWeight: 500 } }}
                  />
                </span>
              </Tooltip>
              <Tooltip title='Open the setup guide' placement='bottom'>
                <IconButton
                  size='small'
                  component='a'
                  href={GEE_SETUP_DOC_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  sx={{ color: 'text.secondary' }}
                >
                  <Icon icon='mdi:help-circle-outline' fontSize={18} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
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
