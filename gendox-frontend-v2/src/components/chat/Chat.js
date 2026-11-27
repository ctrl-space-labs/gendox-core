import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, ChevronDown, FileUp, History, Plus, SquarePen, X } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import { useIFrameMessageManager } from 'src/authentication/context/IFrameMessageManagerContext'
import {
  ACTIVE_COMPLETION_STATUSES,
  MAIN_CHAT,
  chatActions,
  fetchMessageMetadata,
  recoverCompletion,
  selectChatSession,
  sendMessage,
  setMessageFeedback,
  submitClientToolResult
} from 'src/store/chat/gendoxChat'
import {
  enqueueFiles,
  uploadQueuedAttachments,
  removeLocalOnly,
  deleteUploadedAttachment,
  clearAll,
  selectChatAttachments
} from 'src/store/chatAttachments/chatAttachments'
import { ChatKeyContext } from 'src/components/chat/chatKey'
import {
  buildTurns,
  groupThreadsByDate,
  imageFilesFromPaste,
  toPlainPreview,
  withUniqueFileName
} from 'src/components/chat/chatUtils'
import Avatar from 'src/components/ui/Avatar'
import Spinner from 'src/components/ui/Spinner'
import ChatTurn from 'src/components/chat/ChatTurn'
import ChatComposer from 'src/components/chat/ChatComposer'
import ChatSources from 'src/components/chat/ChatSources'
import ChatDeepThinking from 'src/components/chat/ChatDeepThinking'
import ClientToolApprovals from 'src/components/client-tools/ClientToolApprovals'
import RunningCommands from 'src/components/client-tools/RunningCommands'
import useVisibleThread from 'src/hooks/useVisibleThread'
import ArtifactView from 'src/components/artifacts/ArtifactView'
import ChatArtifacts from 'src/components/artifacts/ChatArtifacts'
import { artifactsOf, latestVersionsOf, latestWidgetOf } from 'src/components/artifacts/artifactUtils'

const COMPLETION_POLL_MS = 2000

// #RRGGBB, or #RRGGBBAA with transparency
const HEX_COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/

// Dark text on a light accent, white on a dark one
const textOn = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1b1d31' : '#ffffff'
}

/**
 * The widget's look from the agent's chat settings: its theme, and its accent and background colours as theme tokens.
 * AUTO follows the visitor's device.
 */
const widgetLook = settings => {
  if (!settings) return {}
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const theme = { LIGHT: 'light', DARK: 'dark', AUTO: prefersDark ? 'dark' : 'light' }[settings.theme]
  const style = {}
  if (HEX_COLOR.test(settings.accentColor || '')) {
    style['--accent'] = settings.accentColor
    style['--accent-text'] = settings.accentColor
    style['--accent-soft'] = `color-mix(in srgb, ${settings.accentColor} 14%, transparent)`
    style['--btn-bg'] = settings.accentColor
    style['--accent-fg'] = textOn(settings.accentColor)
  }
  if (HEX_COLOR.test(settings.backgroundColor || '')) {
    style['--bg'] = settings.backgroundColor
    style['--side-bg'] = settings.backgroundColor
    style['--surface'] = settings.backgroundColor
  }

  return { theme, style }
}

const greetingTime = () => {
  const hour = new Date().getHours()

  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
}

/**
 * THE chat: one implementation for the page, the website widget and side panels.
 * Its layout follows the width of its container (container queries on .gc), not the page;
 * the props only switch features. Give its parent a height and it fills it.
 *
 * It shows the thread in the chat store; the page keeps that store in step with the URL through useChat().
 *
 * @param variant - 'page' | 'window' | 'widget' | 'panel' (density only)
 * @param header - agent header with history / new conversation / close (widget, panels)
 * @param threadsDrawer - a "Your conversations" drawer opened from the header
 * @param greeting - the empty state
 * @param attach - attach files and images
 * @param sources - the sources button under each answer
 * @param onOpenSources(threadId, answer) - where an answer's sources open instead of the sheet (the agent home: a tab)
 * @param onOpenArtifact(threadId, { artifactId, version }) - where an artifact opens instead of the sheet (the agent home: a tab)
 * @param documentHref - (source) => link to a document inside the app; without it, documents show as quotes
 * @param poweredBy - true | 'small'; the agent's branding can make it small or take it away
 * @param chatSettings - the look to show instead of the agent's saved one (Deploy's live preview)
 * @param prefill - text put in the message box, e.g. "In “Returns policy”, "; set again to put it back
 * @param onNewThread, onOpenThread(thread), onClose - what the header buttons and the drawer do
 * @param chatKey - which chat in the store this one shows (several can be on screen at once); see useChatSession
 */
const Chat = ({
  token,
  variant = 'page',
  header = false,
  threadsDrawer = false,
  greeting = true,
  attach = true,
  sources = true,
  onOpenSources,
  onOpenArtifact,
  documentHref = null,
  footnote = 'Answers cite their sources. AI can make mistakes.',
  poweredBy = false,
  chatSettings,
  placeholder,
  prefill,
  onNewThread,
  onOpenThread,
  onClose,
  mentions = false,
  chatKey = MAIN_CHAT
}) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const auth = useAuth()
  const iFrameMessageManager = useIFrameMessageManager()
  const { organizationId, projectId } = router.query

  const threads = useSelector(state => state.gendoxChat.threads)
  const {
    currentThread,
    isSendingMessage,
    isLoadingMessages,
    isDeepThinking,
    currentMessageMetadata,
    isLoadingMetadata,
    completionStatus,
    isStreaming
  } = useSelector(state => selectChatSession(state, chatKey), shallowEqual)
  const { items: attachments, isUploading, isDeleting } = useSelector(
    state => selectChatAttachments(state, chatKey),
    shallowEqual
  )

  const [message, setMessage] = useState('')
  const [sourcesMessageId, setSourcesMessageId] = useState(null)
  const [openArtifact, setOpenArtifact] = useState(null) // { artifactId, version } in the sheet
  const [artifactTitle, setArtifactTitle] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const scrollRef = useRef(null)
  const visibilityRef = useRef(null)
  const inputRef = useRef(null)
  const dragDepth = useRef(0)
  const attachmentsRef = useRef([])

  const agent = currentThread?.agent
  const agentName = agent?.fullName || ''
  const messages = currentThread?.messages
  const threadId = currentThread?.threadId
  useVisibleThread(threadId, visibilityRef)

  const turns = useMemo(() => buildTurns(messages, auth.user?.id), [messages, auth.user?.id])
  const artifactVersions = useMemo(() => latestVersionsOf(messages), [messages])
  const threadArtifacts = useMemo(() => artifactsOf(messages), [messages])
  const latestWidget = useMemo(() => latestWidgetOf(messages), [messages])
  const uploadedDocs = useMemo(
    () => attachments.filter(a => a.status === 'uploaded').map(a => a.uploadedDoc),
    [attachments]
  )

  // A turn that runs without a stream on this page (after a reload, or while it waits for tools) is followed by polling
  const followsTurnByPolling = !isStreaming && ACTIVE_COMPLETION_STATUSES.includes(completionStatus)

  // Only this page's own request blocks a new question. A turn followed by polling may have stopped on the server
  // (its status is guessed from the last message for 5 minutes), and a new question ends a turn that waits for tools.
  const isBusy = (isSendingMessage && !followsTurnByPolling) || isDeepThinking
  const isChatting = turns.length > 0 || isBusy
  const canSend =
    Boolean(agent) && !isBusy && !isUploading && !isDeleting && (message.trim() !== '' || uploadedDocs.length > 0)

  // a different thread starts clean
  useEffect(() => {
    dispatch(clearAll(chatKey))
    setSourcesMessageId(null)
    setOpenArtifact(null)
    setDrawerOpen(false)
  }, [threadId, projectId, chatKey, dispatch])

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    if (!prefill) return
    setMessage(prefill)
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(prefill.length, prefill.length)
  }, [prefill])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
    }
  }, [])

  const checkCompletion = () => {
    if (!currentThread?.threadId) return
    dispatch(
      recoverCompletion({
        threadId: currentThread.threadId,
        projectId: currentThread.projectId,
        organizationId: currentThread.organizationId,
        token,
        iFrameMessageManager,
        chatKey
      })
    )
  }

  // once per opened thread: a turn may still be running from before the page loaded
  useEffect(() => {
    checkCompletion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, chatKey])

  useEffect(() => {
    if (!threadId || !followsTurnByPolling) return
    const timer = setInterval(checkCompletion, COMPLETION_POLL_MS)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, followsTurnByPolling, chatKey])

  // the host page answers the client tools it ran; their results continue the turn
  useEffect(() => {
    const manager = iFrameMessageManager?.messageManager
    if (!manager || !currentThread?.projectId) return
    const handler = event => {
      if (event.type !== 'gendox.events.chat.message.tool_calls.response') return
      for (const result of event.payload || []) {
        if (result.threadId !== currentThread.threadId) continue
        dispatch(
          submitClientToolResult({
            result,
            token,
            projectId: currentThread.projectId,
            organizationId: currentThread.organizationId,
            iFrameMessageManager,
            chatKey
          })
        )
      }
    }
    manager.addHandler(handler)
    manager.sendMessage({ type: 'gendox.events.chat.message.tool_calls.ready', payload: { threadId: currentThread.threadId } })

    return () => manager.removeHandler(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentThread?.threadId, currentThread?.projectId, token, dispatch, iFrameMessageManager, chatKey])

  // Follow the conversation as it grows. Only the reader scrolling up stops it, and coming back to the bottom
  // (within 10px) resumes it: a scroll event that arrives after the content grew under a scroll to the bottom does not.
  const followRef = useRef(true)
  const lastScrollTopRef = useRef(0)
  const threadContentRef = useRef(null)
  const onScroll = event => {
    const scroller = event.currentTarget
    if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 10) followRef.current = true
    else if (scroller.scrollTop < lastScrollTopRef.current) followRef.current = false
    lastScrollTopRef.current = scroller.scrollTop
  }
  useEffect(() => {
    followRef.current = true
    lastScrollTopRef.current = 0
  }, [threadId])

  const scrollToEnd = () => {
    followRef.current = true
    const scroller = scrollRef.current
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }

  // a tool that waits for the user's approval is brought into view
  const approvalsWaiting = useSelector(
    state => state.toolApprovals.pending.filter(request => request.threadId === threadId).length
  )
  useEffect(() => {
    if (approvalsWaiting > 0) scrollToEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalsWaiting])

  useEffect(() => {
    const scroller = scrollRef.current
    const content = threadContentRef.current
    if (!scroller || !content) return
    const observer = new ResizeObserver(() => {
      if (followRef.current) scroller.scrollTop = scroller.scrollHeight
    })
    observer.observe(scroller)
    observer.observe(content)

    return () => observer.disconnect()
  }, [isLoadingMessages, threadId])

  const send = (text, docs) => {
    if (!agent || isBusy) return
    scrollToEnd()
    dispatch(
      sendMessage({
        user: auth.user,
        currentThread,
        message: text,
        uploadedDocs: docs,
        organizationId,
        iFrameMessageManager,
        token,
        chatKey
      })
    )
  }

  // the composer sends the text with its mentions as links
  const handleSend = (text = message) => {
    if (!canSend) return
    send(text, uploadedDocs)
    setMessage('')
    dispatch(clearAll(chatKey))
  }

  const addFiles = fileList => {
    const files = Array.from(fileList || []).map(withUniqueFileName)
    if (!files.length || !currentThread) return

    const newItems = files.map(file => {
      const isImage = file.type?.startsWith('image/')

      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
        file,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
        status: 'queued',
        error: null,
        uploadedDoc: null
      }
    })
    dispatch(enqueueFiles({ chatKey, items: newItems }))
    dispatch(uploadQueuedAttachments({ items: newItems, threadId, organizationId, projectId, token, chatKey }))
  }

  const removeAttachment = attachmentId => {
    const item = attachments.find(a => a.id === attachmentId)
    if (!item) return

    if (item.uploadedDoc?.documentId) {
      dispatch(
        deleteUploadedAttachment({
          attachmentId,
          documentId: item.uploadedDoc.documentId,
          organizationId,
          projectId,
          token,
          chatKey
        })
      )
    } else {
      dispatch(removeLocalOnly({ chatKey, id: attachmentId }))
    }
  }

  const handlePaste = e => {
    if (!attach) return
    const imageFiles = imageFilesFromPaste(e)
    if (imageFiles.length > 0) {
      e.preventDefault()
      addFiles(imageFiles)
    }
  }

  const dragHandlers = attach
    ? {
        onDragEnter: e => {
          e.preventDefault()
          dragDepth.current++
          setIsDragging(true)
        },
        onDragLeave: () => {
          if (--dragDepth.current <= 0) {
            dragDepth.current = 0
            setIsDragging(false)
          }
        },
        onDragOver: e => e.preventDefault(),
        onDrop: e => {
          e.preventDefault()
          dragDepth.current = 0
          setIsDragging(false)
          if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
        }
      }
    : {}

  const openSources = answer => {
    if (onOpenSources) return onOpenSources(threadId, answer)
    setOpenArtifact(null)
    dispatch(fetchMessageMetadata({ thread: currentThread, message: answer, token, chatKey }))
    setSourcesMessageId(answer.messageId)
  }

  const closeSources = () => {
    setSourcesMessageId(null)
    dispatch(chatActions.clearCurrentMessageMetadata(chatKey))
  }

  // one sheet at a time: an artifact replaces the sources
  const showArtifact = ref => {
    if (onOpenArtifact) return onOpenArtifact(threadId, ref)
    closeSources()
    setArtifactTitle('')
    setOpenArtifact(ref)
  }

  // An artifact the agent makes in this page's own turn opens beside the chat by itself (gendox-core#570); one
  // already in the conversation when it was opened never does.
  // A narrow chat has no room beside it: there the sheet would cover the answer, so it waits for Open.
  const knownArtifacts = useRef(null) // the artifacts this chat has seen, by id
  const showArtifactRef = useRef(showArtifact)
  showArtifactRef.current = showArtifact
  useEffect(() => {
    knownArtifacts.current = null
  }, [threadId])
  useEffect(() => {
    const ids = Object.keys(artifactVersions)
    if (knownArtifacts.current === null || !isSendingMessage) {
      knownArtifacts.current = new Set(ids)

      return
    }
    const made = ids.filter(id => !knownArtifacts.current.has(id))
    made.forEach(id => knownArtifacts.current.add(id))
    const toOpen = made.pop()
    const narrow = !onOpenArtifact && (scrollRef.current?.closest('.gc')?.clientWidth ?? 0) < 600
    if (toOpen && !narrow) showArtifactRef.current({ artifactId: toOpen, version: artifactVersions[toOpen] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactVersions, isSendingMessage])

  // the request goes to the composer; a narrow chat closes the sheet that covers it
  const askForChange = text => {
    if ((scrollRef.current?.closest('.gc')?.clientWidth ?? 0) < 600) setOpenArtifact(null)
    setMessage(text)
    const input = inputRef.current
    if (!input) return
    input.focus()
    setTimeout(() => input.setSelectionRange(text.length, text.length), 0)
  }

  const startNewThread = () => {
    setDrawerOpen(false)
    setOpenArtifact(null)
    closeSources()
    onNewThread?.()
    inputRef.current?.focus()
  }

  const groupedThreads = useMemo(() => groupThreadsByDate(threads || []), [threads])
  const lastTurnIndex = turns.length - 1
  const turnActive = isBusy || ACTIVE_COMPLETION_STATUSES.includes(completionStatus)

  // the agent's chat settings (#527): welcome message, suggested questions and disclaimer everywhere,
  // the theme and colours in the widget, and the "Powered by" line where the chat shows one
  const look = chatSettings !== undefined ? chatSettings : agent?.chatSettings
  const agentBranding = look?.branding
  const suggestions = (look?.suggestedQuestions || []).filter(Boolean)
  const note = look?.disclaimer || footnote
  const powered = poweredBy && agentBranding !== 'NONE' ? (agentBranding === 'SMALL' ? 'small' : poweredBy) : false
  const { theme, style } = variant === 'widget' ? widgetLook(look) : {}

  const handleFeedback = (answer, feedback, feedbackComment) =>
    dispatch(
      setMessageFeedback({
        messageId: answer.messageId,
        feedback,
        feedbackComment,
        previous: { feedback: answer.feedback ?? null, feedbackComment: answer.feedbackComment ?? null },
        token,
        chatKey
      })
    )

  // the answer being written: it shows itself, so no "Searching" under it
  const streamingAnswer = isStreaming && messages?.some(m => m.isStreaming && m.message?.trim())

  // what is still happening, shown at the end of the last turn
  const progress = isDeepThinking ? (
    <ChatDeepThinking />
  ) : isSendingMessage && !streamingAnswer ? (
    <div className='row faint sm'>
      {completionStatus === 'WAITING_FOR_TOOLS'
        ? 'Waiting for tool results'
        : agentName
          ? `Searching ${agentName}’s knowledge`
          : 'Searching'}
      <span className='typing'>
        <i />
        <i />
        <i />
      </span>
    </div>
  ) : null

  return (
    <ChatKeyContext.Provider value={chatKey}>
    <div
      ref={visibilityRef}
      className={`gc gc-${variant} ${isChatting ? 'chatting' : ''} ${isDragging ? 'dragover' : ''}`}
      data-theme={theme}
      style={style}
      {...dragHandlers}
    >
      {header && (
        <div className='gc-head'>
          <Avatar name={agentName} seed={agent?.projectId} size='s' />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b className='trunc' style={{ display: 'block' }}>
              {agentName}
            </b>
            {agent?.description && (
              <span className='faint sm trunc' style={{ display: 'block' }}>
                {agent.description}
              </span>
            )}
          </div>
          <ChatArtifacts artifacts={threadArtifacts} onOpen={threadId ? showArtifact : null} />
          {threadsDrawer && (
            <button
              className='btn ghost s icon'
              title='Your conversations'
              onClick={() => setDrawerOpen(open => !open)}
            >
              <History className='lucide' />
            </button>
          )}
          {onNewThread && (
            <button className='btn ghost s icon' title='New conversation' onClick={startNewThread}>
              <SquarePen className='lucide' />
            </button>
          )}
          {onClose && (
            <button className='btn ghost s icon' title='Close' onClick={onClose}>
              {variant === 'widget' ? <ChevronDown className='lucide' /> : <X className='lucide' />}
            </button>
          )}
        </div>
      )}

      {!header && threadId && threadArtifacts.length > 1 && (
        <div className='gc-arts-bar'>
          <ChatArtifacts artifacts={threadArtifacts} onOpen={threadId ? showArtifact : null} />
        </div>
      )}

      {isLoadingMessages ? (
        <div className='gc-loading'>
          <Spinner />
        </div>
      ) : (
        <div className='gc-scroll' ref={scrollRef} onScroll={onScroll}>
          {greeting && (
            <div className='gc-greet'>
              <Avatar name={agentName} seed={agent?.projectId} size='l' />
              <h1>
                {look?.welcomeMessage
                  ? look.welcomeMessage
                  : variant === 'widget'
                  ? agentName
                    ? `Hi, I’m ${agentName}`
                    : 'Hi'
                  : `Good ${greetingTime()}${auth.user?.firstName ? `, ${auth.user.firstName}` : ''}`}
              </h1>
              <p className='muted'>
                {variant === 'widget'
                  ? `${agent?.description ? `${agent.description} ` : ''}Ask me anything. I’ll show you where each answer comes from.`
                  : `Ask ${agentName || 'the agent'} anything. It answers from its documents and shows where each answer comes from.`}
              </p>
            </div>
          )}
          <div className='gc-thread' ref={threadContentRef}>
            {turns.map((turn, index) => (
              <ChatTurn
                key={turn.key}
                turn={turn}
                agentName={agentName}
                agentSeed={agent?.projectId}
                threadId={threadId}
                token={token}
                activeSourcesMessageId={sourcesMessageId}
                onSources={sources ? openSources : null}
                onOpenArtifact={threadId ? showArtifact : null}
                latestWidget={latestWidget}
                onAskArtifactFix={askForChange}
                onAskAgain={isBusy ? null : text => send(text, [])}
                onFeedback={handleFeedback}
                active={index === lastTurnIndex && turnActive}
                unfinished={index === lastTurnIndex && Boolean(completionStatus) && !turnActive}
              >
                {index === lastTurnIndex ? progress : null}
              </ChatTurn>
            ))}
            <ClientToolApprovals threadId={threadId} />
            <RunningCommands threadId={threadId} />
            {turns.length === 0 && progress && <div className='gc-ai'>{progress}</div>}
          </div>
        </div>
      )}

      <div className='gc-foot'>
        {greeting && suggestions.length > 0 && (
          <div className='gc-suggest'>
            {suggestions.map(question => (
              <button key={question} type='button' disabled={!agent || isBusy} onClick={() => send(question, [])}>
                {question}
              </button>
            ))}
          </div>
        )}
        <ChatComposer
          inputRef={inputRef}
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          mentions={mentions}
          onPaste={handlePaste}
          disabled={!canSend}
          placeholder={placeholder || (variant === 'widget' || !agentName ? 'Ask a question…' : `Ask ${agentName}…`)}
          attachments={attachments}
          onPickFiles={attach ? addFiles : null}
          onRemoveAttachment={removeAttachment}
          replacesWaitingTurn={completionStatus === 'WAITING_FOR_TOOLS' && canSend}
        />
        {note && <p className='gc-note'>{note}</p>}
        {powered && (
          <a
            className={`gc-powered ${powered === 'small' ? 'small' : ''}`}
            href='https://gendox.dev'
            target='_blank'
            rel='noreferrer'
          >
            Powered by <span className='mark'>G</span>Gendox
          </a>
        )}
      </div>

      {sourcesMessageId && (
        <aside className='gc-sheet'>
          <div className='gc-sheet-h'>
            <button className='btn ghost s icon' data-act='unsheet' title='Back' onClick={closeSources}>
              <ArrowLeft className='lucide' />
            </button>
            <b style={{ flex: 1 }}>Sources</b>
            <button className='btn ghost s icon' data-act='unsheet' title='Close' onClick={closeSources}>
              <X className='lucide' />
            </button>
          </div>
          <div className='gc-sheet-b'>
            <ChatSources
              isLoading={isLoadingMetadata}
              metadata={currentMessageMetadata?.metadata}
              documentHref={documentHref}
            />
          </div>
        </aside>
      )}

      {openArtifact && threadId && (
        <aside className='gc-sheet wide'>
          <div className='gc-sheet-h'>
            <button className='btn ghost s icon' data-act='unsheet' title='Back' onClick={() => setOpenArtifact(null)}>
              <ArrowLeft className='lucide' />
            </button>
            <b className='trunc' style={{ flex: 1, paddingLeft: 6 }}>
              {artifactTitle || 'Artifact'}
            </b>
            <button className='btn ghost s icon' data-act='unsheet' title='Close' onClick={() => setOpenArtifact(null)}>
              <X className='lucide' />
            </button>
          </div>
          <div className='gc-sheet-b'>
            <ArtifactView
              threadId={threadId}
              artifactId={openArtifact.artifactId}
              version={openArtifact.version}
              knownVersion={artifactVersions[openArtifact.artifactId]}
              token={token}
              agentName={agentName}
              onAsk={askForChange}
              onTitle={setArtifactTitle}
            />
          </div>
        </aside>
      )}

      {threadsDrawer && drawerOpen && (
        <aside className='gc-drawer'>
          <div className='gc-sheet-h'>
            <b style={{ flex: 1, paddingLeft: 6 }}>Your conversations</b>
            <button className='btn ghost s icon' title='Close' onClick={() => setDrawerOpen(false)}>
              <X className='lucide' />
            </button>
          </div>
          <div className='gc-sheet-b'>
            <button className='btn s' style={{ width: '100%', marginBottom: 10 }} onClick={startNewThread}>
              <Plus className='lucide' />
              New conversation
            </button>
            {Object.entries(groupedThreads).map(([label, items]) =>
              items.length === 0 ? null : (
                <div key={label}>
                  <div className='label' style={{ marginTop: 8 }}>
                    {label}
                  </div>
                  {items.map(thread => (
                    <button
                      key={thread.threadId}
                      className='gc-th'
                      onClick={() => {
                        setDrawerOpen(false)
                        onOpenThread?.(thread)
                      }}
                    >
                      <b className='trunc'>{thread.threadName}</b>
                      {thread.latestMessageValue && (
                        <span className='faint sm trunc'>{toPlainPreview(thread.latestMessageValue)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </aside>
      )}

      <div className='gc-drop'>
        <FileUp className='lucide' />
        Drop files to attach
      </div>
    </div>
    </ChatKeyContext.Provider>
  )
}

export default Chat
