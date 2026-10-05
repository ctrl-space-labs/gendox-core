import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { CardContent, Box, Stack, Typography, IconButton, Tooltip, Button, Chip, Collapse } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { localStorageConstants } from 'src/utils/generalConstants'
import apiKeyService from 'src/gendox-sdk/apiKeyService'
import { fetchApiKeys } from 'src/store/activeOrganization/activeOrganization'
import SectionHeader from './shared/SectionHeader'
import ServiceAvatar from './shared/ServiceAvatar'
import ActionDialog from './shared/ActionDialog'
import RowActions from './shared/RowActions'
import useCopy from './shared/useCopy'
import { maskKey } from './organization-websites/websiteMeta'

const KEY_META = { label: 'Key', icon: 'mdi:key-variant', color: 'primary.main' }

const ApiKeysAdvancedOrganizationSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const organizationId = router.query.organizationId
  const { apiKeys, organizationWebSites, isBlurring } = useSelector(state => state.activeOrganization)

  const [openGroups, setOpenGroups] = useState(null)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [revealed, setRevealed] = useState({})
  const [deleting, setDeleting] = useState(null)
  const { copied, copy } = useCopy()

  const refresh = () => dispatch(fetchApiKeys({ organizationId, token }))

  // a key is either a website's credential or a key someone calls the API with.
  // The same key can sit on several websites, so what matters is how many hold
  // it, not which one happens to be found first.
  const { standalone, bound } = useMemo(() => {
    const free = []
    const taken = []

    for (const key of apiKeys ?? []) {
      const sites = (organizationWebSites ?? []).filter(w => w.apiKeyId === key.id)
      ;(sites.length ? taken : free).push({ key, sites })
    }

    return { standalone: free, bound: taken }
  }, [apiKeys, organizationWebSites])

  const groups = [
    { id: 'direct', label: 'for direct API access', rows: standalone },
    { id: 'issued', label: 'used by a website', rows: bound }
  ].filter(g => g.rows.length)

  // until the reader chooses, the first group is open; after that their choice stands
  const defaultOpen = () => new Set(groups.length ? [groups[0].id] : [])
  const open = openGroups ?? defaultOpen()

  const toggleGroup = id =>
    setOpenGroups(current => {
      const next = new Set(current ?? defaultOpen())
      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })

  const summary = () => {
    if (!apiKeys?.length) {
      return 'No keys yet. One is created for you when a website connects its plugin, or here for direct API access.'
    }

    return `${apiKeys.length} keys — ${groups.map(g => `${g.rows.length} ${g.label}`).join(', ')}.`
  }

  const copyKey = async key => {
    // a refusal reveals it instead, so there is always a way to get the key
    if (!(await copy(key.id, key.apiKey))) {
      setRevealed(r => ({ ...r, [key.id]: true }))
    }
  }

  // the server serialises the flag as `active`, because the getter is getActive()
  const keyRow = ({ key, sites }) => {
    const revoked = key.active === false

    return (
      <Stack
        key={key.id}
        direction='row'
        alignItems='center'
        spacing={2}
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 1,
          border: '1px solid',
          bgcolor: 'action.hover',
          borderColor: revoked ? 'divider' : 'primary.main',
          opacity: revoked ? 0.6 : 1
        }}
      >
        <ServiceAvatar meta={KEY_META} dim={revoked} />

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction='row' alignItems='center' spacing={1} sx={{ minWidth: 0 }}>
            <Typography variant='subtitle2' sx={{ lineHeight: 1.35, wordBreak: 'break-word' }}>
              {key.name || 'Unnamed key'}
            </Typography>
            {revoked && (
              <Tooltip title='Gendox refuses this key. Anything still sending it is already failing.'>
                <Chip size='small' variant='outlined' label='Revoked' />
              </Tooltip>
            )}
          </Stack>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'block', fontFamily: 'monospace', letterSpacing: '.04em', wordBreak: 'break-all' }}
          >
            {revealed[key.id] ? key.apiKey : maskKey(key.apiKey)}
          </Typography>
        </Box>

        <RowActions
          onEdit={() => setEditing(key)}
          editLabel='Rename'
          onDelete={() => setDeleting({ key, sites })}
          deleteLabel='Revoke key'
        >
          <Tooltip title={copied === key.id ? 'Copied' : 'Copy key'}>
            <IconButton
              size='small'
              onClick={() => copyKey(key)}
              sx={{
                color: copied === key.id ? 'primary.main' : 'text.secondary',
                '&:hover': { color: 'primary.main', bgcolor: 'action.hover' }
              }}
            >
              <Icon icon={copied === key.id ? 'mdi:check' : 'mdi:content-copy'} style={{ fontSize: '1.15rem' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={revealed[key.id] ? 'Hide' : 'Reveal'}>
            <IconButton
              size='small'
              onClick={() => setRevealed(r => ({ ...r, [key.id]: !r[key.id] }))}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}
            >
              <Icon
                icon={revealed[key.id] ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                style={{ fontSize: '1.15rem' }}
              />
            </IconButton>
          </Tooltip>
        </RowActions>
      </Stack>
    )
  }

  return (
    <>
      <SectionHeader
        title='API Keys'
        tooltip='Keys that let something outside Gendox call it on behalf of this organization.'
        addLabel='Create a key'
        onAdd={() => setAdding(true)}
      />

      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ filter: isBlurring ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease' }} aria-busy={isBlurring}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
            {summary()}
          </Typography>

          {groups.map(g => (
            <Box key={g.id} sx={{ mb: 0.5 }}>
              <Button
                size='small'
                color='inherit'
                onClick={() => toggleGroup(g.id)}
                sx={{ px: 0.5, color: 'text.secondary' }}
                startIcon={<Icon icon={open.has(g.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'} />}
              >
                {g.rows.length} {g.label}
              </Button>

              <Collapse in={open.has(g.id)} unmountOnExit>
                <Box sx={{ mt: 1.5 }}>{g.rows.map(keyRow)}</Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      </CardContent>

      <ActionDialog
        open={!!deleting}
        title='Revoke key'
        saveLabel='Revoke'
        destructive
        fields={[]}
        description={
          deleting &&
          (deleting.sites.length
            ? `${deleting.key.name || 'This key'} is still used by ${
                deleting.sites.length === 1 ? 'a website' : `${deleting.sites.length} websites`
              }: ${deleting.sites
                .map(s => s.name || s.url)
                .join(', ')}. Gendox will refuse to revoke it until they stop using it.`
            : `Anything still calling Gendox with ${
                deleting.key.name || 'this key'
              } stops working the moment it is revoked. The key stays on this list, marked as revoked, because everything it ever uploaded is recorded as its work. Issue a new one and move whatever uses it across first.`)
        }
        onClose={() => setDeleting(null)}
        onSave={async () => {
          await apiKeyService.deleteApiKey(organizationId, deleting.key.id, token)
          await refresh()
          toast.success('Key revoked')
        }}
      />

      <ActionDialog
        open={adding}
        title='Create a key'
        saveLabel='Create'
        description='The key is generated here and shown in the list once it exists. Anything holding it can call Gendox as this organization, so treat it like a password.'
        fields={[
          { name: 'name', label: 'Name', required: true, tooltip: 'What will be using it' },
          {
            name: 'durationInDays',
            label: 'Valid for (days)',
            type: 'number',
            value: '365',
            required: true,
            tooltip: 'After this the key stops working and has to be replaced.'
          }
        ]}
        onClose={() => setAdding(false)}
        onSave={async v => {
          // the organization and the active flag come from the server, not from here
          await apiKeyService.createApiKey(
            organizationId,
            { name: v.name.trim(), durationInDays: Number(v.durationInDays) },
            token
          )
          await refresh()
          toast.success('Key created')
        }}
      />

      <ActionDialog
        open={!!editing}
        title='Rename key'
        description='Only the name changes. The key itself stays the same, so nothing using it stops working.'
        fields={[{ name: 'name', label: 'Name', value: editing?.name, required: true }]}
        onClose={() => setEditing(null)}
        onSave={async values => {
          await apiKeyService.updateApiKey(organizationId, editing.id, { name: values.name.trim() }, token)
          await refresh()
          toast.success('Key renamed')
        }}
      />
    </>
  )
}

export default ApiKeysAdvancedOrganizationSettings
