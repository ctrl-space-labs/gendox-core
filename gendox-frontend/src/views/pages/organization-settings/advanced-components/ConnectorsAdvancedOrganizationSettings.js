import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/views/custom-components/mui/icon/icon'
import commonConfig from 'src/configs/common.config.js'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import ConnectorEditDialog from './connectors/ConnectorEditDialog'
import { localStorageConstants } from 'src/utils/generalConstants'
import {
  fetchOrganizationConnectors,
  upsertOrganizationConnector,
  deleteOrganizationConnector
} from 'src/store/activeOrganization/activeOrganization'
import {
  setGeeReady,
  setGeeUserEmail,
  setGeeProjectFallbackActive
} from 'src/store/earthObservation'
import { CONNECTOR_TYPES } from 'src/gendox-sdk/organizationConnectorService'
import { clearStoredToken as clearStoredGeeToken } from 'src/views/pages/earth-observation/gee/GeeAuthGuard/geeStorage'

const GEE_SETUP_DOC_PATH = '/tasks/gee-project-setup'

const CONNECTOR_DEFINITIONS = [
  {
    type: CONNECTOR_TYPES.GOOGLE_EARTH_ENGINE,
    label: 'Google Earth Engine',
    description: 'GEE project ID used when initializing Earth Engine for this organization.',
    helpText:
      'Open Google Cloud Console (Dashboard) and copy the "Project ID" from the "Project Info" card at the top left. Make sure this project has Earth Engine enabled.',
    docHref: `${commonConfig.gendoxDocsUrl}${GEE_SETUP_DOC_PATH}`,
    docLabel: 'Full setup guide: how to create & enable a GEE project',
    fields: [
      {
        key: 'projectId',
        label: 'Project ID',
        placeholder: 'e.g. my-gee-project-123'
      }
    ]
  }
]

const ConnectorsAdvancedOrganizationSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.accessTokenKey) : null

  const organizationId = router.query.organizationId
  const connectors = useSelector(state => state.activeOrganization.organizationConnectors)
  const sectionRef = useRef(null)

  const [editTarget, setEditTarget] = useState(null) // { definition, existing }
  const [deleteTarget, setDeleteTarget] = useState(null) // { definition, existing }

  useEffect(() => {
    if (organizationId && token) {
      dispatch(fetchOrganizationConnectors({ organizationId, token }))
    }
  }, [organizationId, token, dispatch])

  // Scroll into view when opened with #connectors hash (e.g. from EO workspace warning).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#connectors') return
    const id = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
    return () => window.clearTimeout(id)
  }, [])

  // Wipe any cached GEE session (stored access token + Redux readiness flags)
  // so the next visit to the EO workspace re-authenticates from scratch and
  // initializes Earth Engine with the freshly-saved project ID. Without this,
  // window.ee keeps its old project context and the workspace silently keeps
  // using the previous project until a hard refresh.
  //
  // We deliberately set geeProjectFallbackActive=true here (not false): the
  // header project chip should show the warning state until the next EE init
  // actually verifies the saved project works. Setting it false would briefly
  // paint the chip green based on stale verification from the previous project.
  const resetGeeSession = () => {
    clearStoredGeeToken()
    dispatch(setGeeReady(false))
    dispatch(setGeeUserEmail(null))
    dispatch(setGeeProjectFallbackActive(true))
  }

  const handleEditClickOpen = definition => {
    const existing = (connectors || []).find(c => c.connectorType === definition.type)
    setEditTarget({ definition, existing })
  }

  const handleEditClose = () => setEditTarget(null)

  const handleSaveConnector = async values => {
    if (!editTarget || !organizationId || !token) return
    const payload = {
      connectorType: editTarget.definition.type,
      isActive: true,
      config: values
    }
    try {
      await dispatch(
        upsertOrganizationConnector({
          organizationId,
          connectorType: editTarget.definition.type,
          payload,
          token
        })
      ).unwrap()
      if (editTarget.definition.type === CONNECTOR_TYPES.GOOGLE_EARTH_ENGINE) {
        resetGeeSession()
      }
      setEditTarget(null)
    } catch {
      // toast handled in the thunk
    }
  }

  const handleDeleteClickOpen = definition => {
    const existing = (connectors || []).find(c => c.connectorType === definition.type)
    if (!existing) return
    setDeleteTarget({ definition, existing })
  }

  const handleDeleteClose = () => setDeleteTarget(null)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !organizationId || !token) return
    try {
      await dispatch(
        deleteOrganizationConnector({
          organizationId,
          connectorType: deleteTarget.definition.type,
          token
        })
      ).unwrap()
      if (deleteTarget.definition.type === CONNECTOR_TYPES.GOOGLE_EARTH_ENGINE) {
        resetGeeSession()
      }
      setDeleteTarget(null)
    } catch {
      setDeleteTarget(null)
    }
  }

  return (
    <Box id='connectors' ref={sectionRef} sx={{ scrollMarginTop: 80 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>Connectors</span>
            <Tooltip title='Configure external services available to this organization. These settings apply to all members and projects.'>
              <IconButton color='primary' sx={{ ml: 1 }}>
                <Icon icon='mdi:information-outline' />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      <CardContent>
        {CONNECTOR_DEFINITIONS.map(definition => {
          const existing = (connectors || []).find(c => c.connectorType === definition.type)
          const primaryField = definition.fields[0]
          const primaryValue = existing?.config?.[primaryField.key] || ''
          return (
            <Grid item xs={12} sm={12} md={6} sx={{ mt: 3, mb: 4 }} key={definition.type}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  label='Connector'
                  value={definition.label}
                  disabled
                  sx={{ mr: 2, minWidth: 220 }}
                />
                <TextField
                  fullWidth
                  label={primaryField.label}
                  value={primaryValue}
                  placeholder={primaryField.placeholder}
                  disabled
                />
                <Box sx={{ display: 'flex', ml: 1 }}>
                  {definition.docHref && (
                    <Tooltip title={`Open setup guide for ${definition.label}`}>
                      <IconButton
                        component='a'
                        href={definition.docHref}
                        target='_blank'
                        rel='noopener noreferrer'
                        color='primary'
                      >
                        <Icon icon='mdi:book-open-variant' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={primaryValue ? `Edit ${definition.label}` : `Configure ${definition.label}`}>
                    <IconButton onClick={() => handleEditClickOpen(definition)} color='primary'>
                      <Icon icon='mdi:pencil-outline' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={`Delete ${definition.label}`}>
                    <span>
                      <IconButton
                        onClick={() => handleDeleteClickOpen(definition)}
                        color='error'
                        disabled={!existing}
                      >
                        <Icon icon='mdi:delete' />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          )
        })}
      </CardContent>

      <ConnectorEditDialog
        open={Boolean(editTarget)}
        onClose={handleEditClose}
        onSave={handleSaveConnector}
        definition={editTarget?.definition}
        currentConfig={editTarget?.existing?.config}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteTarget?.definition?.label || ''}`}
        contentText={`Are you sure you want to remove the ${deleteTarget?.definition?.label || ''} configuration from this organization?`}
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </Box>
  )
}

export default ConnectorsAdvancedOrganizationSettings
