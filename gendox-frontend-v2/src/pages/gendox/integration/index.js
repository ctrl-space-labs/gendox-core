import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, Cable, Ellipsis, Info, Library, Pause, Pencil, Trash2, Unplug } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import integrationService from 'src/gendox-sdk/integrationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import apiKeyService from 'src/gendox-sdk/apiKeyService'
import { fetchOrganizationMembers } from 'src/store/activeOrganization/activeOrganization'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import { IntegrationTile, bareUrl, buildRows, everyText, formatWhen, typeOf } from 'src/components/integrations/integrationUtils'
import { EditIntegrationDialog, RemoveIntegrationDialog } from 'src/components/integrations/IntegrationDialogs'
import WebPagesPicker from 'src/components/integrations/WebPagesPicker'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import Switch from 'src/components/ui/Switch'

// what WordPress, Git and S3 integrations read, under the facts (a crawled website gets its page picker instead)
// the key the WordPress plugin connects with: the website holds its id, the key list its value (shown by its tail)
const useWebsiteKeyTail = (organizationId, apiKeyId) => {
  const [tail, setTail] = useState(null)

  useEffect(() => {
    if (!organizationId || !apiKeyId) return
    let current = true
    apiKeyService
      .getApiKeysByOrganizationId(organizationId, getToken())
      .then(r => {
        const key = (r.data ?? []).find(k => k.id === apiKeyId)?.apiKey
        if (current && key) setTail(`••••${key.slice(-4)}`)
      })
      .catch(() => {})

    return () => {
      current = false
    }
  }, [organizationId, apiKeyId])

  return tail
}

const Details = ({ row, href, organizationId }) => {
  const { integration, type } = row
  const keyTail = useWebsiteKeyTail(organizationId, type === 'API_INTEGRATION' ? row.website?.apiKeyId : null)
  if (type === 'API_INTEGRATION') {
    const site = bareUrl(row.url)

    return (
      <section className='sect'>
        <header>
          <h2>How it works</h2>
          <p>
            The Gendox plugin on {site} decides which posts and pages go to which agent. Each time Gendox checks, it
            fetches what the plugin assigns and updates what changed.
          </p>
        </header>
        <div className='stack'>
          <div className='card'>
            <dl className='kv card-b'>
              <dt>Site</dt>
              <dd>
                <a className='link' href={row.url} target='_blank' rel='noopener noreferrer'>
                  {site}
                </a>
              </dd>
              <dt>Connected with</dt>
              <dd>
                {keyTail ? <span className='mono'>{keyTail}</span> : 'An API key'} ·{' '}
                <Link className='link' href={href('/gendox/api-keys')}>
                  API keys
                </Link>
              </dd>
              <dt>Posts and agents</dt>
              <dd>Chosen in WordPress → Gendox AI Chat → Settings</dd>
            </dl>
            <div className='card-f row' style={{ flexWrap: 'wrap' }}>
              <Link className='btn s' href={href('/gendox/knowledge')}>
                <Library className='lucide' />
                WordPress documents in Knowledge
              </Link>
              <Link className='btn ghost s' href={href('/gendox/wordpress')}>
                Plugin guide
              </Link>
            </div>
          </div>
          <p className='faint sm'>
            <Info className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> The plugin also adds the
            chat widget to the site. The on/off state comes from the plugin: to stop it, deactivate the plugin or revoke
            its API key.
          </p>
        </div>
      </section>
    )
  }
  if (type === 'GIT_INTEGRATION') {
    return (
      <section className='sect'>
        <header>
          <h2>Repository</h2>
          <p>Gendox reads the files in the folder at every new commit, and updates the documents that changed.</p>
        </header>
        <div className='card'>
          <dl className='kv card-b'>
            <dt>Address</dt>
            <dd className='mono trunc'>{integration.url}</dd>
            <dt>Folder</dt>
            <dd className='mono'>{integration.directoryPath || 'Whole repository'}</dd>
            {integration.userName && (
              <>
                <dt>Username</dt>
                <dd>{integration.userName}</dd>
              </>
            )}
            <dt>Password or token</dt>
            <dd className='faint'>Saved · never shown</dd>
            {integration.repoHead && (
              <>
                <dt>Last commit read</dt>
                <dd className='mono'>{integration.repoHead}</dd>
              </>
            )}
          </dl>
        </div>
      </section>
    )
  }
  if (type === 'AWS_S3_INTEGRATION') {
    return (
      <section className='sect'>
        <header>
          <h2>Queue</h2>
          <p>Your bucket announces new files on this queue, and Gendox reads each file it announces.</p>
        </header>
        <div className='card'>
          <dl className='kv card-b'>
            <dt>Queue name</dt>
            <dd className='mono'>{integration.queueName}</dd>
          </dl>
        </div>
      </section>
    )
  }

  return null
}

/**
 * One integration: what it reads, into which agent, how often, and when it last ran.
 * A crawled website also gets its page picker. GET organizations/{o}/integrations/{id}.
 */
const IntegrationPage = () => {
  const router = useRouter()
  // ?from=knowledge: opened from an agent's Knowledge page, so back leads there instead of to the list
  const { integrationId, from } = router.query
  const { organizationId, projects, href } = useActiveScope()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_EDIT_INTEGRATIONS'] })

  const [row, setRow] = useState(null)
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [toggling, setToggling] = useState(false)
  // who added it, by name
  const dispatch = useDispatch()
  // only this organization's members: another's may still be in the store
  const members = useSelector(state =>
    state.activeOrganization.organizationMembersFor === organizationId ? state.activeOrganization.organizationMembers : null
  )
  useEffect(() => {
    if (organizationId && !members) dispatch(fetchOrganizationMembers({ organizationId, token: getToken() }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, organizationId])

  const load = useCallback(async () => {
    if (!organizationId || !integrationId) return
    const token = getToken()
    try {
      const [integration, websites] = await Promise.all([
        integrationService.getIntegration(organizationId, integrationId, token),
        organizationWebSiteService.getOrganizationWebSitesByOrganizationId(organizationId, token).catch(() => ({ data: [] }))
      ])
      setRow(buildRows([integration.data], websites.data?.content ?? websites.data ?? [])[0])
    } catch {
      setFailed(true)
    }
  }, [organizationId, integrationId])

  useEffect(() => {
    load()
  }, [load])

  const fromKnowledge = from === 'knowledge'
  const listHref = href(fromKnowledge ? '/gendox/knowledge' : '/gendox/integrations', { integrationId: undefined, from: undefined })
  const listTitle = fromKnowledge ? 'Knowledge' : 'Integrations'

  if (failed) {
    return (
      <main className='content'>
        <div className='card'>
          <Empty
            icon={<Cable className='lucide' />}
            title='This integration isn’t available'
            text='It may have been removed.'
            action={
              <Link className='btn' href={listHref}>
                <ArrowLeft className='lucide' />
                {listTitle}
              </Link>
            }
          />
        </div>
      </main>
    )
  }

  if (!row) {
    return (
      <main className='content'>
        <div aria-busy='true' aria-label='Loading' className='stack'>
          <span className='skel' style={{ width: 120, height: 28 }} />
          <div className='row' style={{ gap: 14 }}>
            <span className='skel' style={{ width: 44, height: 44, borderRadius: 12 }} />
            <div className='stack' style={{ gap: 8, flex: 1 }}>
              <span className='skel' style={{ width: 240, height: 24 }} />
              <span className='skel' style={{ width: 180 }} />
            </div>
          </div>
          <div className='card int-facts'>
            {[0, 1, 2, 3].map(i => (
              <div key={i}>
                <span className='skel' style={{ width: 70 }} />
                <span className='skel' style={{ width: '80%', marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const { integration } = row
  const t = typeOf(row.type)
  const agent = projects.find(p => p.id === integration.projectId)
  const wordpress = row.type === 'API_INTEGRATION'
  const web = row.type === 'WEB_SCRAPE_INTEGRATION'
  const creator = members?.find(m => m.user?.id === integration.createdBy)?.user

  const toggle = async active => {
    setToggling(true)
    try {
      await integrationService.setIntegrationActive(organizationId, integration.id, { active }, getToken())
      await load()
      toast.success(active ? `${row.title} is on` : `${row.title} is off. Its documents stay in the knowledge.`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setToggling(false)
    }
  }

  return (
    <main className='content' style={{ maxWidth: 1100 }}>
      <Link className='btn ghost s' href={listHref} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft className='lucide' />
        {listTitle}
      </Link>

      <div className='page-h' style={{ marginTop: 4 }}>
        <div className='row' style={{ gap: 14, minWidth: 0, alignItems: 'flex-start' }}>
          <IntegrationTile type={row.type} className='big' />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ overflowWrap: 'anywhere' }}>{row.title}</h1>
            <p className='trunc'>
              {t.title} ·{' '}
              {row.url?.startsWith('http') ? (
                <a className='link' href={row.url} target='_blank' rel='noopener noreferrer'>
                  {bareUrl(row.url)}
                </a>
              ) : (
                <span className='mono'>{row.url}</span>
              )}
            </p>
          </div>
        </div>
        <div className='actions'>
          {wordpress ? (
            <span className={`badge ${row.active ? 'dot ok' : ''}`} title='The plugin turns this on and off each time it connects'>
              {row.active ? 'Connected' : 'Not connected'}
            </span>
          ) : (
            <label className='row sm' style={{ gap: 8 }}>
              <Switch label='Switch on or off' checked={row.active} disabled={!canEdit || toggling} onChange={toggle} />
              {row.active ? 'On' : 'Off'}
            </label>
          )}
          {canEdit && (
            <>
              <button className='btn' onClick={() => setEditing(true)}>
                <Pencil className='lucide' />
                Edit
              </button>
              <Menu
                align='right'
                width={200}
                trigger={({ onClick }) => (
                  <button className='btn ghost icon' title='More' onClick={onClick}>
                    <Ellipsis className='lucide' />
                  </button>
                )}
              >
                <button className='mi' data-close-menu style={{ color: 'var(--err)' }} onClick={() => setRemoving(true)}>
                  <Trash2 className='lucide' />
                  Remove
                </button>
              </Menu>
            </>
          )}
        </div>
      </div>

      {!row.active &&
        (wordpress ? (
          <div className='alert' style={{ '--c': 'var(--warn)' }}>
            <b>
              <Unplug className='lucide' />
              The plugin isn’t connected
            </b>
            <span className='muted'>
              It connects when someone saves the plugin’s settings in WordPress with a valid API key.
            </span>
          </div>
        ) : (
          <div className='alert' style={{ '--c': 'var(--warn)' }}>
            <b>
              <Pause className='lucide' />
              Switched off
            </b>
            <span className='muted'>
              Gendox doesn’t check it on its schedule. What it already added stays in{' '}
              {agent ? `${agent.name}’s` : 'the'} knowledge.
            </span>
          </div>
        ))}

      <div className='card int-facts'>
        <div>
          <span className='faint sm'>Adds to</span>
          {agent ? (
            <Link className='row' style={{ gap: 8 }} href={href('/gendox/knowledge', { projectId: agent.id })}>
              <Avatar name={agent.name} seed={agent.id} size='s' />
              <span className='trunc'>{agent.name}</span>
            </Link>
          ) : (
            <span className='muted'>{wordpress ? 'Agents chosen in the plugin' : '—'}</span>
          )}
        </div>
        <div>
          <span className='faint sm'>{web ? 'Reads pages again' : 'Checks'}</span>
          {everyText(integration.runIntervalMinutes)}
        </div>
        <div>
          <span className='faint sm'>Last run</span>
          <span className='num'>{formatWhen(integration.lastRunAt) || 'Never'}</span>
        </div>
        <div>
          <span className='faint sm'>Added</span>
          <span className='trunc' style={{ display: 'block' }}>
            {[integration.createdAt && formatDate(integration.createdAt), creator?.name || creator?.email]
              .filter(Boolean)
              .join(' · ') || '—'}
          </span>
        </div>
      </div>

      {row.type === 'WEB_SCRAPE_INTEGRATION' && (
        <WebPagesPicker
          key={integration.id}
          organizationId={organizationId}
          integration={integration}
          agentName={agent?.name}
          onRunFinished={load}
        />
      )}

      <Details row={row} href={href} organizationId={organizationId} />

      {editing && <EditIntegrationDialog row={row} onClose={() => setEditing(false)} onSaved={load} />}
      {removing && (
        <RemoveIntegrationDialog row={row} onClose={() => setRemoving(false)} onRemoved={() => router.push(listHref)} />
      )}
    </main>
  )
}

IntegrationPage.getLayout = page => (
  <AppLayout page='integrations' title='Integration' crumb='Integrations'>
    {page}
  </AppLayout>
)

IntegrationPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default IntegrationPage
