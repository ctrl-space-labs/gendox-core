import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { AppWindow, BookOpen, Check, FileText, Layers, Library, ListChecks, MessageSquareText, PanelsTopLeft, RotateCcw, ScanText, Table2 } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import { useAuth } from 'src/authentication/useAuth'
import { chatActions } from 'src/store/chat/gendoxChat'
import { clearAll } from 'src/store/chatAttachments/chatAttachments'
import AppLayout, { useFocusedTab, useTopbarTitle } from 'src/layouts/AppLayout'
import TopbarSlot from 'src/layouts/components/TopbarSlot'
import Dock from 'src/components/dock/Dock'
import {
  DockActionsProvider,
  DockArtifact,
  DockArtifacts,
  DockChat,
  DockKnowledge,
  DockScreen,
  DockSources,
  DockTasks,
  artifactUrlOf,
  tabUrlOf
} from 'src/components/dock/dockViews'
import { takeChatOnArtifact } from 'src/components/artifacts/artifactUtils'
import DocumentView from 'src/views/DocumentView'
import DocumentInsightsView from 'src/views/DocumentInsightsView'
import DigitizationView from 'src/views/DigitizationView'
import Menu from 'src/components/ui/Menu'

/*
 * Every tab is a URL, routed to the same screen the page shows (src/views), never an iframe:
 *   /chat/new-<id>   a new chat             /chat/<threadId>   a conversation
 *   /gendox/knowledge · /gendox/tasks · /gendox/artifacts   compact lists
 *   /gendox/document-instance?documentId=&sectionId=
 *   /gendox/tasks/document-insights?taskId=&doc=&q=
 *   /gendox/tasks/document-digitization?taskId=&doc=
 *   /sources?threadId=&messageId=           the sources of one answer; one such tab per chat, reused for its next answer
 *   /artifact?threadId=&artifactId=         an artifact the agent made; one tab per artifact (gendox-core#523)
 * Earth observation is a workspace of its own windows, so it opens as a full page.
 */
const PAGES = {
  '/gendox/knowledge': { title: 'Knowledge', icon: Library, element: () => <DockKnowledge /> },
  '/gendox/tasks': { title: 'Tasks', icon: ListChecks, element: () => <DockTasks /> },
  '/gendox/artifacts': { title: 'Artifacts', icon: Layers, element: () => <DockArtifacts /> },
  '/gendox/document-instance': { title: 'Document', icon: FileText, element: () => <DocumentView />, screen: true },
  '/gendox/tasks/document-insights': { title: 'Document insights', icon: Table2, element: () => <DocumentInsightsView />, screen: true },
  '/gendox/tasks/document-digitization': { title: 'Digitization', icon: ScanText, element: () => <DigitizationView />, screen: true }
}

// tabs with no page of their own outside the dock
const DOCK_ONLY = {
  '/sources': { title: 'Sources', icon: BookOpen, element: () => <DockSources /> },
  '/artifact': { title: 'Artifact', icon: AppWindow, element: () => <DockArtifact /> }
}

// where a tab opens when it isn't open yet: beside windows holding similar tabs
const NEAR = {
  chat: ['/chat'],
  // sources open beside the chat, with the documents they lead to
  '/sources': ['/sources', '/gendox/document-instance', '/gendox/knowledge'],
  // an artifact needs room: it joins other artifacts, or the windows beside the chat
  '/artifact': ['/artifact', '/sources', '/gendox/document-instance', '/gendox/knowledge'],
  '/gendox/artifacts': ['/gendox/artifacts', '/gendox/knowledge', '/gendox/tasks'],
  '/gendox/document-instance': ['/gendox/document-instance', '/gendox/knowledge'],
  '/gendox/knowledge': ['/gendox/knowledge', '/gendox/document-instance'],
  '/gendox/tasks': ['/gendox/tasks'],
  // a task needs room: it joins other open tasks, or the chat's window (the largest)
  '/gendox/tasks/document-insights': ['/gendox/tasks/document-insights', '/gendox/tasks/document-digitization', '/chat'],
  '/gendox/tasks/document-digitization': ['/gendox/tasks/document-digitization', '/gendox/tasks/document-insights', '/chat']
}

const LAYOUT = {
  type: 'split',
  dir: 'row',
  sizes: [2.1, 1],
  children: [
    { type: 'group', tabs: ['/chat/new'], active: '/chat/new' },
    {
      type: 'split',
      dir: 'col',
      sizes: [1, 1.3],
      children: [
        { type: 'group', tabs: ['/gendox/tasks'], active: '/gendox/tasks' },
        { type: 'group', tabs: ['/gendox/knowledge'], active: '/gendox/knowledge' }
      ]
    }
  ]
}

const pathOf = url => url.split('?')[0]
const newChatUrl = () => `/chat/new-${Date.now().toString(36)}`
const linkedTab = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1))
  } catch {
    return ''
  }
}

/**
 * The agent home: the chat-first workspace of one agent, with Tasks, Knowledge, documents and task results as windows.
 * The address bar's #… is the focused tab, so a link opens that tab again.
 */
const AgentHomePage = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { projectId, href } = useActiveScope()
  const { user } = useAuth()
  const dockRef = useRef(null)
  const restoredProject = useRef(null)
  const prefills = useRef(new Map())
  const [title, setTitle] = useState('Chat')
  const [focusedUrl, setFocusedUrl] = useState(null)
  useTopbarTitle(title)
  useFocusedTab(focusedUrl)

  const route = useCallback(
    url => {
      const path = pathOf(url)
      if (path.startsWith('/chat/')) {
        const id = path.slice('/chat/'.length)
        if (!id) return null
        // a chat keeps its key after its URL becomes /chat/<threadId>, so it is not loaded again
        const chatKey = `dock:${url}`

        return {
          title: 'New chat',
          icon: MessageSquareText,
          element: <DockScreen><DockChat chatKey={chatKey} threadId={id === 'new' || id.startsWith('new-') ? null : id} /></DockScreen>,
          onClose: () => {
            dispatch(chatActions.removeChatSession(chatKey))
            dispatch(clearAll(chatKey))
          }
        }
      }
      const page = PAGES[path] ?? DOCK_ONLY[path]
      if (!page) return null

      return { title: page.title, icon: page.icon, element: <DockScreen>{page.element()}</DockScreen> }
    },
    [dispatch]
  )

  const canOpen = useCallback(href => {
    const url = tabUrlOf(href)

    return !!url && (pathOf(url).startsWith('/chat/') || !!PAGES[pathOf(url)] || !!DOCK_ONLY[pathOf(url)])
  }, [])

  const open = useCallback(
    target => {
      let url = tabUrlOf(target)
      if (!url) return
      if (url === '/chat/new') url = newChatUrl()
      const path = pathOf(url)
      if (!path.startsWith('/chat/') && !PAGES[path] && !DOCK_ONLY[path]) {
        router.push(target) // a page the dock can't show, e.g. Earth observation

        return
      }
      // one Sources tab per chat: the chat's next answer's sources replace the ones on screen, in the same place
      if (path === '/sources') {
        const threadId = new URLSearchParams(url.split('?')[1]).get('threadId')
        const shown = dockRef.current
          ?.urls()
          .find(u => pathOf(u) === '/sources' && u !== url && new URLSearchParams(u.split('?')[1]).get('threadId') === threadId)
        if (shown) dockRef.current.rename(shown, url)
      }
      dockRef.current?.open(url, { near: NEAR[path.startsWith('/chat/') ? 'chat' : path] ?? [] })
    },
    [router]
  )

  const actions = useMemo(
    () => ({
      open,
      canOpen,
      ask: text => {
        const url = newChatUrl()
        prefills.current.set(url, text)
        open(url)
      },
      // kept until the chat's first message, so a chat that moves to another window still has it
      prefillFor: url => prefills.current.get(url),
      forgetPrefill: url => prefills.current.delete(url)
    }),
    [open, canOpen]
  )

  // the agent changed: its windows start again. Each person's own: another who signs in on the same browser
  // does not find their conversations open
  const storageKey = `gx-dock-agent-${user?.id}-${projectId}`

  // A link to a tab can also arrive while the dock is open.
  useEffect(() => {
    // the windows show once the user is known, whose they are
    if (!router.isReady || !projectId || !user?.id) return
    const openHash = () => {
      let linked = linkedTab()
      if (!linked) return
      // #/chat/new is a command: name the new chat in the address bar first, so handling it twice opens one tab
      if (linked === '/chat/new') {
        linked = newChatUrl()
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${linked}`)
      }
      // a chat just opened on an artifact (Change it in a chat): the artifact beside it, and a request to change it
      const onArtifact = linked.startsWith('/chat/') ? takeChatOnArtifact(linked.slice('/chat/'.length)) : null
      if (onArtifact) prefills.current.set(linked, onArtifact.prefill)
      setTimeout(() => {
        open(linked)
        if (onArtifact) open(artifactUrlOf(null, onArtifact.artifactId, linked.slice('/chat/'.length)))
      }, 0)
    }
    router.events.on('hashChangeComplete', openHash)
    window.addEventListener('hashchange', openHash)

    return () => {
      router.events.off('hashChangeComplete', openHash)
      window.removeEventListener('hashchange', openHash)
    }
  }, [router.isReady, router.events, projectId, user?.id, open])

  const onFocus = useCallback((url, v) => {
    // The dock can open tabs as soon as it reports its first focus. Restore the incoming
    // link before the default tab changes the address bar.
    if (restoredProject.current !== projectId) {
      restoredProject.current = projectId
      const linked = linkedTab()
      if (linked && linked !== url && canOpen(linked)) {
        open(linked)
        return
      }
    }
    setTitle(v?.title ?? 'Chat')
    setFocusedUrl(url)
    const next = `${window.location.pathname}${window.location.search}#${url}`
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.history.replaceState(window.history.state, '', next)
    }
  }, [projectId, canOpen, open])

  if (!router.isReady || !projectId || !user?.id) return null

  return (
    <DockActionsProvider value={actions}>
      <TopbarSlot at='end'>
        <Menu
          align='right'
          width={260}
          trigger={({ onClick }) => (
            <button className='btn ghost icon' title='Layout' onClick={onClick}>
              <PanelsTopLeft className='lucide' />
            </button>
          )}
        >
          <div className='h'>Windows</div>
          {[
            ['/gendox/tasks', 'Tasks', ListChecks],
            ['/gendox/knowledge', 'Knowledge', Library],
            ['/gendox/artifacts', 'Artifacts', Layers]
          ].map(([url, name, Icon]) => (
            <button
              key={url}
              className='mi'
              data-close-menu
              onClick={() => (dockRef.current?.isOpen(url) ? dockRef.current.close(url) : open(url))}
            >
              <Icon className='lucide' />
              <span style={{ flex: 1 }}>{name}</span>
              {dockRef.current?.isOpen(url) && <Check className='lucide' />}
            </button>
          ))}
          <hr />
          <button className='mi' data-close-menu onClick={() => dockRef.current?.reset()}>
            <RotateCcw className='lucide' />
            Reset layout
          </button>
          <div className='faint sm' style={{ padding: '6px 10px 4px' }}>
            Drag a tab onto another window to group them, or to an edge to split. Every tab has its own link.
          </div>
        </Menu>
      </TopbarSlot>
      <Dock
        key={storageKey}
        ref={dockRef}
        storageKey={storageKey}
        layout={LAYOUT}
        route={route}
        blankUrl={newChatUrl}
        newTabs={[
          { label: 'New chat', icon: MessageSquareText, url: newChatUrl },
          { label: 'Tasks', icon: ListChecks, url: '/gendox/tasks' },
          { label: 'Knowledge', icon: Library, url: '/gendox/knowledge' },
          { label: 'Artifacts', icon: Layers, url: '/gendox/artifacts' }
        ]}
        onFocus={onFocus}
        fullHref={url => (PAGES[pathOf(url)] ? href(pathOf(url), Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''))) : null)}
      />
    </DockActionsProvider>
  )
}

AgentHomePage.getLayout = page => (
  <AppLayout page='chat' title='Chat'>
    {page}
  </AppLayout>
)

AgentHomePage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentHomePage
