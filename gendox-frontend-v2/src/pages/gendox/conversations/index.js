import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { MessagesSquare, Search, SquarePen } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import { fetchThreads } from 'src/store/chat/gendoxChat'
import { localStorageConstants } from 'src/utils/generalConstants'
import { isValidOrganization } from 'src/utils/validators'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'
import Spinner from 'src/components/ui/Spinner'
import ThreadMenu from 'src/components/chat/ThreadMenu'
import { toPlainPreview } from 'src/components/chat/chatUtils'

const formatWhen = value => {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date().toDateString() === date.toDateString()

  return today
    ? `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

// The user's own conversations with every agent of the organization, newest first.
const ConversationsPage = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user } = useAuth()
  const { organization, organizationId, href } = useActiveScope()

  const { agents, threads, isLoadingAgentsAndThreads } = useSelector(state => state.gendoxChat)
  const [filter, setFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  useEffect(() => {
    if (!isValidOrganization(organizationId, user)) return
    const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
    dispatch(fetchThreads({ organizationId, token }))
  }, [dispatch, organizationId, user])

  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase()

    return (threads || []).filter(
      thread =>
        `${thread.threadName || ''} ${thread.latestMessageValue || ''}`.toLowerCase().includes(query) &&
        (!agentFilter || thread.agent?.projectId === agentFilter)
    )
  }, [threads, filter, agentFilter])

  const threadHref = thread =>
    `${href('/gendox/agent-home', { projectId: thread.agent?.projectId })}#/chat/${thread.threadId}`

  const isFiltering = Boolean(filter.trim() || agentFilter)

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Conversations</h1>
          <p>Your chats with every agent{organization ? ` in ${organization.name}` : ''}, newest first.</p>
        </div>
        <div className='actions'>
          <Link className='btn primary' href={`${href('/gendox/agent-home')}#/chat/new`}>
            <SquarePen className='lucide' />
            New chat
          </Link>
        </div>
      </div>

      <div className='card'>
        <div className='toolbar'>
          <label className='search' style={{ flex: 1 }}>
            <Search className='lucide' />
            <input
              placeholder='Filter by name or last message'
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </label>
          <select
            className='input'
            style={{ width: 200, height: 30 }}
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
          >
            <option value=''>All agents</option>
            {(agents || []).map(agent => (
              <option key={agent.projectId} value={agent.projectId}>
                {agent.fullName}
              </option>
            ))}
          </select>
        </div>

        {!threads && isLoadingAgentsAndThreads !== false ? (
          <div className='empty'>
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <Empty
            icon={<MessagesSquare className='lucide' />}
            title='No conversations'
            text={
              isFiltering
                ? 'Nothing matches this filter.'
                : 'Start a chat with any agent and it will show up here.'
            }
            action={
              <Link className='btn primary' href={`${href('/gendox/agent-home')}#/chat/new`}>
                New chat
              </Link>
            }
          />
        ) : (
          <div className='scroll'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Conversation</th>
                  <th>Agent</th>
                  <th>Last message</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(thread => (
                  <tr key={thread.threadId} onClick={() => router.push(threadHref(thread))}>
                    <td>
                      <div style={{ maxWidth: 420, minWidth: 0 }}>
                        <div className='trunc' style={{ fontWeight: 500 }}>
                          {thread.threadName}
                        </div>
                        <div className='faint sm trunc'>{toPlainPreview(thread.latestMessageValue)}</div>
                      </div>
                    </td>
                    <td>
                      {thread.agent && (
                        <span className='row' style={{ gap: 8 }}>
                          <Avatar name={thread.agent.fullName} seed={thread.agent.projectId} size='s' />
                          <span className='sm'>{thread.agent.fullName}</span>
                        </span>
                      )}
                    </td>
                    <td className='muted sm'>{formatWhen(thread.latestMessageCreatedAt)}</td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                      <ThreadMenu thread={thread} openHref={threadHref(thread)} className='' />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

ConversationsPage.getLayout = page => (
  <AppLayout page='conversations' title='Conversations'>
    {page}
  </AppLayout>
)

ConversationsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ConversationsPage
