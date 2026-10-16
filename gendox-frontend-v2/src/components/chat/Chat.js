import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, ChevronDown, FileUp, History, Plus, SquarePen, X } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import { useIFrameMessageManager } from 'src/authentication/context/IFrameMessageManagerContext'
import { MAIN_CHAT, chatActions, fetchMessageMetadata, selectChatSession, sendMessage } from 'src/store/chat/gendoxChat'
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
 * @param deep - the Deep thinking switch
 * @param sources - the sources button under each answer
 * @param documentHref - (source) => link to a document inside the app; without it, documents show as quotes
 * @param poweredBy - true | 'small'
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
  deep = true,
  sources = true,
  documentHref = null,
  footnote = 'Answers cite their sources. AI can make mistakes.',
  poweredBy = false,
  placeholder,
  prefill,
  onNewThread,
  onOpenThread,
  onClose,
  chatKey = MAIN_CHAT
}) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const auth = useAuth()
  const iFrameMessageManager = useIFrameMessageManager()
  const { organizationId, projectId } = router.query

  const threads = useSelector(state => state.gendoxChat.threads)
  const { currentThread, isSendingMessage, isLoadingMessages, isDeepThinking, currentMessageMetadata, isLoadingMetadata } =
    useSelector(state => selectChatSession(state, chatKey), shallowEqual)
  const { items: attachments, isUploading, isDeleting } = useSelector(
    state => selectChatAttachments(state, chatKey),
    shallowEqual
  )

  const [message, setMessage] = useState('')
  const [deepThinking, setDeepThinking] = useState(false)
  const [sourcesMessageId, setSourcesMessageId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const dragDepth = useRef(0)
  const attachmentsRef = useRef([])

  const agent = currentThread?.agent
  const agentName = agent?.fullName || ''
  const messages = currentThread?.messages
  const threadId = currentThread?.threadId

  const turns = useMemo(() => buildTurns(messages, auth.user?.id), [messages, auth.user?.id])
  const uploadedDocs = useMemo(
    () => attachments.filter(a => a.status === 'uploaded').map(a => a.uploadedDoc),
    [attachments]
  )

  const isBusy = isSendingMessage || isDeepThinking
  const isChatting = turns.length > 0 || isBusy
  const canSend =
    Boolean(agent) && !isBusy && !isUploading && !isDeleting && (message.trim() !== '' || uploadedDocs.length > 0)

  // a different thread starts clean
  useEffect(() => {
    dispatch(clearAll(chatKey))
    setDeepThinking(false)
    setSourcesMessageId(null)
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

  // keep the newest message in view
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller || isLoadingMessages) return
    const toBottom = () => scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'auto' })
    toBottom()
    const frame = requestAnimationFrame(toBottom)
    const timer = setTimeout(toBottom, 120)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [messages?.length, isLoadingMessages, isSendingMessage, isDeepThinking, threadId])

  const send = (text, docs) => {
    if (!agent || isBusy) return
    dispatch(
      sendMessage({
        user: auth.user,
        currentThread: {
          ...currentThread,
          deepThinking
        },
        message: text,
        uploadedDocs: docs,
        organizationId,
        iFrameMessageManager,
        token,
        chatKey
      })
    )
  }

  const handleSend = () => {
    if (!canSend) return
    send(message, uploadedDocs)
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
    dispatch(fetchMessageMetadata({ thread: currentThread, message: answer, token, chatKey }))
    setSourcesMessageId(answer.messageId)
  }

  const closeSources = () => {
    setSourcesMessageId(null)
    dispatch(chatActions.clearCurrentMessageMetadata(chatKey))
  }

  const startNewThread = () => {
    setDrawerOpen(false)
    closeSources()
    onNewThread?.()
    inputRef.current?.focus()
  }

  const groupedThreads = useMemo(() => groupThreadsByDate(threads || []), [threads])
  const lastTurnIndex = turns.length - 1

  // what is still happening, shown at the end of the last turn
  const progress = isDeepThinking ? (
    <ChatDeepThinking />
  ) : isSendingMessage ? (
    <div className='row faint sm'>
      {agentName ? `Searching ${agentName}’s knowledge` : 'Searching'}
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
      className={`gc gc-${variant} ${isChatting ? 'chatting' : ''} ${isDragging ? 'dragover' : ''}`}
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

      {isLoadingMessages ? (
        <div className='gc-loading'>
          <Spinner />
        </div>
      ) : (
        <div className='gc-scroll' ref={scrollRef}>
          {greeting && (
            <div className='gc-greet'>
              <Avatar name={agentName} seed={agent?.projectId} size='l' />
              <h1>
                {variant === 'widget'
                  ? agentName
                    ? `Hi, I’m ${agentName}`
                    : 'Hi'
                  : `Good ${greetingTime()}${auth.user?.firstName ? `, ${auth.user.firstName}` : ''}`}
              </h1>
              <p className='muted'>
                {variant === 'widget'
                  ? 'Ask me anything. I’ll show you where each answer comes from.'
                  : `Ask ${agentName || 'the agent'} anything. It answers from its documents and shows where each answer comes from.`}
              </p>
            </div>
          )}
          <div className='gc-thread'>
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
                onAskAgain={isBusy ? null : text => send(text, [])}
              >
                {index === lastTurnIndex ? progress : null}
              </ChatTurn>
            ))}
            {turns.length === 0 && progress && <div className='gc-ai'>{progress}</div>}
          </div>
        </div>
      )}

      <div className='gc-foot'>
        <ChatComposer
          inputRef={inputRef}
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          onPaste={handlePaste}
          disabled={!canSend}
          placeholder={placeholder || (variant === 'widget' || !agentName ? 'Ask a question…' : `Ask ${agentName}…`)}
          attachments={attachments}
          onPickFiles={attach ? addFiles : null}
          onRemoveAttachment={removeAttachment}
          deepThinking={deepThinking}
          onDeepThinkingToggle={deep ? () => setDeepThinking(on => !on) : null}
        />
        {footnote && <p className='gc-note'>{footnote}</p>}
        {poweredBy && (
          <a
            className={`gc-powered ${poweredBy === 'small' ? 'small' : ''}`}
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
