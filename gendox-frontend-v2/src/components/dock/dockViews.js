import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { shallowEqual, useSelector } from 'react-redux'
import { ArrowUpRight, LoaderCircle, Plus, Search, Upload } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import documentService from 'src/gendox-sdk/documentService'
import taskService from 'src/gendox-sdk/taskService'
import chatThreadService from 'src/gendox-sdk/chatThreadService'
import { selectChatSession } from 'src/store/chat/gendoxChat'
import { getToken } from 'src/components/agent/useAgent'
import Chat from 'src/components/chat/Chat'
import ChatSources from 'src/components/chat/ChatSources'
import ArtifactView from 'src/components/artifacts/ArtifactView'
import { kindInfo, kindOf, latestVersionsOf } from 'src/components/artifacts/artifactUtils'
import useProjectArtifacts from 'src/components/artifacts/useProjectArtifacts'
import { useChatSession } from 'src/components/chat/useChat'
import { fileNameOf, formatDateTime, timeAgo } from 'src/components/knowledge/documentUtils'
import UploadDialog, { openOnFileDrag } from 'src/components/knowledge/UploadDialog'
import FileTile from 'src/components/ui/FileTile'
import { TaskFormDialog } from 'src/components/tasks/TaskDialogs'
import { TaskTile, typeOfTask } from 'src/components/tasks/taskUtils'
import { ViewProvider, useView } from 'src/views/ViewContext'
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

// a chat's name: its thread's, else its first question (threads are named "Chat Thread" until someone renames them)
const chatTitleOf = currentThread => {
  // the optimistic first message has no role yet
  const firstQuestion = currentThread?.messages?.find(m => !m.role || m.role.toUpperCase() === 'USER')?.message
  const named = currentThread?.thread?.threadName

  return ((named && named !== 'Chat Thread' ? named : firstQuestion) || '').replace(/\s+/g, ' ').trim()
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

  const title = chatTitleOf(currentThread) || 'New chat'
  useEffect(() => {
    tab.setTitle(short(title))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  return (
    <Chat
      token={token}
      chatKey={chatKey}
      variant='window'
      mentions
      prefill={prefill}
      onOpenSources={(threadId, answer) => actions.open(sourcesUrlOf(threadId, answer.messageId))}
      onOpenArtifact={(threadId, ref) => actions.open(artifactUrlOf(threadId, ref.artifactId))}
    />
  )
}

export const sourcesUrlOf = (threadId, messageId) => `/sources?${new URLSearchParams({ threadId, messageId })}`

// one tab per artifact, always at its latest version; older ones are in the tab's version list. Without a thread it
// loads by its id (an artifact shared with the user, gendox-core#570); besideChat names the chat opened on it
export const artifactUrlOf = (threadId, artifactId, besideChat) =>
  `/artifact?${new URLSearchParams(threadId ? { threadId, artifactId } : { artifactId, ...(besideChat ? { besideChat } : {}) })}`

/**
 * An artifact in a tab of its own (gendox-core#523), named after it. A newer version made in an open chat
 * moves it to that version, unless an older one was chosen.
 */
export const DockArtifact = () => {
  const tab = useDockTab()
  const { query } = useView()
  const { threadId, artifactId, besideChat } = query
  const sessions = useSelector(state => state.gendoxChat.sessions)
  // its own chat; opened by its id, any open chat that changes it (a chat opened on it, gendox-core#570)
  const session = Object.values(sessions).find(s => threadId && s.currentThread?.threadId === threadId)
  const knownVersion = useMemo(
    () =>
      Math.max(
        0,
        ...Object.values(sessions)
          .filter(s => !threadId || s.currentThread?.threadId === threadId)
          .map(s => latestVersionsOf(s.currentThread?.messages)[artifactId] || 0)
      ) || undefined,
    [sessions, threadId, artifactId]
  )

  return (
    <div className='vw in-dock'>
      <div className='gc-sheet-b' style={{ display: 'flex', flexDirection: 'column' }}>
        <ArtifactView
          threadId={threadId}
          artifactId={artifactId}
          knownVersion={knownVersion}
          token={getToken()}
          agentName={session?.currentThread?.agent?.fullName}
          onTitle={title => tab.setTitle(short(title))}
          besideItsChat={Boolean(besideChat)}
        />
      </div>
    </div>
  )
}

/**
 * The artifacts of the user's conversations with this agent in a window (gendox-core#523): a thin search and one-line
 * rows. A row opens the artifact in its tab; the full page has the kind filter.
 */
export const DockArtifacts = () => {
  const tab = useDockTab()
  const actions = useDockActions()
  const { organizationId, projectId, href } = useActiveScope()
  const [query, setQuery] = useState('')
  const { artifacts, total } = useProjectArtifacts({ organizationId, projectId, search: query, size: 60 })

  useEffect(() => {
    if (!query && artifacts) tab.setCount(total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifacts])

  return (
    <div className='vw in-dock compact'>
      <div className='dk-top'>
        <label className='dk-search'>
          <Search className='lucide' />
          <input placeholder='Find an artifact' value={query} onChange={e => setQuery(e.target.value)} />
        </label>
      </div>
      <div className='dk-list'>
        {artifacts === null ? (
          <div className='dk-empty'>
            <LoaderCircle className='lucide turning' />
          </div>
        ) : artifacts.length === 0 ? (
          <div className='dk-empty'>{query ? `Nothing matches “${query}”.` : 'No artifacts yet. Ask for one in a chat.'}</div>
        ) : (
          artifacts.map(artifact => {
            const { icon: Icon, hue } = kindInfo(kindOf(artifact))

            return (
              <button
                key={artifact.id}
                className='dk-row'
                title={`${artifact.title} · in ${artifact.threadName || 'a conversation'}`}
                onClick={() => actions.open(artifactUrlOf(artifact.threadId, artifact.id))}
              >
                <span className='ftype dk-ic' style={{ '--h': hue }}>
                  <Icon className='lucide' />
                </span>
                <span className='trunc'>{artifact.title}</span>
                <span className='dk-meta' title={formatDateTime(artifact.updatedAt)}>
                  {timeAgo(artifact.updatedAt)}
                </span>
              </button>
            )
          })
        )}
        {artifacts && total > artifacts.length && (
          <a className='dk-row' href={href('/gendox/artifacts')} data-full=''>
            <ArrowUpRight className='lucide' />
            <span className='trunc'>All {total} artifacts</span>
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * The sources of one answer in a tab of their own, beside the chat; a document opens in a tab at the passage.
 * Each chat has one, reused for its next answer's sources, and named after the chat.
 */
export const DockSources = () => {
  const tab = useDockTab()
  const { query } = useView()
  const { href } = useActiveScope()
  const { threadId, messageId } = query
  const [metadata, setMetadata] = useState(null)
  const chatTitle = useSelector(state =>
    chatTitleOf(Object.values(state.gendoxChat.sessions).find(s => s.currentThread?.threadId === threadId)?.currentThread)
  )

  useEffect(() => {
    tab.setTitle(chatTitle ? short(`Sources · ${chatTitle}`) : 'Sources')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTitle])

  // the tab is reused for the next answer's sources, so it loads again when its URL changes
  useEffect(() => {
    if (!threadId || !messageId) return
    let current = true
    setMetadata(null)
    chatThreadService
      .getThreadMessageMetadataByMessageId(threadId, messageId, getToken())
      .then(response => current && setMetadata(response.data))
      .catch(() => current && setMetadata([]))

    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, messageId])

  return (
    <div className='vw in-dock'>
      <div className='gc-sheet-b'>
        <ChatSources
          isLoading={metadata === null}
          metadata={metadata}
          sameTab
          documentHref={source => href('/gendox/document-instance', { documentId: source.documentId, sectionId: source.sectionId })}
        />
      </div>
    </div>
  )
}

/** Knowledge in a window: a thin search and one-line rows; the full page has the rest */
export const DockKnowledge = () => {
  const tab = useDockTab()
  const { organizationId, projectId, project, href } = useActiveScope()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)

  // ?upload=1 (the new-agent wizard): open the upload once, and drop it from the address so a reload doesn't
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('upload') !== '1') return
    url.searchParams.delete('upload')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    setUploading(true)
  }, [])

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
    <div className='vw in-dock compact' {...openOnFileDrag(() => setUploading(true))}>
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
