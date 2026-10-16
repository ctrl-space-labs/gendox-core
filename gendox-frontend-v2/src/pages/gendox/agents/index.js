import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Cpu, Library, MessageSquareText, Plus, Search, SearchX, Settings, Wrench } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import projectService from 'src/gendox-sdk/projectService'
import { getToken } from 'src/components/agent/useAgent'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'
import { formatDate } from 'src/components/knowledge/documentUtils'

// The organization's agents the user belongs to. Visibility, model and tools come from GET organizations/{o}/projects.
const AgentsPage = () => {
  const { organization, organizationId, projects, href } = useActiveScope()
  const canCreate = useHasOrgRole({ organizationId, roles: ['OP_CREATE_PROJECT'] })
  const [details, setDetails] = useState({})
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!organizationId) return
    let current = true
    projectService
      .getProjectsByOrganization(organizationId, getToken())
      .then(response => {
        const list = response.data?.content ?? response.data ?? []
        if (current) setDetails(Object.fromEntries(list.map(p => [p.id, p])))
      })
      .catch(() => current && setDetails({}))

    return () => {
      current = false
    }
  }, [organizationId])

  const list = useMemo(() => {
    const value = query.trim().toLowerCase()

    return projects.filter(p => `${p.name} ${p.description || ''}`.toLowerCase().includes(value))
  }, [projects, query])

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Agents</h1>
          <p>Each agent has its own knowledge, instructions and tools{organization ? ` in ${organization.name}` : ''}.</p>
        </div>
        <div className='actions'>
          <label className='search' style={{ minWidth: 220 }}>
            <Search className='lucide' />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Find an agent' />
          </label>
          {canCreate && (
            <Link className='btn primary' href={href('/gendox/create-project', { projectId: null })}>
              <Plus className='lucide' />
              New agent
            </Link>
          )}
        </div>
      </div>

      <div className='agents'>
        {list.map(p => {
          const agent = details[p.id]?.projectAgent
          const tools = agent?.aiTools?.length ?? 0

          return (
            <div className='card agent' key={p.id}>
              <div className='row' style={{ gap: 12 }}>
                <Avatar name={p.name} seed={p.id} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className='trunc' style={{ display: 'block', fontWeight: 600 }}>
                    {p.name}
                  </b>
                  {p.createdAt && <span className='faint sm'>Created {formatDate(p.createdAt)}</span>}
                </div>
                {agent && (
                  <span className={`badge dot ${agent.privateAgent ? '' : 'ok'}`}>
                    {agent.privateAgent ? 'Private' : 'Public'}
                  </span>
                )}
              </div>
              <p className='muted sm clamp2' style={{ minHeight: 40 }}>
                {p.description || <span className='faint'>No description</span>}
              </p>
              {agent && (
                <div className='stats'>
                  <span>
                    <Wrench className='lucide' />
                    {tools} {tools === 1 ? 'tool' : 'tools'}
                  </span>
                  {agent.completionModel?.name && (
                    <span>
                      <Cpu className='lucide' />
                      <span className='mono'>{agent.completionModel.model || agent.completionModel.name}</span>
                    </span>
                  )}
                </div>
              )}
              <div className='row'>
                <Link className='btn s primary' href={href('/gendox/chat', { projectId: p.id })}>
                  <MessageSquareText className='lucide' />
                  Chat
                </Link>
                <Link className='btn s' href={href('/gendox/knowledge', { projectId: p.id })}>
                  <Library className='lucide' />
                  Knowledge
                </Link>
                <span className='sp' />
                <Link
                  className='btn ghost s icon'
                  href={href('/gendox/agent-behavior', { projectId: p.id })}
                  title='Settings'
                >
                  <Settings className='lucide' />
                </Link>
              </div>
            </div>
          )
        })}
        {!query && canCreate && (
          <Link className='new-agent' href={href('/gendox/create-project', { projectId: null })}>
            <span className='ftype big' style={{ '--h': 165 }}>
              <Plus className='lucide' />
            </span>
            <b>New agent</b>
            <span className='faint sm'>About two minutes</span>
          </Link>
        )}
        {list.length === 0 && query && (
          <div className='card' style={{ gridColumn: '1 / -1' }}>
            <Empty icon={<SearchX className='lucide' />} title='No agents match' text='Try another name.' />
          </div>
        )}
      </div>
    </main>
  )
}

AgentsPage.getLayout = page => (
  <AppLayout page='agents' title='Agents'>
    {page}
  </AppLayout>
)

AgentsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentsPage
