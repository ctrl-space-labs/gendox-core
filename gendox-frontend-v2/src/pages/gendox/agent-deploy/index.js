import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowUpRight, Copy, Globe, KeyRound, Lock } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import commonConfig from 'src/configs/common.config'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent from 'src/components/agent/useAgent'
import AgentScope from 'src/components/agent/AgentScope'
import Chat from 'src/components/chat/Chat'
import useChat from 'src/components/chat/useChat'
import AppLayout from 'src/layouts/AppLayout'
import Spinner from 'src/components/ui/Spinner'

const RESUME_OPTIONS = [
  ['1800000', '30 minutes'],
  ['86400000', '1 day'],
  ['604800000', '7 days']
]

// the attributes gendox-widget-plugin.js reads from its script tag
const snippetAttributes = (origin, organizationId, projectId, options) => [
  ['id', 'gendox-chat-script'],
  ['src', `${origin}/gendox-sdk/gendox-widget-plugin.js`],
  ['data-gendox-src', origin],
  ['data-organization-id', organizationId],
  ['data-project-id', projectId],
  ['data-gendox-chat-initial-state', options.startOpen ? 'open' : 'closed'],
  ['data-gendox-local-context-selected-text-enabled', String(options.selectedText)],
  ['data-gendox-open-web-page-tool-enabled', String(options.openPages)],
  ['data-gendox-session-resume-timeout-ms', options.resume]
]

const Preview = () => {
  const { token, newThread, openThread } = useChat()

  return (
    <div className='frame' data-theme='light'>
      <Chat
        token={token}
        variant='widget'
        header
        threadsDrawer
        sources={false}
        poweredBy
        onNewThread={newThread}
        onOpenThread={openThread}
      />
    </div>
  )
}

/**
 * Put the agent to work: who may use it (projectAgent.privateAgent), the website widget snippet, and the API.
 */
const AgentDeployPage = () => {
  const { project, organizationId, projectId, href, save } = useAgent()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_PROJECT'] })
  const [origin, setOrigin] = useState('https://app.gendox.dev')
  const [options, setOptions] = useState({ startOpen: false, selectedText: true, openPages: true, resume: '86400000' })
  const [isSaving, setIsSaving] = useState(false)

  // the widget's script and chat page are served by this app
  useEffect(() => setOrigin(window.location.origin), [])

  if (!project) {
    return (
      <main className='content'>
        <div className='center' style={{ padding: 80 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  const isPrivate = Boolean(project.projectAgent?.privateAgent)
  const attributes = snippetAttributes(origin, organizationId, projectId, options)
  const snippet = `<script\n${attributes.map(([k, v]) => `  ${k}="${v}"`).join('\n')}>\n</script>`
  const apiBase = (commonConfig.gendoxUrl || `${origin}/gendox/api/v1/`).replace(/\/$/, '')
  const apiExample = `curl -X POST "${apiBase}/messages/completions?projectId=${projectId}" \\
  -H "Authorization: Bearer $GENDOX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "value": "Can I return an opened item?" }'`

  const setAccess = async value => {
    if (value === isPrivate) return
    setIsSaving(true)
    try {
      await save({ agent: { privateAgent: value } })
      toast.success(value ? `${project.name} is private. The widget stops answering visitors.` : `${project.name} is public`)
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const copy = (text, message) => navigator.clipboard?.writeText(text).then(() => toast.success(message))
  const option = (key, value) => setOptions(o => ({ ...o, [key]: value }))

  return (
    <main className='content'>
      <AgentScope project={project} tab='deploy' />
      <div className='deploy'>
        <div>
          <section className='sect' style={{ paddingTop: 8 }}>
            <header>
              <h2>Who can use this agent</h2>
              <p>
                Public agents answer anyone on a website where the widget is pasted, and API calls without signing in.
                Private agents answer only signed-in members.
              </p>
            </header>
            <div className='choice'>
              <label>
                <input
                  type='radio'
                  name='access'
                  checked={!isPrivate}
                  disabled={!canEdit || isSaving}
                  onChange={() => setAccess(false)}
                />
                <Globe className='lucide' />
                <b>Public</b>
                <span>Anyone on a site with the widget can chat. Needed for the widget and WordPress.</span>
              </label>
              <label>
                <input
                  type='radio'
                  name='access'
                  checked={isPrivate}
                  disabled={!canEdit || isSaving}
                  onChange={() => setAccess(true)}
                />
                <Lock className='lucide' />
                <b>Private</b>
                <span>Only signed-in members. Use it for internal agents.</span>
              </label>
            </div>
          </section>

          <section className='sect wide'>
            <header>
              <h2>Add the widget to your site</h2>
              <p>
                Paste this before <code>&lt;/body&gt;</code> on the pages of any website that should show the chat.
              </p>
              <p style={{ marginTop: 12 }}>
                <a
                  className='link sm'
                  href={`${commonConfig.gendoxDocsUrl}/website-widget/website-widget-installation`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  How to install the widget →
                </a>
              </p>
            </header>
            <div className='snip'>
              <div className='card card-b form' style={{ gap: 12 }}>
                <label className='check'>
                  <input type='checkbox' checked={options.startOpen} onChange={e => option('startOpen', e.target.checked)} />
                  <div>
                    <b>Start open</b>
                    <span>Show the chat panel when the page loads, instead of the bubble.</span>
                  </div>
                </label>
                <label className='check'>
                  <input
                    type='checkbox'
                    checked={options.selectedText}
                    onChange={e => option('selectedText', e.target.checked)}
                  />
                  <div>
                    <b>Use the text visitors select</b>
                    <span>If a visitor selects text on your page, the agent can answer about it.</span>
                  </div>
                </label>
                <label className='check'>
                  <input type='checkbox' checked={options.openPages} onChange={e => option('openPages', e.target.checked)} />
                  <div>
                    <b>Let the agent open pages</b>
                    <span>The agent can take visitors to a page on your site, e.g. the returns form.</span>
                  </div>
                </label>
                <div className='field' style={{ maxWidth: 280 }}>
                  <label>Continue a conversation for</label>
                  <select className='input' value={options.resume} onChange={e => option('resume', e.target.value)}>
                    {RESUME_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className='help'>After this, a returning visitor starts a new conversation.</span>
                </div>
              </div>
              <div className='card snip-code'>
                <div className='card-h'>
                  <h3>Snippet</h3>
                  <span className='faint sm'>Updates as you change the options</span>
                  <span className='sp' />
                  <button className='btn s' onClick={() => copy(snippet, 'Snippet copied')}>
                    <Copy className='lucide' />
                    Copy
                  </button>
                </div>
                <pre className='code'>
                  <span className='ln'>&lt;script</span>
                  {attributes.map(([k, v]) => (
                    <span className='ln at' key={k}>
                      <span className='k'>{k}</span>=<span className='s'>&quot;{v}&quot;</span>
                    </span>
                  ))}
                  <span className='ln'>&gt;&lt;/script&gt;</span>
                </pre>
              </div>
            </div>
          </section>

          <section className='sect'>
            <header>
              <h2>Use it from your code</h2>
              <p>Send questions to this agent from your own app with an API key. Answers come back with their sources.</p>
            </header>
            <div className='stack'>
              <div className='code-wrap'>
                <pre className='code'>{apiExample}</pre>
              </div>
              <div className='row'>
                <Link className='btn' href={href('/gendox/api-keys')}>
                  <KeyRound className='lucide' />
                  API keys
                </Link>
                <a className='btn ghost' href={commonConfig.gendoxDocsUrl} target='_blank' rel='noopener noreferrer'>
                  API reference
                  <ArrowUpRight className='lucide' />
                </a>
              </div>
            </div>
          </section>
        </div>

        <aside className='preview'>
          <div className='row'>
            <b style={{ flex: 1 }}>Live preview</b>
          </div>
          <Preview />
          <p className='faint sm'>
            This is the real widget, signed in as you: try a question. Visitors chat without signing in.
          </p>
        </aside>
      </div>
    </main>
  )
}

AgentDeployPage.getLayout = page => (
  <AppLayout page='agents' title='Deploy' crumb='Agents'>
    {page}
  </AppLayout>
)

AgentDeployPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentDeployPage
