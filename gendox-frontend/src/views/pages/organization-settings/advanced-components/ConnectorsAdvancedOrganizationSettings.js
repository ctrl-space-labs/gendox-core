import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { CardContent, Box, Stack, Typography, Chip, Tooltip, Button, Collapse } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { localStorageConstants } from 'src/utils/generalConstants'
import {
  fetchOrganizationConnectors,
  upsertOrganizationConnector,
  deleteOrganizationConnector
} from 'src/store/activeOrganization/activeOrganization'
import SectionHeader from './shared/SectionHeader'
import ServiceAvatar from './shared/ServiceAvatar'
import ActionDialog from './shared/ActionDialog'
import RowActions from './shared/RowActions'
import { connectorMeta, KNOWN_CONNECTORS } from './connectors/connectorMeta'

// every known connector's credential fields in one list, each one hidden unless
// its own service is the one chosen — so picking a service reveals exactly the
// credentials that service needs, in the same dialog
const CREDENTIAL_FIELDS = KNOWN_CONNECTORS.flatMap(type =>
  (connectorMeta(type).fields ?? []).map(f => ({
    ...f,
    name: `${type}.${f.name}`,
    hidden: v => v.connectorType !== type
  }))
)

// config arrives as an object from the converter, but a raw jsonb string is
// possible too. Only the field names are shown — a connector's config holds
// secrets.
const configFields = connector => {
  const raw = connector?.config
  if (!raw) return []

  try {
    return Object.keys(typeof raw === 'string' ? JSON.parse(raw) : raw)
  } catch {
    return []
  }
}

const ConnectorsAdvancedOrganizationSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const organizationId = router.query.organizationId
  const { organizationConnectors, isBlurring } = useSelector(state => state.activeOrganization)

  const [showAll, setShowAll] = useState(false)
  const [connecting, setConnecting] = useState(null)
  const [disconnecting, setDisconnecting] = useState(null)

  useEffect(() => {
    if (organizationId && token) {
      dispatch(fetchOrganizationConnectors({ organizationId, token }))
    }
  }, [organizationId, token, dispatch])

  const { connected, available } = useMemo(() => {
    const stored = organizationConnectors ?? []

    // anything stored that we have no name for still deserves a row
    const types = [...KNOWN_CONNECTORS, ...stored.map(c => c.connectorType).filter(t => !KNOWN_CONNECTORS.includes(t))]

    const rows = types.map(type => ({
      type,
      meta: connectorMeta(type),
      connector: stored.find(c => c.connectorType === type) ?? null
    }))

    return { connected: rows.filter(r => r.connector), available: rows.filter(r => !r.connector) }
  }, [organizationConnectors])

  return (
    <>
      <SectionHeader
        title='Connectors'
        tooltip='Your own credentials for services Gendox calls on your behalf.'
        addLabel='Connect a service'
        onAdd={() => setConnecting('')}
      />

      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ filter: isBlurring ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease' }} aria-busy={isBlurring}>
          {/* what actually changes for the user when nothing is connected */}
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2.5 }}>
            {connected.length === 0
              ? 'No service connected. Anything that needs one runs on the credentials Gendox provides.'
              : `${connected.length} of ${
                  connected.length + available.length
                } services connected with your own credentials.`}
          </Typography>

          {connected.map(({ type, meta, connector }) => {
            const fields = configFields(connector)

            // the connectors endpoint answers a DTO, which exposes isActive;
            // the api keys endpoint answers the entity, where it is `active`
            const off = !connector.isActive

            return (
              <Stack
                key={type}
                direction='row'
                alignItems='center'
                spacing={2}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  border: '1px solid',
                  borderColor: off ? 'divider' : 'primary.main',
                  borderRadius: 1,
                  bgcolor: off ? 'transparent' : 'action.hover'
                }}
              >
                <ServiceAvatar meta={meta} dim={off} />

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography variant='subtitle2' sx={{ lineHeight: 1.3 }}>
                      {meta.label}
                    </Typography>
                    {off && <Chip size='small' label='switched off' variant='outlined' />}
                  </Stack>
                  <Typography variant='caption' color='text.secondary'>
                    {off
                      ? 'Stored but not in use — Gendox credentials are used instead'
                      : meta.purpose || fields.join(' · ')}
                  </Typography>
                </Box>

                <RowActions
                  onEdit={() => setConnecting(type)}
                  editDisabled={!meta.fields}
                  editLabel={meta.fields ? 'Replace credentials' : 'Gendox does not know this connector'}
                  onDelete={() => setDisconnecting({ type, meta })}
                  deleteLabel='Disconnect and fall back to the Gendox credentials'
                />
              </Stack>
            )
          })}

          {available.length > 0 && (
            <>
              <Button
                size='small'
                color='inherit'
                onClick={() => setShowAll(v => !v)}
                sx={{ px: 0.5, color: 'text.secondary' }}
                startIcon={<Icon icon={showAll ? 'mdi:chevron-down' : 'mdi:chevron-right'} />}
              >
                {available.length} more available to connect
              </Button>

              <Collapse in={showAll}>
                <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} sx={{ mt: 1.5 }}>
                  {available.map(({ type, meta }) => (
                    <Tooltip key={type} title={meta.purpose}>
                      <Chip
                        variant='outlined'
                        avatar={<ServiceAvatar meta={meta} dim size={32} />}
                        label={meta.label}
                        onClick={() => setConnecting(type)}
                        sx={{ height: 44, pl: 0.5, borderRadius: 1, '& .MuiChip-avatar': { width: 32, height: 32 } }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </Box>
      </CardContent>

      <ActionDialog
        open={!!disconnecting}
        title='Disconnect service'
        saveLabel='Disconnect'
        destructive
        fields={[]}
        description={
          disconnecting &&
          `The credentials stored for ${disconnecting.meta.label} are deleted and cannot be recovered from here. Anything that used them falls back to the credentials Gendox provides, so nothing stops working — you just stop running on your own account.`
        }
        onClose={() => setDisconnecting(null)}
        onSave={async () => {
          // unwrap, so a rejected thunk reaches the dialog instead of closing it
          await dispatch(
            deleteOrganizationConnector({ organizationId, connectorType: disconnecting.type, token })
          ).unwrap()
          toast.success('Service disconnected')
        }}
      />

      <ActionDialog
        open={connecting !== null}
        title='Connect a service'
        saveLabel='Connect'
        description='Gendox will call this service with your credentials instead of its own. Connecting a service that is already connected replaces what is stored.'
        fields={[
          {
            name: 'connectorType',
            label: 'Service',
            type: 'select',
            value: connecting || '',
            required: true,
            options: [...connected, ...available]
              .filter(r => r.meta.fields)
              .map(r => ({
                value: r.type,
                label: r.connector ? `${r.meta.label} — already connected` : r.meta.label
              }))
          },
          ...CREDENTIAL_FIELDS
        ]}
        onClose={() => setConnecting(null)}
        onSave={async v => {
          const type = v.connectorType

          const config = Object.fromEntries(
            (connectorMeta(type).fields ?? []).map(f => [f.name, String(v[`${type}.${f.name}`] ?? '').trim()])
          )

          await dispatch(
            upsertOrganizationConnector({
              organizationId,
              connectorType: type,
              payload: { organizationId, connectorType: type, isActive: true, config },
              token
            })
          ).unwrap()
          toast.success('Service connected')
        }}
      />
    </>
  )
}

export default ConnectorsAdvancedOrganizationSettings
