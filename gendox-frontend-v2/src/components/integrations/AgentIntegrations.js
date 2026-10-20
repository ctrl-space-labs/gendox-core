import { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import integrationService from 'src/gendox-sdk/integrationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import { getToken } from 'src/components/agent/useAgent'
import { timeAgo } from 'src/components/knowledge/documentUtils'
import { IntegrationTile, buildRows, everyText, typeOf } from 'src/components/integrations/integrationUtils'
import { SkeletonList } from 'src/components/ui/Skeleton'

/** The organization's integrations as rows (see buildRows), for an agent or all of them */
export const loadIntegrationRows = async organizationId => {
  const token = getToken()
  const [ints, sites] = await Promise.all([
    integrationService.getIntegrationsByOrganizationId(organizationId, token),
    organizationWebSiteService.getOrganizationWebSitesByOrganizationId(organizationId, token).catch(() => null)
  ])

  return buildRows(ints?.data?.content ?? ints?.data ?? [], sites?.data?.content ?? sites?.data ?? [])
}

/**
 * What keeps an agent's knowledge in sync: its integrations, each leading to its own page. On the Knowledge page,
 * above the documents. `ref.current.reload()` loads them again, after one is added.
 */
const AgentIntegrations = forwardRef(({ organizationId, projectId, agentName, href }, ref) => {
  const [rows, setRows] = useState(null) // null while loading

  const load = useCallback(() => {
    if (!organizationId || !projectId) return
    loadIntegrationRows(organizationId)
      .then(all => setRows(all.filter(row => row.integration?.projectId === projectId)))
      .catch(() => setRows([]))
  }, [organizationId, projectId])

  useEffect(() => {
    setRows(null)
    load()
  }, [load])

  useImperativeHandle(ref, () => ({ reload: load }), [load])

  return (
    <div className='card'>
      <div className='card-h'>
        <h3>Integrations</h3>
        <span className='faint sm'>{rows?.length ?? ''}</span>
        <span className='sp' />
        <Link className='btn ghost s' href={href('/gendox/integrations')}>
          All integrations
          <ArrowRight className='lucide' />
        </Link>
      </div>
      {rows === null ? (
        <SkeletonList rows={1} />
      ) : rows.length === 0 ? (
        <div className='card-b faint sm fade-in'>
          Nothing keeps {agentName || 'this agent'}’s knowledge in sync yet. Add a website, or connect WordPress or a
          repository from{' '}
          <Link className='link' href={href('/gendox/integrations')}>
            Integrations
          </Link>
          .
        </div>
      ) : (
        rows.map(row => {
          const wordpress = row.type === 'API_INTEGRATION'
          const lastRun = row.integration.lastRunAt ? timeAgo(row.integration.lastRunAt).replace(/^Just now$/, 'just now') : 'never'

          return (
            <Link key={row.id} className='item fade-in' href={href('/gendox/integration', { integrationId: row.integration.id, from: 'knowledge' })}>
              <IntegrationTile type={row.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className='trunc' style={{ fontWeight: 500 }}>
                  {row.title}
                </div>
                <div className='faint sm trunc'>
                  {typeOf(row.type).title} ·{' '}
                  {wordpress ? 'posts chosen in the plugin' : everyText(row.integration.runIntervalMinutes).toLowerCase()} · last run{' '}
                  {lastRun}
                </div>
              </div>
              <span className={`badge ${row.active ? 'dot ok' : ''}`}>
                {wordpress ? (row.active ? 'Connected' : 'Not connected') : row.active ? 'On' : 'Off'}
              </span>
              <ChevronRight className='lucide faint' />
            </Link>
          )
        })
      )}
    </div>
  )
})

AgentIntegrations.displayName = 'AgentIntegrations'

export default AgentIntegrations
