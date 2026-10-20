import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowUpRight, Cable, Ellipsis, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import integrationService from 'src/gendox-sdk/integrationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import subscriptionPlanService from 'src/gendox-sdk/subscriptionPlanService'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import {
  IntegrationTile,
  bareUrl,
  buildRows,
  everyText,
  formatWhen,
  typeOf
} from 'src/components/integrations/integrationUtils'
import {
  AddIntegrationDialog,
  EditIntegrationDialog,
  RemoveIntegrationDialog
} from 'src/components/integrations/IntegrationDialogs'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import Spinner from 'src/components/ui/Spinner'
import Switch from 'src/components/ui/Switch'

const UNLIMITED = 9999

const Meter = ({ label, used, max, note }) => (
  <div className='card card-b meter'>
    <div className='row sm'>
      <span className='muted'>{label}</span>
      <span className='sp' />
      <span className='num'>
        <b>{(used ?? 0).toLocaleString()}</b> of {max >= UNLIMITED ? 'unlimited' : max.toLocaleString()}
      </span>
    </div>
    {max < UNLIMITED && (
      <div className='progress'>
        <i style={{ width: `${Math.min(100, ((used ?? 0) / max) * 100)}%` }} />
      </div>
    )}
    <span className='faint sm'>{note}</span>
  </div>
)

/**
 * Everything that keeps the agents' knowledge in sync with another place. One list joined on the client:
 * GET integrations?organizationId + GET organizations/{o}/websites, with the plan's limit and the page allowance.
 */
const IntegrationsPage = () => {
  const router = useRouter()
  const { organizationId, projects, href } = useActiveScope()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_EDIT_INTEGRATIONS'] })

  const [integrations, setIntegrations] = useState(null)
  const [websites, setWebsites] = useState([])
  const [limit, setLimit] = useState(null)
  const [budget, setBudget] = useState(null)
  const [show, setShow] = useState('on')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false) // false, true, or the kind to open on
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const load = useCallback(async () => {
    if (!organizationId) return
    const token = getToken()
    const [ints, sites] = await Promise.all([
      integrationService.getIntegrationsByOrganizationId(organizationId, token).catch(() => null),
      organizationWebSiteService.getOrganizationWebSitesByOrganizationId(organizationId, token).catch(() => null)
    ])
    setIntegrations(ints?.data?.content ?? ints?.data ?? [])
    setWebsites(sites?.data?.content ?? sites?.data ?? [])
    webScrapeService
      .getBudget(organizationId, token)
      .then(r => setBudget(r.data))
      .catch(() => setBudget(null))

    return { integrations: ints?.data?.content ?? ints?.data ?? [], websites: sites?.data?.content ?? sites?.data ?? [] }
  }, [organizationId])

  useEffect(() => {
    load()
    if (!organizationId) return
    subscriptionPlanService
      .getOrganizationPlans(organizationId, getToken())
      .then(r => setLimit(r.data?.subscriptionPlan?.organizationWebSites ?? null))
      .catch(() => setLimit(null))
  }, [load, organizationId])

  useEffect(() => {
    if (!router.isReady) return
    // #add opens the choice of kinds, #add-website the website form (from New agent → Read a website)
    const { hash } = window.location
    if (hash !== '#add' && hash !== '#add-website') return
    setAdding(hash === '#add' ? true : 'WEB_SCRAPE_INTEGRATION')
    // consumed: a reload shouldn't open it again
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [router.isReady])

  const rows = useMemo(() => buildRows(integrations ?? [], websites), [integrations, websites])
  const counts = { on: rows.filter(r => r.active).length, off: rows.filter(r => !r.active).length, all: rows.length }

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase()

    return rows.filter(
      r => (show === 'all' || (show === 'on') === r.active) && `${r.title} ${r.url}`.toLowerCase().includes(value)
    )
  }, [rows, show, query])

  const agentOf = row => projects.find(p => p.id === row.integration?.projectId)
  const openHref = row => (row.integration ? href('/gendox/integration', { integrationId: row.integration.id }) : null)

  const toggle = async (row, active) => {
    setTogglingId(row.id)
    try {
      await integrationService.setIntegrationActive(organizationId, row.integration.id, { active }, getToken())
      await load()
      toast.success(active ? `${row.title} is on` : `${row.title} is off. Its documents stay in the knowledge.`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setTogglingId(null)
    }
  }

  // after adding a website, open it to find its pages
  const onAdded = async url => {
    const fresh = await load()
    const added = fresh?.integrations.find(i => i.url === url || i.url?.replace(/\/$/, '') === url.replace(/\/$/, ''))
    if (added) router.push(href('/gendox/integration', { integrationId: added.id }))
  }

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Integrations</h1>
          <p>
            Everything that keeps your agents’ knowledge in sync with another place: websites Gendox reads, WordPress,
            repositories and buckets. Gendox checks each one on its schedule.
          </p>
        </div>
        {canEdit && (
          <div className='actions'>
            <button className='btn primary' onClick={() => setAdding(true)}>
              <Plus className='lucide' />
              Add integration
            </button>
          </div>
        )}
      </div>

      <div className='grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {limit != null && (
          <Meter
            label='Switched on'
            used={counts.on}
            max={limit}
            note='Sources Gendox reads. Switched-off ones don’t count against your plan.'
          />
        )}
        {budget?.maxPages != null && (
          <Meter
            label='Website pages read'
            used={budget.usedPages}
            max={budget.maxPages}
            note={`This period, across every website.${budget.period?.to ? ` Resets ${formatDate(budget.period.to)}.` : ''}`}
          />
        )}
      </div>

      <div className='card' style={{ minWidth: 0 }}>
        <div className='toolbar'>
          <div className='pill-tabs'>
            {[
              ['on', 'On'],
              ['off', 'Off'],
              ['all', 'All']
            ].map(([key, label]) => (
              <button key={key} className={show === key ? 'on' : ''} onClick={() => setShow(key)}>
                {label} <span className='faint'>{counts[key]}</span>
              </button>
            ))}
          </div>
          <label className='search'>
            <Search className='lucide' />
            <input placeholder='Find by name or address…' value={query} onChange={e => setQuery(e.target.value)} />
          </label>
        </div>

        {integrations === null ? (
          <div className='center' style={{ minHeight: 0, padding: 40 }}>
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <Empty
            icon={<Cable className='lucide' />}
            title='Nothing keeps your knowledge in sync yet'
            text='Connect a website or your WordPress site. Gendox checks it on a schedule and adds what changed.'
            action={
              canEdit && (
                <button className='btn primary' onClick={() => setAdding(true)}>
                  Add integration
                </button>
              )
            }
          />
        ) : visible.length === 0 ? (
          <Empty
            icon={<SearchX className='lucide' />}
            title={query ? 'No integrations match' : show === 'on' ? 'Nothing is switched on' : 'Nothing is switched off'}
            text={query ? 'Try another name or address.' : 'Look under All.'}
          />
        ) : (
          <div className='scroll'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Integration</th>
                  <th>Adds to</th>
                  <th className='hide-sm'>Schedule</th>
                  <th className='hide-sm'>Last run</th>
                  <th>On</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map(row => {
                  const t = typeOf(row.type)
                  const agent = agentOf(row)
                  const wordpress = row.type === 'API_INTEGRATION'

                  return (
                    <tr
                      key={row.id}
                      style={{ cursor: row.integration ? 'pointer' : 'default' }}
                      onClick={e => {
                        if (e.target.closest('button, a, .pop') || !row.integration) return
                        router.push(openHref(row))
                      }}
                    >
                      <td>
                        <div className='row' style={{ gap: 12, maxWidth: 380 }}>
                          <IntegrationTile type={row.type} />
                          <div style={{ minWidth: 0 }}>
                            <div className='trunc' style={{ fontWeight: 500 }}>
                              {row.title}
                            </div>
                            <div className='faint sm trunc'>
                              {t.title} · {bareUrl(row.url)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {agent ? (
                          <div className='row' style={{ gap: 8 }}>
                            <Avatar name={agent.name} seed={agent.id} size='s' />
                            <span className='sm trunc'>{agent.name}</span>
                          </div>
                        ) : (
                          <span className='faint sm'>
                            {t.still ? 'Nothing connected' : wordpress ? 'Chosen in the plugin' : '—'}
                          </span>
                        )}
                      </td>
                      <td className='hide-sm muted sm'>{t.still ? '—' : everyText(row.integration.runIntervalMinutes)}</td>
                      <td className='hide-sm muted sm num'>
                        {t.still ? '—' : formatWhen(row.integration.lastRunAt) || 'Never'}
                      </td>
                      <td>
                        {t.still ? (
                          <span className='faint'>—</span>
                        ) : wordpress ? (
                          <span
                            className={`badge ${row.active ? 'dot ok' : ''}`}
                            title='The plugin turns this on and off each time it connects'
                          >
                            {row.active ? 'Connected' : 'Not connected'}
                          </span>
                        ) : (
                          <Switch
                            label={`${row.active ? 'Switch off' : 'Switch on'} ${row.title}`}
                            checked={row.active}
                            disabled={!canEdit || togglingId === row.id}
                            onChange={value => toggle(row, value)}
                          />
                        )}
                      </td>
                      <td style={{ width: '1%' }}>
                        <Menu
                          align='right'
                          width={220}
                          trigger={({ onClick }) => (
                            <button className='btn ghost s icon' title='More' onClick={onClick}>
                              <Ellipsis className='lucide' />
                            </button>
                          )}
                        >
                          {row.integration && (
                            <Link className='mi' href={openHref(row)}>
                              <ArrowUpRight className='lucide' />
                              Open
                            </Link>
                          )}
                          {canEdit && (
                            <>
                              <button className='mi' data-close-menu onClick={() => setEditing(row)}>
                                <Pencil className='lucide' />
                                Edit
                              </button>
                              <button
                                className='mi'
                                data-close-menu
                                style={{ color: 'var(--err)' }}
                                onClick={() => setRemoving(row)}
                              >
                                <Trash2 className='lucide' />
                                Remove
                              </button>
                            </>
                          )}
                        </Menu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddIntegrationDialog
        open={Boolean(adding)}
        initialType={typeof adding === 'string' ? adding : null}
        onClose={() => setAdding(false)}
        onAdded={onAdded}
        budget={budget}
      />
      <EditIntegrationDialog row={editing} onClose={() => setEditing(null)} onSaved={load} />
      <RemoveIntegrationDialog row={removing} onClose={() => setRemoving(null)} onRemoved={load} />
    </main>
  )
}

IntegrationsPage.getLayout = page => (
  <AppLayout page='integrations' title='Integrations'>
    {page}
  </AppLayout>
)

IntegrationsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default IntegrationsPage
