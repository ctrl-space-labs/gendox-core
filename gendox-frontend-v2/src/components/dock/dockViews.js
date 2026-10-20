import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { shallowEqual, useSelector } from 'react-redux'
import { ArrowUpRight, LoaderCircle, Plus, Search, Upload } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import documentService from 'src/gendox-sdk/documentService'
import taskService from 'src/gendox-sdk/taskService'
import { selectChatSession } from 'src/store/chat/gendoxChat'
import { getToken } from 'src/components/agent/useAgent'
import Chat from 'src/components/chat/Chat'
import { useChatSession } from 'src/components/chat/useChat'
import { fileNameOf, formatDateTime, timeAgo } from 'src/components/knowledge/documentUtils'
import UploadDialog from 'src/components/knowledge/UploadDialog'
import FileTile from 'src/components/ui/FileTile'
import { TaskFormDialog } from 'src/components/tasks/TaskDialogs'
import { TaskTile, typeOfTask } from 'src/components/tasks/taskUtils'
import { ViewProvider } from 'src/views/ViewContext'
import { useDockTab } from 'src/components/dock/Dock'

/**
 * What the agent home gives its tabs: open(href) opens or focuses a tab (or leaves for a page the dock can't show),
 * ask(text) starts a chat tab with that text, prefillFor(url) is the text a new chat tab starts with.
 */
const DockActionsContext = createContext(null)
export const DockActionsProvider = DockActionsContext.Provider
export const useDockActions = () => useContext(DockActionsContext)

// tabs hold app paths without the organization and agent, e.g. /gendox/document-instance?documentId=…
const SCOPE = ['organizationId', 'projectId']

export const tabUrlOf = href => {
  try {
    const u = new URL(href, 'http://x')
    const path = u.pathname.replace(/\/+$/, '') || '/'
    SCOPE.forEach(k => u.searchParams.delete(k))
    const query = u.searchParams.toString()

    return `${path}${query ? '?' + query : ''}`
  } catch {
    return null
  }
}

const queryOf = url => Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''))

const short = (text, n = 32) => (text.length > n ? text.slice(0, n - 1) + '…' : text)

/**
 * A screen inside a tab: its parameters are the tab's URL, `set` changes that URL, and a link to a screen the dock
 * can show opens as a tab instead of leaving the page (links with target or data-full still leave).
 */
export const DockScreen = ({ children }) => {
  const tab = useDockTab()
  const actions = useDockActions()
  const router = useRouter()

  const value = useMemo(() => {
    const path = tab.url.split('?')[0]

    return {
      mode: 'dock',
      ready: true,
      query: { organizationId: router.query.organizationId, projectId: router.query.projectId, ...queryOf(tab.url) },
      set: changes => {
        const params = new URLSearchParams(tab.url.split('?')[1] || '')
        Object.entries(changes).forEach(([k, v]) => (v == null || v === '' ? params.delete(k) : params.set(k, v)))
        const query = params.toString()
        tab.rename(`${path}${query ? '?' + query : ''}`)
      },
      open: href => actions.open(href),
      ask: text => actions.ask(text),
      setTitle: text => tab.setTitle(short(text))
    }
  }, [tab, actions, router.query.organizationId, router.query.projectId])

  const onClickCapture = e => {
    const a = e.target.closest('a[href]')
    if (!a || a.target || a.hasAttribute('data-full') || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return
    const href = a.getAttribute('href')
    if (!actions.canOpen(href)) return
    e.preventDefault()
    actions.open(href)
  }

  return (
    <ViewProvider value={value}>
      <div className='dock-screen' onClickCapture={onClickCapture}>
        {children}
      </div>
    </ViewProvider>
  )
}

/** A chat tab: its own chat in the store (chatKey), named after the thread or its first question */
export const DockChat = ({ chatKey, threadId }) => {
  const tab = useDockTab()
  const actions = useDockActions()
  const { organizationId, projectId, href } = useActiveScope()
  const [prefill] = useState(() => actions.prefillFor(tab.url))
  const { currentThread } = useSelector(state => selectChatSession(state, chatKey), shallowEqual)

  const { token } = useChatSession({
    chatKey,
    organizationId,
    projectId,
    threadId,
    onThreadCreated: id => {
      actions.forgetPrefill(tab.url)
      tab.rename(`/chat/${id}`)
    }
  })

  // the optimistic first message has no role yet
  const firstQuestion = currentThread?.messages?.find(m => !m.role || m.role.toUpperCase() === 'USER')?.message
  // threads are named "Chat Thread" until someone renames them; the first question says more
  const named = currentThread?.thread?.threadName
  const title = (named && named !== 'Chat Thread' ? named : firstQuestion) || 'New chat'
  useEffect(() => {
    tab.setTitle(short(title.replace(/\s+/g, ' ').trim() || 'New chat'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  return (
    <Chat
      token={token}
      chatKey={chatKey}
      variant='window'
      prefill={prefill}
      documentHref={source => href('/gendox/document-instance', { documentId: source.documentId, sectionId: source.sectionId })}
    />
  )
}

/** Knowledge in a window: a thin search and one-line rows; the full page has the rest */
export const DockKnowledge = () => {
  const tab = useDockTab()
  const { organizationId, projectId, project, href } = useActiveScope()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)

  const load = () =>
    documentService
      .getDocuments(organizationId, projectId, { organizationId, projectId, ...(query.trim() ? { documentNameContains: query.trim() } : {}) }, getToken(), 0, 60)
      .then(response => setResult(response.data))
      .catch(() => setResult({ content: [], totalElements: 0 }))

  useEffect(() => {
    if (!organizationId || !projectId) return
    const timer = setTimeout(load, query ? 250 : 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, projectId, query])

  useEffect(() => {
    if (!query && result) tab.setCount(result.totalElements)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const docs = result?.content ?? []

  return (
    <div className='vw in-dock compact'>
      <div className='dk-top'>
        <label className='dk-search'>
          <Search className='lucide' />
          <input placeholder='Find a document' value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <button className='btn ghost s icon' title='Upload files' onClick={() => setUploading(true)}>
          <Upload className='lucide' />
        </button>
      </div>
      <div className='dk-list'>
        {result && docs.length === 0 && <div className='dk-empty'>{query ? `Nothing matches “${query}”.` : 'No documents yet.'}</div>}
        {docs.map(doc => (
          <a key={doc.id} className='dk-row' href={href('/gendox/document-instance', { documentId: doc.id })} title={doc.title}>
            <FileTile name={fileNameOf(doc)} className='dk-ic' />
            <span className='trunc'>{doc.title || fileNameOf(doc)}</span>
            <span className='dk-meta' title={formatDateTime(doc.updateAt ?? doc.updatedAt ?? doc.createAt)}>
              {timeAgo(doc.updateAt ?? doc.updatedAt ?? doc.createAt)}
            </span>
          </a>
        ))}
        {result && result.totalElements > docs.length && (
          <a className='dk-row' href={href('/gendox/knowledge')} data-full=''>
            <ArrowUpRight className='lucide' />
            <span className='trunc'>All {result.totalElements} documents</span>
          </a>
        )}
      </div>
      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        organizationId={organizationId}
        projectId={projectId}
        agentName={project?.name}
        autoTraining={project?.autoTraining}
        onUploaded={load}
      />
    </div>
  )
}

/** Tasks in a window: a thin search and one-line rows. Earth observation is a workspace of its own and leaves the dock. */
export const DockTasks = () => {
  const tab = useDockTab()
  const actions = useDockActions()
  const { organizationId, projectId, href } = useActiveScope()
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = () =>
    taskService
      .getTasks(organizationId, projectId, getToken(), { size: 100, taskNameContains: query.trim() || undefined })
      .then(response => {
        setTasks(response.data?.content ?? [])
        if (!query) tab.setCount(response.data?.totalElements ?? 0)
      })
      .catch(() => setTasks([]))

  useEffect(() => {
    if (!organizationId || !projectId) return
    const timer = setTimeout(load, query ? 250 : 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, projectId, query])

  return (
    <div className='vw in-dock compact'>
      <div className='dk-top'>
        <label className='dk-search'>
          <Search className='lucide' />
          <input placeholder='Find a task' value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <button className='btn ghost s icon' title='New task' onClick={() => setCreating(true)}>
          <Plus className='lucide' />
        </button>
      </div>
      <div className='dk-list'>
        {tasks === null ? (
          <div className='dk-empty'>
            <LoaderCircle className='lucide turning' />
          </div>
        ) : tasks.length === 0 ? (
          <div className='dk-empty'>{query ? `Nothing matches “${query}”.` : 'No tasks yet.'}</div>
        ) : (
          tasks.map(task => {
            const t = typeOfTask(task)
            const full = !actions.canOpen(t.path ?? '')

            return (
              <a
                key={task.id}
                className='dk-row'
                href={t.path ? href(t.path, { taskId: task.id }) : '#'}
                {...(full ? { 'data-full': '' } : {})}
                title={task.title}
              >
                <TaskTile task={task} className='dk-ic' />
                <span className='trunc'>{task.title}</span>
                <span className='dk-meta'>{full ? <ArrowUpRight className='lucide' /> : t.title}</span>
              </a>
            )
          })
        )}
      </div>
      <TaskFormDialog
        open={creating}
        organizationId={organizationId}
        projectId={projectId}
        onClose={() => setCreating(false)}
        onSaved={saved => {
          load()
          const path = typeOfTask(saved).path
          if (saved?.id && path) actions.open(href(path, { taskId: saved.id }))
        }}
      />
    </div>
  )
}
