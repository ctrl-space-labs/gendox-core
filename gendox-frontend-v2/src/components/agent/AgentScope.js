import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeftRight, Check, MessageSquareText } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import Avatar from 'src/components/ui/Avatar'
import Menu from 'src/components/ui/Menu'

// the agent's settings, one page each; Knowledge has the same header without tabs
export const AGENT_TABS = [
  { id: 'behavior', title: 'Behavior', path: '/gendox/agent-behavior' },
  { id: 'tools', title: 'Tools', path: '/gendox/agent-tools' },
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
  const { projects, project: profileProject, projectId, href } = useActiveScope()
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
          {agent.description && <p className='muted sm trunc'>{agent.description}</p>}
        </div>
        <div className='row hide-sm'>
          {projects.length > 1 && (
            <Menu
              align='right'
              trigger={({ onClick }) => (
                <button className='btn s' onClick={onClick}>
                  <ArrowLeftRight className='lucide' />
                  Switch agent
                </button>
              )}
            >
              <div className='h'>Agents</div>
              {projects.map(p => (
                <Link key={p.id} className='mi' href={href(router.pathname, { projectId: p.id })}>
                  <Avatar name={p.name} seed={p.id} size='s' />
                  <span className='trunc' style={{ flex: 1 }}>
                    {p.name}
                  </span>
                  {p.id === projectId && <Check className='lucide' />}
                </Link>
              ))}
            </Menu>
          )}
          <Link className='btn s primary' href={`${href('/gendox/agent-home')}#/chat/new`}>
            <MessageSquareText className='lucide' />
            Chat
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
