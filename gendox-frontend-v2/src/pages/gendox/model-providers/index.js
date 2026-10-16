import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import aiModelService from 'src/gendox-sdk/aiModelService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { KEYLESS_PROVIDERS, providerLabel } from 'src/components/agent/ModelPicker'
import { formatDate } from 'src/components/knowledge/documentUtils'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'

const tail = key => (key ? `••••${String(key).slice(-4)}` : '')

const KeyDialog = ({ provider, replacing, onClose, onSave }) => {
  const [key, setKey] = useState('')
  const [error, setError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setKey('')
    setError(false)
  }, [provider])

  const save = async () => {
    if (key.trim().length <= 10) return setError(true)
    setIsSaving(true)
    await onSave(key.trim())
    setIsSaving(false)
  }

  const name = provider ? providerLabel(provider.name) : ''

  return (
    <Dialog
      open={Boolean(provider)}
      onClose={onClose}
      size='s'
      title={`${replacing ? 'Replace' : 'Add'} your ${name} key`}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save key'}
          </button>
        </>
      }
    >
      <div className='field'>
        <label>API key</label>
        <input
          className='input mono'
          type='password'
          autoComplete='off'
          placeholder={`Paste the key from your ${name} account`}
          value={key}
          onChange={e => {
            setKey(e.target.value)
            setError(false)
          }}
          onKeyDown={e => e.key === 'Enter' && save()}
        />
        {error && <span className='err'>That doesn’t look like a key: it should be longer than 10 characters.</span>}
        <span className='help'>
          {replacing ? 'The old key stops being used as soon as this is saved. ' : ''}After saving you’ll only see its
          last 4 characters.
        </span>
      </div>
    </Dialog>
  )
}

/**
 * Bring-your-own keys per AI provider: GET organizations/{o}/ai-models/providers and
 * GET/POST/PUT/DELETE organizations/{o}/model-keys. Your keys first, then the providers on the Gendox allowance;
 * providers that take no key are left out.
 */
const ModelProvidersPage = () => {
  const { organizationId } = useActiveScope()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_EDIT_ORGANIZATION_MODEL_KEYS'] })
  const [providers, setProviders] = useState([])
  const [keys, setKeys] = useState([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // { provider, key }
  const [removing, setRemoving] = useState(null)

  const load = useCallback(() => {
    if (!organizationId) return
    const token = getToken()
    aiModelService
      .getAllAiModelProviders(organizationId, token)
      .then(r => setProviders(r.data?.content ?? r.data ?? []))
      .catch(() => setProviders([]))
    aiModelService
      .getModelKeysByOrganizationId(organizationId, token)
      .then(r => setKeys(r.data?.content ?? r.data ?? []))
      .catch(() => setKeys([]))
  }, [organizationId])

  useEffect(() => {
    load()
  }, [load])

  const keyOf = provider => keys.find(k => k.aiModelProvider?.id === provider.id)
  const usable = providers.filter(p => !KEYLESS_PROVIDERS.includes(p.name))

  const { mine, rest } = useMemo(() => {
    const value = query.trim().toLowerCase()
    const matching = usable.filter(p => providerLabel(p.name).toLowerCase().includes(value))

    return { mine: matching.filter(keyOf), rest: matching.filter(p => !keyOf(p)) }
  }, [usable, keys, query])

  const withKey = usable.filter(keyOf).length

  const save = async value => {
    const { provider, key } = editing
    const payload = { aiModelProvider: { id: provider.id, name: provider.name }, key: value }
    try {
      if (key) await aiModelService.updateAiModelKey(organizationId, key.id, getToken(), payload)
      else await aiModelService.createAiModelKey(organizationId, getToken(), payload)
      toast.success(`${providerLabel(provider.name)} key saved`)
      setEditing(null)
      load()
    } catch (error) {
      toast.error(`Couldn’t save the key. ${getErrorMessage(error)}`)
    }
  }

  const remove = async ({ provider, key }) => {
    try {
      await aiModelService.deleteAiModelKey(organizationId, key.id, getToken())
      toast.success(`${providerLabel(provider.name)} key removed`)
      load()
    } catch (error) {
      toast.error(`Couldn’t remove the key. ${getErrorMessage(error)}`)
    }
  }

  return (
    <main className='content'>
      <OrgScope tab='providers' />

      <div className='list-h'>
        <div>
          <h2>Model providers</h2>
          <p className='muted' style={{ marginTop: 4, maxWidth: 720 }}>
            {withKey
              ? `Running on your own key for ${withKey} of ${usable.length} providers; usage is billed to your account with them. The rest use the allowance Gendox provides.`
              : `All ${usable.length} providers run on the allowance Gendox provides. Add your own key to use your own quota, and the models that need one.`}
          </p>
        </div>
        <span className='sp' />
        <label className='search' style={{ minWidth: 240 }}>
          <Search className='lucide' />
          <input
            placeholder='Find a provider…'
            aria-label='Find a provider'
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
      </div>

      {mine.length > 0 && (
        <div className='card'>
          <div className='card-h'>
            <h3>Your keys</h3>
            <span className='faint sm'>{mine.length}</span>
          </div>
          {mine.map(provider => {
            const key = keyOf(provider)

            return (
              <div className='item' key={provider.id}>
                <Avatar name={providerLabel(provider.name)} seed={provider.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontWeight: 550 }}>{providerLabel(provider.name)}</b>
                  <div className='faint sm'>
                    <span className='mono'>{tail(key.key)}</span>
                    {key.createdAt ? ` · added ${formatDate(key.createdAt)}` : ''}
                  </div>
                </div>
                {canEdit && (
                  <>
                    <button className='btn s' onClick={() => setEditing({ provider, key })}>
                      Replace
                    </button>
                    <button className='btn ghost s' onClick={() => setRemoving({ provider, key })}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className='card'>
        <div className='card-h'>
          <h3>On the Gendox allowance</h3>
          <span className='faint sm'>{rest.length}</span>
        </div>
        {rest.length > 0 ? (
          <div className='grid' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, padding: 16 }}>
            {rest.map(provider => (
              <div
                key={provider.id}
                className='row'
                style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <Avatar name={providerLabel(provider.name)} seed={provider.name} />
                <b style={{ flex: 1, fontWeight: 500 }} className='trunc'>
                  {providerLabel(provider.name)}
                </b>
                {canEdit && (
                  <button className='btn s' onClick={() => setEditing({ provider, key: null })}>
                    <Plus className='lucide' />
                    Add key
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='card-b faint sm'>
            {query.trim() ? `No provider matches “${query.trim()}”.` : 'Every provider runs on your own key.'}
          </div>
        )}
      </div>

      <KeyDialog
        provider={editing?.provider}
        replacing={Boolean(editing?.key)}
        onClose={() => setEditing(null)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove your ${removing ? providerLabel(removing.provider.name) : ''} key?`}
        text='The provider goes back to the allowance Gendox provides. Agents using one of its models that needs your key stop answering until you add a key again or pick another model.'
        confirmLabel='Remove key'
        onConfirm={() => remove(removing)}
      />
    </main>
  )
}

ModelProvidersPage.getLayout = page => (
  <AppLayout page='organization' title='Model providers' crumb='Organization'>
    {page}
  </AppLayout>
)

ModelProvidersPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ModelProvidersPage
