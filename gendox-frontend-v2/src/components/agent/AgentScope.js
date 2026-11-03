import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeftRight, Check, LayoutGrid, MessageSquareText, Plus } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import Avatar from 'src/components/ui/Avatar'
import Menu from 'src/components/ui/Menu'
import MenuList from 'src/components/ui/MenuList'

// the agent's settings, one page each; Knowledge has the same header without tabs
export const AGENT_TABS = [
  { id: 'behavior', title: 'Behavior', path: '/gendox/agent-behavior' },
  { id: 'tools', title: 'Tools', path: '/gendox/agent-tools' },
  { id: 'skills', title: 'Skills', path: '/gendox/agent-skills' },
  { id: 'deploy', title: 'Deploy', path: '/gendox/agent-deploy' },
  { id: 'members', title: 'Members', path: '/gendox/agent-members' },
  { id: 'general', title: 'General', path: '/gendox/agent-settings' }
]

/**
 * The header of an agent's pages: the agent, whether it is public, and a way to switch agent or chat with it.
 * Switching agent keeps the current page.
 * @param project - the full project (GET …/projects/{p}); the profile's copy is used until it loads
 * @param tab - the settings tab to highlight; without it, no tabs are shown
 */
const AgentScope = ({ project, tab }) => {
  const router = useRouter()
  const { organization, projects, project: profileProject, projectId, href } = useActiveScope()
  const agent = project ?? profileProject
  if (!agent) return null

  const privateAgent = project?.projectAgent?.privateAgent

  return (
    <div className='scope'>
      <div className='scope-top'>
        <Avatar name={agent.name} seed={agent.id} size='l' />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className='row' style={{ gap: 10, flexWrap: 'wrap' }}>
            <h1>{agent.name}</h1>
            {privateAgent !== undefined && (
              <span className={`badge dot ${privateAgent ? '' : 'ok'}`}>{privateAgent ? 'Private' : 'Public'}</span>
            )}
          </div>
          {agent.description ? (
            <p className='muted sm trunc'>{agent.description}</p>
          ) : (
            <p className='faint sm trunc'>
              No description yet.{' '}
              <Link className='link' href={href('/gendox/agent-settings')}>
                Say what this agent is for
              </Link>
            </p>
          )}
        </div>
        <div className='row' style={{ flex: 'none' }}>
          <Menu
            align='right'
            trigger={({ onClick }) => (
              <button className='btn s' onClick={onClick} title='Switch agent'>
                <ArrowLeftRight className='lucide' />
                <span className='hide-sm'>Switch agent</span>
              </button>
            )}
          >
            <div className='h'>Agents in {organization?.name ?? 'this organization'}</div>
            <MenuList items={projects} currentId={projectId} noun='agents'>
              {p => (
                <Link key={p.id} className='mi' href={href(router.pathname, { projectId: p.id })}>
                  <Avatar name={p.name} seed={p.id} size='s' />
                  <span className='trunc' style={{ flex: 1 }}>
                    {p.name}
                  </span>
                  {p.id === projectId && <Check className='lucide' />}
                </Link>
              )}
            </MenuList>
            <hr />
            <Link className='mi' href={href('/gendox/agents')}>
              <LayoutGrid className='lucide' />
              All agents
            </Link>
            <Link className='mi' href={href('/gendox/create-project')}>
              <Plus className='lucide' />
              New agent
            </Link>
          </Menu>
          <Link className='btn s primary' href={`${href('/gendox/agent-home')}#/chat/new`} title='Chat'>
            <MessageSquareText className='lucide' />
            <span className='hide-sm'>Chat</span>
          </Link>
        </div>
      </div>
      {tab && (
        <nav className='subnav'>
          {AGENT_TABS.map(t => (
            <Link key={t.id} href={href(t.path)} className={t.id === tab ? 'on' : ''}>
              {t.title}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}

export default AgentScope
