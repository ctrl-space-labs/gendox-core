import { Fragment, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CircleAlert, CircleCheck, KeyRound, Pencil, Plus, Trash2, Zap } from 'lucide-react'
import aiModelService from 'src/gendox-sdk/aiModelService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import Avatar from 'src/components/ui/Avatar'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'

// what each model type is used for, and the API formats it can be called with (CustomAiModelService)
const TYPES = {
  COMPLETION_MODEL: {
    label: 'Chat',
    apis: { OPEN_AI_API: 'OpenAI Chat Completions', OPEN_AI_RESPONSES_API: 'OpenAI Responses', ANTHROPIC_AI_API: 'Anthropic Messages' }
  },
  SEMANTIC_SEARCH_MODEL: { label: 'Embedding', apis: { OPEN_AI_API: 'OpenAI Embeddings' } },
  RERANK_MODEL: { label: 'Rerank', apis: { COHERE_API: 'Cohere Rerank' } }
}

const ServerDialog = ({ open, server, onClose, onSave }) => {
  const [fields, setFields] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setFields({ name: server?.name ?? '', baseUrl: server?.baseUrl ?? '' })
  }, [open, server])

  const set = (field, value) => setFields(current => ({ ...current, [field]: value }))
  const valid = fields.name?.trim() && /^https?:\/\//i.test(fields.baseUrl?.trim() ?? '')

  const save = async () => {
    if (!valid) return
    setBusy(true)
    await onSave({ id: server?.id, name: fields.name.trim(), baseUrl: fields.baseUrl.trim() })
    setBusy(false)
  }

  return (
    <Dialog
      busy={busy}
      open={open}
      onClose={onClose}
      size='s'
      title={server ? `Edit ${server.name}` : 'Add the server your models run on'}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button aria-busy={busy} className='btn primary' onClick={save} disabled={busy || !valid}>
            {busy ? 'Saving…' : 'Save server'}
          </button>
        </>
      }
    >
      <div className='form'>
        <div className='field'>
          <label>Name</label>
          <input
            className='input'
            placeholder='Our vLLM server'
            value={fields.name ?? ''}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div className='field'>
          <label>Endpoint</label>
          <input
            className='input mono'
            placeholder='https://llm.example.com/v1'
            value={fields.baseUrl ?? ''}
            onChange={e => set('baseUrl', e.target.value)}
          />
          <span className='help'>
            The base URL, up to and including the version. Gendox adds the path of each model’s API format.
            {server ? ' A new endpoint applies to all its models.' : ''}
          </span>
        </div>
      </div>
    </Dialog>
  )
}

const ModelDialog = ({ open, server, model, onClose, onSave, onTest }) => {
  const [fields, setFields] = useState({})
  const [busy, setBusy] = useState(null) // 'saving' | 'testing'
  const [tested, setTested] = useState(null) // { ok, message, millis } of the fields as they are

  useEffect(() => {
    if (!open) return
    setFields({
      type: model?.aiModelType?.name ?? 'COMPLETION_MODEL',
      apiType: model?.apiType?.name ?? '',
      model: model?.model ?? '',
      name: model?.name ?? '',
      supportsReasoning: model?.supportsReasoning ?? false,
      isActive: model?.isActive ?? true
    })
  }, [open, model])

  useEffect(() => setTested(null), [fields])

  const set = (field, value) => setFields(current => ({ ...current, [field]: value }))
  const apis = TYPES[fields.type]?.apis ?? {}
  const apiType = apis[fields.apiType] ? fields.apiType : Object.keys(apis)[0]
  const valid = Boolean(fields.model?.trim())

  const run = async (kind, action) => {
    if (!valid) return
    setBusy(kind)
    await action({
      id: model?.id,
      name: fields.name.trim() || fields.model.trim(),
      model: fields.model.trim(),
      aiModelProvider: { id: server.id },
      aiModelType: { name: fields.type },
      apiType: { name: apiType },
      supportsReasoning: fields.supportsReasoning,
      isActive: fields.isActive
    })
    setBusy(null)
  }

  return (
    <Dialog
      busy={Boolean(busy)}
      open={open}
      onClose={onClose}
      size='s'
      title={model ? `Edit ${model.name}` : `Add a model on ${server?.name ?? ''}`}
      footer={
        <>
          <button
            aria-busy={busy === 'testing'}
            className='btn ghost'
            style={{ marginRight: 'auto' }}
            onClick={() => run('testing', async body => setTested(await onTest(body)))}
            disabled={Boolean(busy) || !valid}
          >
            <Zap className='lucide' />
            {busy === 'testing' ? 'Testing…' : 'Test'}
          </button>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button
            aria-busy={busy === 'saving'}
            className='btn primary'
            onClick={() => run('saving', onSave)}
            disabled={Boolean(busy) || !valid}
          >
            {busy === 'saving' ? 'Saving…' : 'Save model'}
          </button>
        </>
      }
    >
      <div className='form'>
        <div className='form-grid'>
          <div className='field'>
            <label>Used for</label>
            <select
              className='input'
              value={fields.type}
              disabled={Boolean(model)}
              onChange={e => setFields(current => ({ ...current, type: e.target.value, apiType: '' }))}
            >
              {Object.entries(TYPES).map(([type, { label }]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className='field'>
            <label>API format</label>
            <select className='input' value={apiType} onChange={e => set('apiType', e.target.value)}>
              {Object.entries(apis).map(([api, label]) => (
                <option key={api} value={api}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='field'>
          <label>Model id</label>
          <input
            className='input mono'
            placeholder='meta-llama/Llama-3.3-70B-Instruct'
            value={fields.model ?? ''}
            onChange={e => set('model', e.target.value)}
          />
          <span className='help'>Exactly as the server expects it.</span>
        </div>
        <div className='field'>
          <label>Name</label>
          <input
            className='input'
            placeholder={fields.model || 'The name members choose it by'}
            value={fields.name ?? ''}
            onChange={e => set('name', e.target.value)}
          />
          <span className='help'>Unique in the organization. Leave empty to use the model id.</span>
        </div>
        {fields.type === 'COMPLETION_MODEL' && (
          <label className='check'>
            <input
              type='checkbox'
              checked={Boolean(fields.supportsReasoning)}
              onChange={e => set('supportsReasoning', e.target.checked)}
            />
            <div>
              <b>Reasons before answering</b>
              <span>Sends the agent’s reasoning effort with each request.</span>
            </div>
          </label>
        )}
        {model && (
          <label className='check'>
            <input type='checkbox' checked={Boolean(fields.isActive)} onChange={e => set('isActive', e.target.checked)} />
            <div>
              <b>Active</b>
              <span>An inactive model can’t be picked; agents that use it keep it until changed.</span>
            </div>
          </label>
        )}
        {tested && (
          <div role='status' className='row sm' style={{ gap: 6, color: tested.ok ? 'var(--ok)' : 'var(--err)' }}>
            {tested.ok ? <CircleCheck className='lucide' /> : <CircleAlert className='lucide' />}
            <span style={{ overflowWrap: 'anywhere' }}>
              {tested.ok ? 'Works. ' : 'Didn’t work. '}
              {tested.message}
              {tested.millis != null && <span className='faint'> · {tested.millis} ms</span>}
            </span>
          </div>
        )}
      </div>
    </Dialog>
  )
}

/**
 * Custom and local models, grouped by the server they run on. A server is a provider of the organization, with its
 * own endpoint and key (the organization's model key for it, edited in the page's key dialog through onEditKey):
 * POST/PUT/DELETE organizations/{o}/ai-models/providers. Its models: GET/POST/PUT/DELETE organizations/{o}/ai-models.
 */
const CustomModels = ({ organizationId, providers: servers, models, keyOf, canEdit, onEditKey, onChange }) => {
  const [editingServer, setEditingServer] = useState(null) // { server } — server null when adding
  const [editingModel, setEditingModel] = useState(null) // { server, model } — model null when adding
  const [removing, setRemoving] = useState(null) // { server } or { model }

  const attempt = async (action, done, failed) => {
    try {
      await action()
      toast.success(done)
      onChange()

      return true
    } catch (error) {
      toast.error(`${failed} ${getErrorMessage(error)}`)

      return false
    }
  }

  const saveServer = async body =>
    (await attempt(
      () => aiModelService.saveOrganizationAiModelProvider(organizationId, getToken(), body),
      `${body.name} saved`,
      'Couldn’t save the server.'
    )) && setEditingServer(null)

  const saveModel = async body =>
    (await attempt(
      () => aiModelService.saveOrganizationAiModel(organizationId, getToken(), body),
      `${body.name} saved`,
      'Couldn’t save the model.'
    )) && setEditingModel(null)

  // never throws: a refused request (e.g. an endpoint that isn't allowed) is a result too
  const test = async body => {
    try {
      return (await aiModelService.testOrganizationAiModel(organizationId, getToken(), body)).data
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) }
    }
  }

  const remove = ({ server, model }) =>
    server
      ? attempt(
          () => aiModelService.deleteOrganizationAiModelProvider(organizationId, server.id, getToken()),
          `${server.name} deleted`,
          'Couldn’t delete it.'
        )
      : attempt(
          () => aiModelService.deleteOrganizationAiModel(organizationId, model.id, getToken()),
          `${model.name} deleted`,
          'Couldn’t delete it.'
        )

  return (
    <div className='card'>
      <div className='card-h'>
        <h3>Custom and local models</h3>
        <span className='faint sm'>{models.length || ''}</span>
        <span className='sp' />
        {canEdit && (
          <button className='btn s' onClick={() => setEditingServer({ server: null })}>
            <Plus className='lucide' />
            Add server
          </button>
        )}
      </div>
      {servers.length === 0 && (
        <div className='card-b faint sm'>
          Add a custom or local model: first the server it runs on, then the model. Any server that speaks the OpenAI,
          Anthropic or Cohere API works: vLLM, Ollama, LiteLLM, OpenRouter or your own gateway. Every project in the
          organization can pick its models.
        </div>
      )}
      {servers.map(server => {
        const key = keyOf(server)

        // a fragment, not a wrapper: the rows stay siblings, so only the card's last row loses its border
        return (
          <Fragment key={server.id}>
            <div className='item'>
              <Avatar name={server.name} seed={server.id} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontWeight: 550 }}>{server.name}</b>
                <div className='faint sm trunc'>
                  <span className='mono'>{server.baseUrl}</span>
                  {key ? (
                    <>
                      {' · key '}
                      <span className='mono'>••••{String(key.key).slice(-4)}</span>
                    </>
                  ) : (
                    ' · no key'
                  )}
                </div>
              </div>
              {canEdit && (
                <>
                  <button className='btn ghost s' onClick={() => onEditKey(server)}>
                    <KeyRound className='lucide' />
                    {key ? 'Replace key' : 'Add key'}
                  </button>
                  <button className='btn s' onClick={() => setEditingModel({ server, model: null })}>
                    <Plus className='lucide' />
                    Add model
                  </button>
                  <button className='btn ghost s' aria-label={`Edit ${server.name}`} onClick={() => setEditingServer({ server })}>
                    <Pencil className='lucide' />
                  </button>
                  <button className='btn ghost s' aria-label={`Delete ${server.name}`} onClick={() => setRemoving({ server })}>
                    <Trash2 className='lucide' />
                  </button>
                </>
              )}
            </div>
            {models
              .filter(m => m.aiModelProvider?.id === server.id)
              .map(model => (
                <div className='item' key={model.id} style={{ paddingLeft: 56 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className='mono trunc'>{model.name}</span>
                    <div className='faint sm trunc'>
                      {TYPES[model.aiModelType?.name]?.label} ·{' '}
                      {TYPES[model.aiModelType?.name]?.apis[model.apiType?.name] ?? model.apiType?.name}
                      {model.name !== model.model && (
                        <>
                          {' · '}
                          <span className='mono'>{model.model}</span>
                        </>
                      )}
                      {!model.isActive && ' · Inactive'}
                    </div>
                  </div>
                  {canEdit && (
                    <>
                      <button
                        className='btn ghost s'
                        aria-label={`Edit ${model.name}`}
                        onClick={() => setEditingModel({ server, model })}
                      >
                        <Pencil className='lucide' />
                      </button>
                      <button className='btn ghost s' aria-label={`Delete ${model.name}`} onClick={() => setRemoving({ model })}>
                        <Trash2 className='lucide' />
                      </button>
                    </>
                  )}
                </div>
              ))}
          </Fragment>
        )
      })}

      <ServerDialog
        open={Boolean(editingServer)}
        server={editingServer?.server}
        onClose={() => setEditingServer(null)}
        onSave={saveServer}
      />
      <ModelDialog
        open={Boolean(editingModel)}
        server={editingModel?.server}
        model={editingModel?.model}
        onClose={() => setEditingModel(null)}
        onSave={saveModel}
        onTest={test}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Delete ${removing?.server?.name ?? removing?.model?.name ?? ''}?`}
        text={
          removing?.server
            ? 'Its key is deleted with it. A server that still has models can’t be deleted; delete its models first.'
            : 'A model that an agent, a task or a search index still uses can’t be deleted; deactivate it instead.'
        }
        confirmLabel='Delete'
        onConfirm={() => remove(removing)}
      />
    </div>
  )
}

export default CustomModels
