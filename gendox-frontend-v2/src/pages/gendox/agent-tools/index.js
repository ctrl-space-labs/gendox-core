import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { AppWindow, Hourglass, TriangleAlert, Pencil, Plus, Send, Server, Trash2, Wrench, X } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import { fetchExampleTools } from 'src/store/activeProjectAgent/activeProjectAgent'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent, { getToken } from 'src/components/agent/useAgent'
import AgentScope from 'src/components/agent/AgentScope'
import AgentPageSkeleton from 'src/components/agent/AgentPageSkeleton'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'
import Empty from 'src/components/ui/Empty'

// tools with a handler inside Gendox (the AiToolHandler implementations); any other tool runs on the client side
const GENDOX_TOOLS = [
  'advanced_search',
  'create_sub_agent',
  'diff_documents',
  'extract_relevant_sections',
  'read_document',
  'regex_search',
  'summarize'
]

const TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object']

// a tool's jsonSchema is a JSON string: { name, description, parameters }, sometimes wrapped as { type, function: {…} }
const parseSchema = text => {
  try {
    const value = JSON.parse(text)

    return value?.function ?? value ?? {}
  } catch {
    return {}
  }
}

const toForm = schema => {
  const properties = schema.parameters?.properties ?? {}
  const required = schema.parameters?.required ?? []

  return {
    name: schema.name ?? '',
    description: schema.description ?? '',
    params: Object.entries(properties).map(([name, p]) => ({
      name,
      type: p.type ?? 'string',
      description: p.description ?? '',
      required: required.includes(name)
    }))
  }
}

// keeps what the form doesn't show (enum, items…) from the schema it started from
const fromForm = (form, base = {}) => {
  const baseProperties = base.parameters?.properties ?? {}
  const params = form.params.filter(p => p.name.trim())

  return {
    ...base,
    name: form.name.trim(),
    description: form.description.trim(),
    parameters: {
      ...(base.parameters ?? {}),
      type: 'object',
      properties: Object.fromEntries(
        params.map(p => [
          p.name.trim(),
          { ...(baseProperties[p.name.trim()] ?? {}), type: p.type, description: p.description }
        ])
      ),
      required: params.filter(p => p.required).map(p => p.name.trim())
    }
  }
}

const runsInGendox = name => GENDOX_TOOLS.includes(name)

// what "your side" writes for a tool the agent waits for (execution CLIENT): the widget hands the call to a handler
// registered on the page; an app reads the waiting calls and posts each result
const WAIT_WIDGET_EXAMPLE = `<script>
  window.addEventListener('load', () => {
    window.gendox.tools.registerTool('lookup_order', async ({ order_number }) => {
      const r = await fetch('/api/orders/' + order_number)
      return r.json() // sent to the agent, which then answers
    })
  })
</script>`

const WAIT_API_EXAMPLE = `POST messages/completions?projectId=…
{ "value": "Where is order 1042?", "clientToolResults": true }
→ "status": "WAITING_FOR_TOOLS", "threadId": "…",
  "messages": [{ "toolCalls": [{ "id": "call_1",
    "function": { "name": "lookup_order", … } }] }]

POST messages/completions?projectId=…
{ "threadId": "…", "role": "tool",
  "toolCallId": "call_1", "value": "{ \"status\": \"shipped\" }" }
→ the answer`

// a tool that runs on the client side (your website or app): the agent carries on (ACTION, async), or waits for
// the result (CLIENT, sync)
const EXECUTIONS = [
  ['ACTION', Send, 'Runs on Client side · async', 'The agent carries on without the result. E.g. open a page, fill a form.'],
  ['CLIENT', Hourglass, 'Runs on Client side · sync', 'The agent waits for the result. E.g. look up an order.']
]

const RunsBadge = ({ name, execution }) => {
  if (runsInGendox(name)) {
    return (
      <span className='badge accent'>
        <Server className='lucide' />
        Runs in Gendox
      </span>
    )
  }
  const [, Icon, label] = EXECUTIONS.find(([value]) => value === execution) ?? EXECUTIONS[0]

  return (
    <span className='badge'>
      <Icon className='lucide' />
      {label}
    </span>
  )
}

// Add or edit a tool, as a form or as its JSON schema
const ToolDialog = ({ open, tool, examples, examplesLoading, onClose, onSave }) => {
  const [mode, setMode] = useState('form')
  const [base, setBase] = useState({})
  const [form, setForm] = useState({ name: '', description: '', params: [] })
  const [execution, setExecution] = useState('ACTION')
  const [json, setJson] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const schema = tool ? parseSchema(tool.jsonSchema) : {}
    setBase(schema)
    setForm(tool ? toForm(schema) : { name: '', description: '', params: [{ name: '', type: 'string', description: '', required: true }] })
    setExecution(tool?.execution || 'ACTION')
    setMode('form')
    setJsonError('')
  }, [open, tool])

  const switchMode = next => {
    if (next === mode) return
    if (next === 'json') {
      setJson(JSON.stringify(fromForm(form, base), null, 2))
      setJsonError('')
    } else {
      try {
        const schema = parseSchema(json)
        if (!json.trim() || !Object.keys(schema).length) throw new Error()
        setBase(schema)
        setForm(toForm(schema))
      } catch {
        return setJsonError('Fix the JSON before going back to the form.')
      }
    }
    setMode(next)
  }

  const applyExample = name => {
    const example = examples.find(e => e.name === name)
    if (!example) return
    const schema = parseSchema(example.description)
    setBase(schema)
    setForm(toForm(schema))
    setJson(JSON.stringify(schema, null, 2))
  }

  const setParam = (index, changes) =>
    setForm(f => ({ ...f, params: f.params.map((p, i) => (i === index ? { ...p, ...changes } : p)) }))

  const submit = async () => {
    let schema
    if (mode === 'json') {
      try {
        schema = JSON.parse(json)
      } catch (error) {
        return setJsonError(`This isn’t valid JSON: ${error.message}`)
      }
    } else {
      schema = fromForm(form, base)
    }
    const name = schema?.function?.name ?? schema?.name
    if (!/^[a-zA-Z0-9_-]+$/.test(name || '')) {
      return toast.error('Give the tool a name with letters, numbers and underscores.')
    }
    setIsSaving(true)
    await onSave(JSON.stringify(schema, null, 2), runsInGendox(name) ? 'ACTION' : execution)
    setIsSaving(false)
  }

  const name = mode === 'form' ? form.name.trim() : parseSchema(json).name

  return (
    <Dialog
      busy={isSaving}
      open={open}
      onClose={onClose}
      size='l'
      title={tool ? `Edit ${toForm(parseSchema(tool.jsonSchema)).name || 'tool'}` : 'Add a tool'}
      subtitle='Describe what the tool does and what it needs. Clear descriptions help the agent use it at the right time.'
      footer={
        <>
          <span className='faint sm' style={{ marginRight: 'auto' }}>
            Saved with the agent.
          </span>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button aria-busy={isSaving} className='btn primary' onClick={submit} disabled={isSaving}>
            {isSaving ? 'Saving…' : tool ? 'Save' : 'Add tool'}
          </button>
        </>
      }
    >
      <div className='row' style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className='pill-tabs'>
          <button className={mode === 'form' ? 'on' : ''} onClick={() => switchMode('form')}>
            Form
          </button>
          <button className={mode === 'json' ? 'on' : ''} onClick={() => switchMode('json')}>
            JSON schema
          </button>
        </div>
        <span className='sp' />
        <select
          className='input'
          style={{ width: 240, height: 32 }}
          value=''
          onChange={e => applyExample(e.target.value)}
        >
          <option value=''>{examplesLoading && !examples.length ? 'Loading examples…' : 'Start from an example…'}</option>
          <optgroup label='Runs in Gendox'>
            {examples
              .filter(e => runsInGendox(parseSchema(e.description).name))
              .map(e => (
                <option key={e.id} value={e.name}>
                  {parseSchema(e.description).name || e.name}
                </option>
              ))}
          </optgroup>
          <optgroup label='Runs on your side'>
            {examples
              .filter(e => !runsInGendox(parseSchema(e.description).name))
              .map(e => (
                <option key={e.id} value={e.name}>
                  {parseSchema(e.description).name || e.name}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {mode === 'form' ? (
        <div className='form'>
          <div className='form-grid'>
            <div className='field'>
              <label>Name</label>
              <input
                className='input mono'
                placeholder='lookup_order'
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <span className='help'>Letters, numbers and underscores.</span>
            </div>
            <div className='field'>
              <label>What it does</label>
              <input
                className='input'
                placeholder='Look up an order by its number…'
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className='field'>
            <span className='lab'>What it needs</span>
            <div className='stack' style={{ gap: 8 }}>
              {form.params.map((p, index) => (
                <div className='prow' key={index}>
                  <input
                    className='input mono'
                    placeholder='name'
                    value={p.name}
                    onChange={e => setParam(index, { name: e.target.value })}
                  />
                  <select className='input' value={p.type} onChange={e => setParam(index, { type: e.target.value })}>
                    {TYPES.map(type => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    className='input'
                    placeholder='Description'
                    value={p.description}
                    onChange={e => setParam(index, { description: e.target.value })}
                  />
                  <label className='check' style={{ alignItems: 'center' }}>
                    <input
                      type='checkbox'
                      checked={p.required}
                      onChange={e => setParam(index, { required: e.target.checked })}
                    />
                    <span>Required</span>
                  </label>
                  <button
                    className='btn ghost s icon'
                    title='Remove'
                    onClick={() => setForm(f => ({ ...f, params: f.params.filter((_, i) => i !== index) }))}
                  >
                    <X className='lucide' />
                  </button>
                </div>
              ))}
            </div>
            <button
              className='btn ghost s'
              style={{ alignSelf: 'flex-start' }}
              onClick={() =>
                setForm(f => ({
                  ...f,
                  params: [...f.params, { name: '', type: 'string', description: '', required: false }]
                }))
              }
            >
              <Plus className='lucide' />
              Add input
            </button>
          </div>
        </div>
      ) : (
        <div className='field'>
          <textarea
            className='input mono'
            rows={16}
            value={json}
            onChange={e => {
              setJson(e.target.value)
              try {
                JSON.parse(e.target.value)
                setJsonError('')
              } catch (error) {
                setJsonError(`This isn’t valid JSON: ${error.message}`)
              }
            }}
          />
          {jsonError && <span className='err'>{jsonError}</span>}
        </div>
      )}

      {name && (
        <div className='field' style={{ marginTop: 18 }}>
          <span className='lab'>Who runs it</span>
          {runsInGendox(name) ? (
            <div className='alert' style={{ '--c': 'var(--accent-text)' }}>
              <b>
                <Server className='lucide' />
                Runs in Gendox
              </b>
              <span className='muted'>
                <span className='mono'>{name}</span> is built into Gendox. The agent gets its result straight away;
                nothing to set up on your side.
              </span>
            </div>
          ) : (
            <>
              <div className='choice sm'>
                {EXECUTIONS.map(([value, Icon, label, text]) => (
                  <label key={value}>
                    <input
                      type='radio'
                      name='execution'
                      value={value}
                      checked={execution === value}
                      onChange={() => setExecution(value)}
                    />
                    <Icon className='lucide' />
                    <b>{label}</b>
                    <span>{text}</span>
                  </label>
                ))}
              </div>
              {execution === 'CLIENT' && (
                <div className='alert' style={{ '--c': 'var(--warn)', marginTop: 10 }}>
                  <b>
                    <TriangleAlert className='lucide' />
                    Your website or app must send the result back
                  </b>
                  <span className='muted'>
                    Where nothing answers, e.g. chats inside Gendox or a site without the handler, the answer waits for
                    it. See “How tools run” on the Tools page.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Dialog>
  )
}

// The agent's function tools (projectAgent.aiTools), saved with PUT …/projects/{p}
const AgentToolsPage = () => {
  const dispatch = useDispatch()
  const { project, organizationId, href, save } = useAgent()
  const { exampleTools, isFetchingExampleTools } = useSelector(state => state.activeProjectAgent)
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_PROJECT'] })
  const isAdmin = useHasOrgRole({ organizationId, roles: ['ROLE_OWNER', 'ROLE_ADMIN'] })

  const [editing, setEditing] = useState(null) // null closed, { index } — index null for a new tool
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    dispatch(fetchExampleTools({ token: getToken() }))
  }, [dispatch])

  const tools = useMemo(() => project?.projectAgent?.aiTools ?? [], [project])


  // the header is known from the profile; the tools show as cards once the agent loads
  if (!project) return <AgentPageSkeleton tab='tools' />

  const saveTools = async (aiTools, message) => {
    try {
      await save({ agent: { aiTools } })
      toast.success(message)

      return true
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)

      return false
    }
  }

  const saveTool = async (jsonSchema, execution) => {
    const index = editing.index
    const next =
      index == null
        ? [...tools, { type: 'function', execution, jsonSchema }]
        : tools.map((t, i) => (i === index ? { ...t, type: 'function', execution, jsonSchema } : t))
    if (await saveTools(next, index == null ? 'Tool added' : 'Tool saved')) setEditing(null)
  }

  return (
    <main className='content'>
      <AgentScope project={project} tab='tools' />

      <div className='list-h'>
        <div>
          <h2>Tools</h2>
          <p className='muted' style={{ marginTop: 4 }}>
            Let the agent do things, not only answer: look up an order, open a ticket, send an email. Each tool says
            where it runs: in Gendox, or on the client side (your website or app).
          </p>
        </div>
        <span className='sp' />
        {canEdit && (
          <button className='btn primary' onClick={() => setEditing({ index: null })}>
            <Plus className='lucide' />
            Add tool
          </button>
        )}
      </div>

      <div className='stack'>
        {tools.length > 0 ? (
          tools.map((tool, index) => {
            const schema = parseSchema(tool.jsonSchema)
            const { name, description, params } = toForm(schema)

            return (
              <div className='card tool' key={tool.id ?? index}>
                <div className='card-h'>
                  <span className='ftype' style={{ '--h': runsInGendox(name) ? 165 : 210 }}>
                    {runsInGendox(name) ? <Server className='lucide' /> : <Wrench className='lucide' />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b className='mono'>{name || 'Unnamed tool'}</b>
                    {description && (
                      <p className='muted sm clamp2' style={{ marginTop: 2 }}>
                        {description}
                      </p>
                    )}
                    <div className='runs'>
                      <RunsBadge name={name} execution={tool.execution} />
                    </div>
                  </div>
                  {canEdit && (
                    <>
                      <button className='btn s' onClick={() => setEditing({ index })}>
                        <Pencil className='lucide' />
                        Edit
                      </button>
                      <button className='btn ghost s icon' title='Remove' onClick={() => setRemoving(index)}>
                        <Trash2 className='lucide' />
                      </button>
                    </>
                  )}
                </div>
                {params.length > 0 && (
                  <div className='card-b' style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <table className='params'>
                      <tbody>
                        {params.map(p => (
                          <tr key={p.name}>
                            <td>
                              <span className='mono'>{p.name}</span>{' '}
                              <span className='faint sm'>
                                {p.type}
                                {p.required ? ' · required' : ''}
                              </span>
                            </td>
                            <td className='muted'>{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className='card'>
            <Empty
              icon={<Wrench className='lucide' />}
              title='No tools yet'
              text='Tools let the agent look things up or take actions in your systems. Start from an example.'
              action={
                canEdit && (
                  <button className='btn primary' onClick={() => setEditing({ index: null })}>
                    Add tool
                  </button>
                )
              }
            />
          </div>
        )}
      </div>

      <div className='card card-b row' style={{ gap: 14, flexWrap: 'wrap' }}>
        <span className='ftype' style={{ '--h': 190 }}>
          <AppWindow className='lucide' />
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className='row'>
            <b className='mono'>open_web_page</b>
            <span className='badge'>Built in · website widget</span>
          </div>
          <p className='muted sm' style={{ marginTop: 2 }}>
            Takes visitors to a page on your site, e.g. the returns form. Turned on in the widget snippet.
          </p>
        </div>
        <Link className='btn s' href={href('/gendox/agent-deploy')}>
          Widget settings
        </Link>
      </div>

      <div className='card'>
        <div className='card-h'>
          <h3>How tools run</h3>
        </div>
        <div className='card-b stack'>
          <div className='lanes'>
            <div className='lane'>
              <b>
                <Server className='lucide' />
                Runs in Gendox
              </b>
              <p>Built into Gendox. The agent gets the result straight away.</p>
              <p className='faint sm'>{GENDOX_TOOLS.join(', ')}</p>
            </div>
            <div className='lane'>
              <b>
                <Send className='lucide' />
                Runs on Client side · async
              </b>
              <p>Your website or app acts on the call. The agent is told it was done and carries on.</p>
              <p className='faint sm'>open_web_page, fill_fields</p>
            </div>
            <div className='lane'>
              <b>
                <Hourglass className='lucide' />
                Runs on Client side · sync
              </b>
              <p>Your website or app runs it and sends the result back. The agent waits, then answers with it.</p>
              <p className='faint sm'>e.g. lookup_order, get_cart</p>
            </div>
          </div>

          <div>
            <b>For a tool the agent waits for</b>
            <div className='lanes' style={{ marginTop: 10 }}>
              <div className='stack' style={{ gap: 6 }}>
                <span className='faint sm'>On your website, after the widget snippet</span>
                <pre className='code'>{WAIT_WIDGET_EXAMPLE}</pre>
              </div>
              <div className='stack' style={{ gap: 6 }}>
                <span className='faint sm'>From your own app, with the API</span>
                <pre className='code'>{WAIT_API_EXAMPLE}</pre>
              </div>
            </div>
            <p className='faint sm' style={{ marginTop: 10 }}>
              Several calls can wait at once; the agent continues when all have a result. Where nothing sends it, e.g.
              chats inside Gendox, the answer keeps waiting.
            </p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <p className='faint sm'>
          <Link className='link' href={href('/gendox/project-settings/validate-tools')}>
            Compare two documents
          </Link>{' '}
          — a developer check for the document-diff tool (owners and admins).
        </p>
      )}

      <ToolDialog
        open={Boolean(editing)}
        tool={editing && editing.index != null ? tools[editing.index] : null}
        examples={exampleTools || []}
        examplesLoading={isFetchingExampleTools}
        onClose={() => setEditing(null)}
        onSave={saveTool}
      />

      <ConfirmDialog
        open={removing != null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing != null ? toForm(parseSchema(tools[removing]?.jsonSchema)).name || 'this tool' : ''}?`}
        text='The agent will stop using this tool. Conversations that already used it keep their history.'
        confirmLabel='Remove'
        onConfirm={() => saveTools(tools.filter((_, i) => i !== removing), 'Tool removed')}
      />
    </main>
  )
}

AgentToolsPage.getLayout = page => (
  <AppLayout page='agents' title='Tools' crumb='Agents'>
    {page}
  </AppLayout>
)

AgentToolsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentToolsPage
