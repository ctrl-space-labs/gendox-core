import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, KeyRound, Pencil, Plus, TriangleAlert } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import apiKeyService from 'src/gendox-sdk/apiKeyService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'
import Empty from 'src/components/ui/Empty'
import { SkeletonRows } from 'src/components/ui/Skeleton'

const DURATIONS = [
  ['30', 'In 30 days'],
  ['90', 'In 90 days'],
  ['365', 'In 1 year'],
  ['36500', 'Never']
]

const tail = key => (key ? `••••${key.slice(-4)}` : '')
const copy = (text, message) => navigator.clipboard?.writeText(text).then(() => toast.success(message))

// Create a key, then show it with a Copy button
const CreateKeyDialog = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('365')
  const [created, setCreated] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setDuration('365')
    setCreated(null)
  }, [open])

  const create = async () => {
    if (!name.trim()) return
    setIsCreating(true)
    const key = await onCreate(name.trim(), Number(duration))
    setIsCreating(false)
    if (key) setCreated(key)
  }

  return (
    <Dialog
      busy={isCreating}
      open={open}
      onClose={onClose}
      size='s'
      title={created ? 'Your new key' : 'Create an API key'}
      footer={
        created ? (
          <button className='btn primary' onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button className='btn' onClick={onClose}>
              Cancel
            </button>
            <button aria-busy={isCreating} className='btn primary' onClick={create} disabled={!name.trim() || isCreating}>
              {isCreating ? 'Creating…' : 'Create key'}
            </button>
          </>
        )
      }
    >
      {created ? (
        <>
          <div className='alert' style={{ '--c': 'var(--warn)' }}>
            <b>
              <TriangleAlert className='lucide' />
              Copy it now
            </b>
            <span className='muted'>Paste it where it is needed, e.g. the WordPress plugin’s settings.</span>
          </div>
          <div className='code-wrap' style={{ marginTop: 14 }}>
            <pre className='code' style={{ paddingRight: 90, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {created.apiKey}
            </pre>
            <button className='btn s' onClick={() => copy(created.apiKey, 'Key copied')}>
              <Copy className='lucide' />
              Copy
            </button>
          </div>
        </>
      ) : (
        <div className='form'>
          <div className='field'>
            <label>Name</label>
            <input
              className='input'
              placeholder='e.g. WordPress — blog.acme.com'
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
            />
            <span className='help'>So you know what uses it.</span>
          </div>
          <div className='field'>
            <label>Expires</label>
            <select className='input' value={duration} onChange={e => setDuration(e.target.value)}>
              {DURATIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </Dialog>
  )
}

const RenameDialog = ({ apiKey, onClose, onRename }) => {
  const [name, setName] = useState('')

  useEffect(() => {
    if (apiKey) setName(apiKey.name || '')
  }, [apiKey])

  return (
    <Dialog
      open={Boolean(apiKey)}
      onClose={onClose}
      size='s'
      title='Rename key'
      subtitle='Only the name changes. The key stays the same, so nothing using it stops working.'
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' disabled={!name.trim()} onClick={() => onRename(apiKey, name.trim())}>
            Save
          </button>
        </>
      }
    >
      <div className='field'>
        <label>Name</label>
        <input className='input' value={name} onChange={e => setName(e.target.value)} />
      </div>
    </Dialog>
  )
}

/**
 * Keys that let apps and the WordPress plugin use the organization's agents.
 * GET/POST organizations/{o}/api-keys { name, durationInDays }, rename PUT …/{id}, revoke DELETE …/{id}.
 */
const ApiKeysPage = () => {
  const { organization, organizationId } = useActiveScope()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_EDIT_API_KEYS'] })
  const [keys, setKeys] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [revoking, setRevoking] = useState(null)

  const load = useCallback(() => {
    if (!organizationId) return
    apiKeyService
      .getApiKeysByOrganizationId(organizationId, getToken())
      .then(r => setKeys(r.data ?? []))
      .catch(error => {
        setKeys([])
        toast.error(`Couldn’t load the keys. ${getErrorMessage(error)}`)
      })
  }, [organizationId])

  useEffect(() => {
    load()
  }, [load])

  const create = async (name, durationInDays) => {
    try {
      const response = await apiKeyService.createApiKey(organizationId, { name, durationInDays }, getToken())
      load()

      return response.data
    } catch (error) {
      toast.error(`Couldn’t create the key. ${getErrorMessage(error)}`)

      return null
    }
  }

  const rename = async (apiKey, name) => {
    try {
      await apiKeyService.updateApiKey(organizationId, apiKey.id, { name }, getToken())
      setRenaming(null)
      toast.success('Key renamed')
      load()
    } catch (error) {
      toast.error(`Couldn’t rename the key. ${getErrorMessage(error)}`)
    }
  }

  const revoke = async apiKey => {
    try {
      await apiKeyService.deleteApiKey(organizationId, apiKey.id, getToken())
      toast.success('Key revoked')
      load()
    } catch (error) {
      toast.error(`Couldn’t revoke the key. ${getErrorMessage(error)}`)
    }
  }

  const sorted = (keys ?? []).slice().sort((a, b) => Number(b.active) - Number(a.active))

  return (
    <main className='content'>
      <OrgScope tab='api' />

      <div className='list-h'>
        <div>
          <h2>API keys</h2>
          <p className='muted' style={{ marginTop: 4 }}>
            Let your apps and the WordPress plugin use {organization?.name || 'the organization'}’s agents. A key has
            access to every agent in the organization.
          </p>
        </div>
        <span className='sp' />
        {canEdit && (
          <button className='btn primary' onClick={() => setCreateOpen(true)}>
            <Plus className='lucide' />
            Create key
          </button>
        )}
      </div>

      <div className='card'>
        {keys && sorted.length === 0 ? (
          <Empty
            icon={<KeyRound className='lucide' />}
            title='No API keys yet'
            text='Create a key to connect the WordPress plugin or call the API from your app.'
          />
        ) : (
          <div className='scroll'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th className='hide-sm'>Created</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys === null && <SkeletonRows columns={[null, '120px', '80px', '90px', null]} />}
                {sorted.map(apiKey => (
                  <tr key={apiKey.id} style={{ cursor: 'default', opacity: apiKey.active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 500 }}>{apiKey.name}</td>
                    <td className='mono'>{tail(apiKey.apiKey)}</td>
                    <td className='hide-sm muted sm'>{formatDate(apiKey.createdAt)}</td>
                    <td>
                      {apiKey.active ? (
                        <span className='muted sm'>{formatDate(apiKey.endDate)}</span>
                      ) : (
                        <span className='badge dot'>Revoked</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {apiKey.active && (
                        <>
                          <button
                            className='btn ghost s icon'
                            title='Copy key'
                            onClick={() => copy(apiKey.apiKey, 'Key copied')}
                          >
                            <Copy className='lucide' />
                          </button>
                          {canEdit && (
                            <>
                              <button className='btn ghost s icon' title='Rename' onClick={() => setRenaming(apiKey)}>
                                <Pencil className='lucide' />
                              </button>
                              <button className='btn ghost s' onClick={() => setRevoking(apiKey)}>
                                Revoke
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateKeyDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} />
      <RenameDialog apiKey={renaming} onClose={() => setRenaming(null)} onRename={rename} />
      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        title={`Revoke ${revoking?.name || 'this key'}?`}
        text={`Anything using ${tail(revoking?.apiKey)} stops working right away. This can’t be undone.`}
        confirmLabel='Revoke key'
        onConfirm={() => revoke(revoking)}
      />
    </main>
  )
}

ApiKeysPage.getLayout = page => (
  <AppLayout page='api' title='API keys' crumb='Organization'>
    {page}
  </AppLayout>
)

ApiKeysPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ApiKeysPage
