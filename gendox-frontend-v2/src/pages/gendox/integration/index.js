import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowLeft, Cable, Pencil, Trash2 } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import integrationService from 'src/gendox-sdk/integrationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import { IntegrationTile, bareUrl, buildRows, everyText, formatWhen, typeOf } from 'src/components/integrations/integrationUtils'
import { EditIntegrationDialog, RemoveIntegrationDialog } from 'src/components/integrations/IntegrationDialogs'
import WebPagesPicker from 'src/components/integrations/WebPagesPicker'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'
import Spinner from 'src/components/ui/Spinner'
import Switch from 'src/components/ui/Switch'

/**
 * One integration: what it reads, into which agent, how often, and when it last ran.
 * A crawled website also gets its page picker. GET organizations/{o}/integrations/{id}.
 */
const IntegrationPage = () => {
  const router = useRouter()
  const { integrationId } = router.query
  const { organizationId, projects, href } = useActiveScope()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_EDIT_INTEGRATIONS'] })

  const [row, setRow] = useState(null)
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [toggling, setToggling] = useState(false)

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

  const listHref = href('/gendox/integrations')

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
                Integrations
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
        <div className='center' style={{ minHeight: 0, padding: 80 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  const { integration } = row
  const t = typeOf(row.type)
  const agent = projects.find(p => p.id === integration.projectId)
  const wordpress = row.type === 'API_INTEGRATION'

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
        Integrations
      </Link>

      <div className='page-h' style={{ marginTop: 4 }}>
        <div className='row' style={{ gap: 14, minWidth: 0, alignItems: 'flex-start' }}>
          <IntegrationTile type={row.type} className='big' />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ overflowWrap: 'anywhere' }}>{row.title}</h1>
            <p>
              {t.title} · {t.how}
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
              <button className='btn ghost danger' onClick={() => setRemoving(true)}>
                <Trash2 className='lucide' />
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      <div className='card card-b'>
        <dl className='kv'>
          <dt>Adds to</dt>
          <dd>
            {agent ? (
              <Link className='row' style={{ gap: 8 }} href={href('/gendox/knowledge', { projectId: agent.id })}>
                <Avatar name={agent.name} seed={agent.id} size='s' />
                {agent.name}
              </Link>
            ) : wordpress ? (
              'The agents chosen in the plugin'
            ) : (
              '—'
            )}
          </dd>
          <dt>{row.type === 'AWS_S3_INTEGRATION' ? 'Queue' : 'Address'}</dt>
          <dd>
            {row.url?.startsWith('http') ? (
              <a className='link' href={row.url} target='_blank' rel='noopener noreferrer'>
                {bareUrl(row.url)}
              </a>
            ) : (
              <span className='mono'>{row.url}</span>
            )}
          </dd>
          {!wordpress && (
            <>
              <dt>{row.type === 'WEB_SCRAPE_INTEGRATION' ? 'Reads the pages again' : 'Checks for changes'}</dt>
              <dd>{everyText(integration.runIntervalMinutes)}</dd>
            </>
          )}
          <dt>Last run</dt>
          <dd>{formatWhen(integration.lastRunAt) || 'Never'}</dd>
          {integration.createdAt && (
            <>
              <dt>Added</dt>
              <dd>{formatDate(integration.createdAt)}</dd>
            </>
          )}
        </dl>
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
