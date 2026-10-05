import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { CardContent, Box, Stack, Typography, Chip, Button, Collapse } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { localStorageConstants } from 'src/utils/generalConstants'
import aiModelService from 'src/gendox-sdk/aiModelService'
import { fetchOrganizationAiModelKeys } from 'src/store/activeOrganization/activeOrganization'
import SectionHeader from './shared/SectionHeader'
import ServiceAvatar from './shared/ServiceAvatar'
import ActionDialog from './shared/ActionDialog'
import RowActions from './shared/RowActions'
import { providerMeta, maskProviderKey } from './ai-model-provider-key/providerMeta'

const AiModelProviderKeyAdvancedOrganizationSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const organizationId = router.query.organizationId
  const { aiModelProviders, aiModelKeys, isBlurring } = useSelector(state => state.activeOrganization)

  const [showAll, setShowAll] = useState(false)
  const [adding, setAdding] = useState(null)
  const [replacing, setReplacing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const refresh = () => dispatch(fetchOrganizationAiModelKeys({ organizationId, token }))

  const providers = useMemo(
    () => (Array.isArray(aiModelProviders) ? aiModelProviders : aiModelProviders?.content ?? []),
    [aiModelProviders]
  )

  // A provider that takes no key — a self hosted Ollama, a test double — is not
  // listed at all: there is nothing to add and nothing to remove. One that has a
  // key stored against it anyway still appears, so it can be cleared.
  const { mine, rest } = useMemo(() => {
    const withKey = []
    const without = []

    for (const provider of providers) {
      const key = (aiModelKeys ?? []).find(k => k.aiModelProvider?.id === provider.id)
      const meta = providerMeta(provider.name)

      if (key) withKey.push({ provider, key, meta })
      else if (!meta.noKey) without.push({ provider, key, meta })
    }

    return { mine: withKey, rest: without }
  }, [providers, aiModelKeys])

  const addable = rest
  const listed = mine.length + rest.length

  return (
    <>
      <SectionHeader
        title='AI Model Provider Keys'
        tooltip='Add your own provider key to run on your quota instead of the allowance Gendox provides. Providers that take no key — a self hosted Ollama, a test double — are not listed.'
        addLabel='Add your key'
        onAdd={() => setAdding('')}
      />

      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ filter: isBlurring ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease' }} aria-busy={isBlurring}>
          {/* the one sentence that answers "who pays for what" */}
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2.5 }}>
            {mine.length === 0
              ? `All ${listed} providers run on the allowance Gendox provides. Add your own key to use your own quota.`
              : `Running on your own key for ${mine.length} of ${listed} providers. The rest use the allowance Gendox provides.`}
          </Typography>

          {mine.map(({ provider, key, meta }) => (
            <Stack
              key={provider.id}
              direction='row'
              alignItems='center'
              spacing={2}
              sx={{
                p: 1.5,
                mb: 1.5,
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                bgcolor: 'action.hover'
              }}
            >
              <ServiceAvatar meta={meta} />

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant='subtitle2' sx={{ lineHeight: 1.3 }}>
                  {meta.label}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace', letterSpacing: '.04em' }}>
                  {maskProviderKey(key.key)}
                </Typography>
              </Box>

              <RowActions
                onEdit={() => setReplacing({ provider, key, meta })}
                editLabel='Replace key'
                onDelete={() => setDeleting({ provider, key, meta })}
                deleteLabel='Remove key and fall back to the Gendox allowance'
              />
            </Stack>
          ))}

          {rest.length > 0 && (
            <>
              <Button
                size='small'
                color='inherit'
                onClick={() => setShowAll(v => !v)}
                sx={{ px: 0.5, color: 'text.secondary' }}
                startIcon={<Icon icon={showAll ? 'mdi:chevron-down' : 'mdi:chevron-right'} />}
              >
                {rest.length} more on the Gendox allowance
              </Button>

              <Collapse in={showAll}>
                <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} sx={{ mt: 1.5 }}>
                  {rest.map(({ provider, meta }) => (
                    <Chip
                      key={provider.id}
                      variant='outlined'
                      avatar={<ServiceAvatar meta={meta} dim size={32} />}
                      label={meta.label}
                      onClick={() => setAdding(provider.id)}
                      sx={{ height: 44, pl: 0.5, borderRadius: 1, '& .MuiChip-avatar': { width: 32, height: 32 } }}
                    />
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </Box>
      </CardContent>

      <ActionDialog
        open={!!replacing}
        title='Replace key'
        saveLabel='Replace'
        description={
          replacing &&
          `The key stored for ${replacing.meta.label} is overwritten. Calls made with the old one stop the moment this is saved.`
        }
        fields={[{ name: 'key', label: 'New key', type: 'password', required: true }]}
        onClose={() => setReplacing(null)}
        onSave={async v => {
          await aiModelService.updateAiModelKey(organizationId, replacing.key.id, token, {
            aiModelProvider: { id: replacing.provider.id, name: replacing.provider.name },
            key: v.key.trim()
          })
          await refresh()
          toast.success('Key replaced')
        }}
      />

      <ActionDialog
        open={!!deleting}
        title='Remove key'
        saveLabel='Remove'
        destructive
        fields={[]}
        description={
          deleting &&
          `${deleting.meta.label} goes back to running on the allowance Gendox provides. Nothing stops working, but the calls are billed to Gendox again instead of to you, and the key itself is not kept.`
        }
        onClose={() => setDeleting(null)}
        onSave={async () => {
          await aiModelService.deleteAiModelKey(organizationId, deleting.key.id, token)
          await refresh()
          toast.success('Key removed')
        }}
      />

      <ActionDialog
        open={adding !== null}
        title='Add your key'
        saveLabel='Add'
        description={
          addable.length
            ? 'Calls to this provider will be billed to you instead of counting against the allowance Gendox provides.'
            : 'Every provider that takes a key already has one.'
        }
        fields={[
          {
            name: 'providerId',
            label: 'Provider',
            type: 'select',
            value: adding || '',
            required: true,
            options: addable.map(({ provider, meta }) => ({ value: provider.id, label: meta.label }))
          },
          {
            name: 'key',
            label: 'Key',
            type: 'password',
            required: true,
            tooltip: 'Stored for this organization. It is only ever shown here by its last characters.'
          }
        ]}
        onClose={() => setAdding(null)}
        onSave={async v => {
          const provider = providers.find(p => p.id === v.providerId)

          await aiModelService.createAiModelKey(organizationId, token, {
            // resolved by NAME on the backend, so the id alone is not enough
            aiModelProvider: { id: provider.id, name: provider.name },
            key: v.key.trim()
          })
          await refresh()
          toast.success('Key added')
        }}
      />
    </>
  )
}

export default AiModelProviderKeyAdvancedOrganizationSettings