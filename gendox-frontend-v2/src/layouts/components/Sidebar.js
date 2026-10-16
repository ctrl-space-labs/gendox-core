import { useMemo } from 'react'
import Link from 'next/link'
import { Check, ChevronsUpDown, LayoutGrid, Library, ListChecks, MessagesSquare, Plus, Settings, SquarePen } from 'lucide-react'
import navigation from 'src/navigation'
import useActiveScope from 'src/hooks/useActiveScope'
import useHomeLayout, { homePathOf } from 'src/hooks/useHomeLayout'
import { useChatThreads } from 'src/components/chat/useChat'
import { groupThreadsByDate } from 'src/components/chat/chatUtils'
import AccountMenu from 'src/layouts/components/AccountMenu'
import Avatar from 'src/components/ui/Avatar'
import Menu from 'src/components/ui/Menu'

// the agent's pages in the agent layout; Settings stays lit on every agent settings page
const agentNavigation = [
  { id: 'tasks', title: 'Tasks', icon: ListChecks, path: '/gendox/tasks' },
  { id: 'knowledge', title: 'Knowledge', icon: Library, path: '/gendox/knowledge' },
  { id: 'agents', title: 'Settings', icon: Settings, path: '/gendox/agent-behavior' }
]

/** The agent layout's top: which agent, and a new chat in its workspace */
const AgentSwitcher = () => {
  const { projects, project, href } = useActiveScope()

  return (
    <>
      <Menu
        width={260}
        trigger={({ onClick }) => (
          <button className='org' onClick={onClick}>
            <Avatar name={project?.name} seed={project?.id} size='s' />
            <span className='trunc'>
              {project?.name ?? 'Agent'}
              <small>Agent · {project?.projectAgent?.privateAgent === false ? 'Public' : 'Private'}</small>
            </span>
            <ChevronsUpDown className='lucide' />
          </button>
        )}
      >
        <div className='h'>Agents</div>
        {projects.map(p => (
          <Link key={p.id} className='mi' href={href('/gendox/agent-home', { projectId: p.id })}>
            <Avatar name={p.name} seed={p.id} size='s' />
            <span className='trunc' style={{ flex: 1 }}>
              {p.name}
            </span>
            {p.id === project?.id && <Check className='lucide' />}
          </Link>
        ))}
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
      <Link className='newchat' href={`${href('/gendox/agent-home')}#/chat/new`}>
        <SquarePen className='lucide' />
        New chat
      </Link>
    </>
  )
}

/** The agent layout's recent chats with the current agent; each opens as a tab in the workspace */
const RecentChats = () => {
  const { organizationId, projectId, href } = useActiveScope()
  const threads = useChatThreads(organizationId)
  const groups = useMemo(
    () => groupThreadsByDate((threads ?? []).filter(t => t.agent?.projectId === projectId).slice(0, 40)),
    [threads, projectId]
  )

  return (
    <div className='recents'>
      {Object.entries(groups).map(([label, list]) =>
        list.length ? (
          <div key={label}>
            <div className='nav-label'>{label}</div>
            {list.map(thread => (
              <Link
                key={thread.threadId}
                className='trunc'
                href={`${href('/gendox/agent-home')}#/chat/${thread.threadId}`}
                title={thread.threadName}
              >
                {thread.threadName || 'Untitled chat'}
              </Link>
            ))}
          </div>
        ) : null
      )}
      <Link href={href('/gendox/conversations')} className='more'>
        <MessagesSquare className='lucide' />
        All conversations
      </Link>
    </div>
  )
}

const Sidebar = ({ page }) => {
  const { href } = useActiveScope()
  const [layout] = useHomeLayout()
  const agent = layout === 'agent'

  return (
    <aside className='sidebar'>
      <div className='side-head'>
        <Link className='brand' href={href(homePathOf(layout))}>
          <span className='mark'>G</span>
          Gendox
        </Link>
        {agent && <AgentSwitcher />}
      </div>
      <div className='side-nav'>
        {agent ? (
          <div>
            <div className='nav-label'>Agent</div>
            <nav className='nav'>
              {agentNavigation.map(({ id, title, icon: Icon, path }) => (
                <Link key={id} href={href(path)} className={id === page ? 'active' : ''}>
                  <Icon className='lucide' />
                  {title}
                </Link>
              ))}
            </nav>
          </div>
        ) : (
          navigation.map((group, index) => (
            <div key={group.label ?? index}>
              {group.label && <div className='nav-label'>{group.label}</div>}
              <nav className='nav'>
                {group.items.map(({ id, title, icon: Icon, path }) =>
                  path ? (
                    <Link key={id} href={href(path)} className={id === page ? 'active' : ''}>
                      <Icon className='lucide' />
                      {title}
                    </Link>
                  ) : (
                    <a key={id} className='soon' aria-disabled='true' title='Not in the new frontend yet'>
                      <Icon className='lucide' />
                      {title}
                    </a>
                  )
                )}
              </nav>
            </div>
          ))
        )}
      </div>
      {agent && <RecentChats />}
      <div className='side-foot'>
        <AccountMenu />
      </div>
    </aside>
  )
}

export default Sidebar
