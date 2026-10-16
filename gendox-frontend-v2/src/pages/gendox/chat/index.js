import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { Check, ChevronsUpDown, MessageSquareDashed, PanelLeft, Search, SquarePen } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import AppLayout from 'src/layouts/AppLayout'
import TopbarSlot from 'src/layouts/components/TopbarSlot'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import Chat from 'src/components/chat/Chat'
import ThreadMenu from 'src/components/chat/ThreadMenu'
import useChat from 'src/components/chat/useChat'
import { groupThreadsByDate, toPlainPreview } from 'src/components/chat/chatUtils'

// The full-page chat. Left: the user's own conversations with every agent of the organization, newest first.
const ChatPage = () => {
  const router = useRouter()
  const { threadId } = router.query
  const { projectId, href } = useActiveScope()
  const { token, newThread } = useChat()

  const { agents, threads } = useSelector(state => state.gendoxChat)
  const [filter, setFilter] = useState('')
  const [listOpen, setListOpen] = useState(false)

  const currentAgent = agents?.find(agent => agent.projectId === projectId)

  const groupedThreads = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const matching = (threads || []).filter(thread =>
      `${thread.threadName || ''} ${thread.latestMessageValue || ''}`.toLowerCase().includes(query)
    )

    return Object.entries(groupThreadsByDate(matching)).filter(([, items]) => items.length > 0)
  }, [threads, filter])

  const documentHref = source =>
    href('/gendox/document-instance', { documentId: source.documentId, sectionId: source.sectionId })

  const threadHref = thread =>
    href('/gendox/chat', { projectId: thread.agent?.projectId ?? projectId, threadId: thread.threadId })

  return (
    <main className={`chatpage ${listOpen ? 'list-open' : ''}`}>
      <TopbarSlot>
        <button
          className='btn ghost icon threads-btn'
          title='Conversations'
          onClick={e => {
            e.stopPropagation()
            setListOpen(open => !open)
          }}
        >
          <PanelLeft className='lucide' />
        </button>
      </TopbarSlot>

      <aside className='threads'>
        <div className='top'>
          <Menu
            trigger={({ onClick }) => (
              <button className='org' onClick={onClick}>
                <Avatar name={currentAgent?.fullName} seed={projectId} size='s' />
                <span className='trunc'>
                  {currentAgent?.fullName}
                  <small>Agent</small>
                </span>
                <ChevronsUpDown className='lucide' />
              </button>
            )}
          >
            <div className='h'>Chat with</div>
            {(agents || []).map(agent => (
              <Link key={agent.projectId} className='mi' href={href('/gendox/chat', { projectId: agent.projectId })}>
                <Avatar name={agent.fullName} seed={agent.projectId} size='s' />
                <span className='trunc' style={{ flex: 1 }}>
                  {agent.fullName}
                </span>
                {agent.projectId === projectId && <Check className='lucide' />}
              </Link>
            ))}
          </Menu>
          <button
            className='btn primary'
            onClick={() => {
              setListOpen(false)
              newThread()
            }}
          >
            <SquarePen className='lucide' />
            New chat
          </button>
          <label className='search' style={{ minWidth: 0, height: 32 }}>
            <Search className='lucide' />
            <input placeholder='Filter conversations' value={filter} onChange={e => setFilter(e.target.value)} />
          </label>
        </div>
        <div className='list'>
          {groupedThreads.length === 0 && threads && (
            <Empty
              icon={<MessageSquareDashed className='lucide' />}
              title='No conversations found'
              text='Only conversations with at least one answer are listed.'
            />
          )}
          {groupedThreads.map(([label, items]) => (
            <div key={label}>
              <div className='nav-label'>{label}</div>
              {items.map(thread => (
                <div
                  key={thread.threadId}
                  role='link'
                  tabIndex={0}
                  className={`th ${thread.threadId === threadId ? 'on' : ''}`}
                  title={new Date(thread.latestMessageCreatedAt).toLocaleString()}
                  onClick={() => {
                    setListOpen(false)
                    router.push(threadHref(thread))
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.target === e.currentTarget && router.push(threadHref(thread))}
                >
                  <b className='trunc'>{thread.threadName}</b>
                  <span className='faint sm trunc'>{toPlainPreview(thread.latestMessageValue) || thread.agent?.fullName}</span>
                  {/* the menu and its dialogs must not open the conversation */}
                  <span style={{ display: 'contents' }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                    <ThreadMenu thread={thread} onDeleted={deleted => deleted.threadId === threadId && newThread()} />
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <section onClick={() => listOpen && setListOpen(false)}>
        <Chat token={token} variant='page' documentHref={documentHref} onNewThread={newThread} />
      </section>
    </main>
  )
}

ChatPage.getLayout = page => (
  <AppLayout page='chat' title='Chat'>
    {page}
  </AppLayout>
)

ChatPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ChatPage
