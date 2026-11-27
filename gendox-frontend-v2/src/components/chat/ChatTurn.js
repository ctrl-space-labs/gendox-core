import { Fragment, useState } from 'react'
import {
  BookMarked,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  Lightbulb,
  RefreshCw,
  SquareTerminal,
  ThumbsDown,
  ThumbsUp,
  Wrench
} from 'lucide-react'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import { toolTitle } from 'src/utils/clientTools/approvalAnswers'
import Avatar from 'src/components/ui/Avatar'
import Markdown from 'src/components/chat/Markdown'
import { MentionText } from 'src/components/chat/mentions'
import ChatAttachments from 'src/components/chat/ChatAttachments'
import ToolCallDetails, { parseToolValue } from 'src/components/tools/ToolCallDetails'
import ArtifactCard from 'src/components/artifacts/ArtifactCard'
import WidgetCard from 'src/components/artifacts/WidgetCard'
import {
  artifactCallOf,
  isArtifactCall,
  isWidgetCall,
  recoveredFailuresOf,
  widgetCallOf
} from 'src/components/artifacts/artifactUtils'

const Trace = ({ icon: Icon, label, preview, open, className = '', children }) => (
  <details className={`gc-trace ${className}`} open={open}>
    <summary>
      <Icon className='lucide' aria-hidden='true' />
      <span className='trunc' title={label}>
        {label}
      </span>
      {preview && (
        <span className='trunc' title={preview}>
          · {preview}
        </span>
      )}
      <ChevronRight className='lucide' aria-hidden='true' />
    </summary>
    <div>{children}</div>
  </details>
)

// The tools of a stretch of the answer, grouped in one line that opens. Making or changing an artifact shows apart, as
// its line (gendox-core#523), and a widget as itself, part of the answer (gendox-core#570); a failed try that a later
// call made good (`recovered`) stays in the group. An error a widget raises offers Try to fix (onAsk), on the
// conversation's latest widget only (latestWidget).
const ToolCalls = ({ batches: allBatches, live, recovered = new Set(), onOpenArtifact, latestWidget, onAsk }) => {
  const showsApart = call => (isArtifactCall(call) || isWidgetCall(call)) && !recovered.has(call.id)
  const batches = allBatches.map(batch => ({ ...batch, calls: batch.calls.filter(({ call }) => !showsApart(call)) }))
  const apart = allBatches.flatMap(batch => batch.calls.filter(({ call }) => showsApart(call)))
  const calls = batches.flatMap(batch => batch.calls)
  const examples = [...new Set(calls.map(({ call }) => toolTitle(call.function?.name)))].slice(0, 3)
  const thoughts = batches.filter(({ header }) => header.reasoningContent && !header.message?.trim())

  return (
    <>
      {calls.length === 0 &&
        thoughts.map(({ header }, index) => (
          <Trace key={header.messageId || index} icon={Lightbulb} label='Show thinking'>
            <Markdown text={header.reasoningContent} className='gc-md muted' />
          </Trace>
        ))}
      {calls.length > 0 && (
        <Trace
          icon={Wrench}
          label={`${calls.length} tool ${calls.length === 1 ? 'call' : 'calls'}`}
          preview={examples.join(', ')}
          open={live}
          className='gc-tool-activity'
        >
          {batches.map(({ header, calls }, index) => (
            <Fragment key={header.messageId || index}>
              {header.reasoningContent && !header.message?.trim() && (
                <Trace icon={Lightbulb} label='Show thinking'>
                  <Markdown text={header.reasoningContent} className='gc-md muted' />
                </Trace>
              )}
              {calls.map(({ call, responses }) => {
                const { name, arguments: input } = call.function || {}
                const value = parseToolValue(input)
                let label = toolTitle(name)
                let icon = Wrench
                if (name === 'run_command') {
                  icon = SquareTerminal
                  if (typeof value?.description === 'string' && value.description.trim())
                    label = value.description.trim()
                }
                if (name === 'read_skill') {
                  icon = BookMarked
                  if (typeof value?.name === 'string' && value.name.trim()) label = `Read skill · ${value.name.trim()}`
                }

                return (
                  <Trace
                    key={call.id}
                    icon={icon}
                    label={label}
                    preview={!responses.length && (live ? 'Awaiting result' : 'No result recorded')}
                  >
                    <ToolCallDetails name={name} input={value} responses={responses} />
                  </Trace>
                )
              })}
            </Fragment>
          ))}
        </Trace>
      )}
      {apart.map(({ call, responses }) =>
        isWidgetCall(call) ? (
          <WidgetCard
            key={call.id}
            call={widgetCallOf(call, responses)}
            isLatest={call.id === latestWidget}
            onAsk={onAsk}
          />
        ) : (
          <ArtifactCard key={call.id} call={artifactCallOf(call, responses)} onOpen={onOpenArtifact} />
        )
      )}
    </>
  )
}

// A failed answer in plain words; the backend's code stays small, for support
const FAILURES = {
  MAX_MESSAGES_EXCEED: [
    'This month’s messages are used up',
    'The organization has used all the messages of its plan. An admin can upgrade in Plan & usage.'
  ],
  RATE_LIMIT_EXCEEDED: ['Too many questions at once', 'Please wait a few seconds and ask again.']
}

const Failure = ({ failed, onAskAgain }) => {
  const [title, text] =
    FAILURES[failed.code] ||
    (failed.message
      ? ['Something went wrong', failed.message]
      : ['The answer didn’t finish', 'The agent stopped before it answered. Try again in a moment.'])

  return (
    <div className='alert' style={{ '--c': 'var(--warn)' }}>
      <b>
        <CircleAlert className='lucide' />
        {title}
      </b>
      <span className='muted'>{text}</span>
      <div className='row' style={{ marginTop: 8 }}>
        {onAskAgain && (
          <button className='btn s' onClick={onAskAgain}>
            <RefreshCw className='lucide' />
            Try again
          </button>
        )}
        <span className='sp' />
        {failed.code && <span className='faint sm mono'>{failed.code}</span>}
      </div>
    </div>
  )
}

/**
 * 👍 / 👎 on an answer. Clicking the chosen one again takes it back; 👎 asks what was wrong, optionally.
 * @param onFeedback - (message, feedback 1 | -1 | null, comment) => void
 */
const Feedback = ({ message, onFeedback }) => {
  const [comment, setComment] = useState(null) // the comment being written after a 👎, or null

  const rate = value => {
    const next = message.feedback === value ? null : value
    onFeedback(message, next, null)
    setComment(next === -1 ? '' : null)
  }

  const sendComment = () => {
    if (comment.trim()) onFeedback(message, -1, comment.trim())
    setComment(null)
  }

  return (
    <>
      <button
        data-fb='up'
        className={`btn ghost s icon ${message.feedback === 1 ? 'on' : ''}`}
        title='Good answer'
        aria-pressed={message.feedback === 1}
        onClick={() => rate(1)}
      >
        <ThumbsUp className='lucide' />
      </button>
      <button
        data-fb='down'
        className={`btn ghost s icon ${message.feedback === -1 ? 'on' : ''}`}
        title='Bad answer'
        aria-pressed={message.feedback === -1}
        onClick={() => rate(-1)}
      >
        <ThumbsDown className='lucide' />
      </button>
      {comment !== null && (
        <form
          className='gc-feedback row'
          onSubmit={e => {
            e.preventDefault()
            sendComment()
          }}
        >
          <input
            className='input s'
            autoFocus
            maxLength={2000}
            placeholder='What was wrong? (optional)'
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setComment(null)}
          />
          <button className='btn s' type='submit'>
            Send
          </button>
        </form>
      )}
    </>
  )
}

const Answer = ({ message, showActions, canAskAgain, sourcesOpen, onSources, onAskAgain, onFeedback }) => {
  const [copied, setCopied] = useState(false)
  const hasText = Boolean(message.message && message.message.trim())

  const usedSources = Array.isArray(message.sections)
    ? message.sections.filter(section => section.isCompletionParticipant).length
    : 0

  const handleCopy = () => {
    copyToClipboard(message.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {message.reasoningContent && (
        <Trace icon={Lightbulb} label='Show thinking'>
          <Markdown text={message.reasoningContent} className='gc-md muted' />
        </Trace>
      )}
      {hasText && <Markdown text={message.message} />}
      {hasText && showActions && (
        <div className='gc-acts'>
          {onSources && (
            <button className={`srcbtn ${sourcesOpen ? 'on' : ''}`} onClick={onSources} style={{ paddingLeft: 10 }}>
              {usedSources > 0 ? `${usedSources} source${usedSources === 1 ? '' : 's'}` : 'Sources'}
              <ChevronRight className='lucide' />
            </button>
          )}
          <button className='btn ghost s icon' title='Copy' onClick={handleCopy}>
            {copied ? <Check className='lucide' /> : <Copy className='lucide' />}
          </button>
          {canAskAgain && (
            <button className='btn ghost s icon' title='Ask again' onClick={onAskAgain}>
              <RefreshCw className='lucide' />
            </button>
          )}
          {onFeedback && <Feedback message={message} onFeedback={onFeedback} />}
        </div>
      )}
    </>
  )
}

/**
 * One question and everything the agent did to answer it.
 * `children` is what is still happening in the last turn (searching, deep thinking).
 */
const ChatTurn = ({
  turn,
  agentName,
  agentSeed,
  threadId,
  token,
  activeSourcesMessageId,
  onSources,
  onOpenArtifact,
  latestWidget = null,
  onAskArtifactFix,
  onAskAgain,
  onFeedback,
  active = false,
  unfinished = false,
  children
}) => {
  const { question, items } = turn
  const sentAt = question?.createdAt ? new Date(question.createdAt).toLocaleString() : undefined
  // A turn that ended without an answer: it failed now, or it stopped before (seen after a reload)
  const hasAnswer = items.some(item => item.type === 'answer' && !item.beforeTools && item.message.message?.trim())
  const failed = !hasAnswer && !children && question ? question.failed || (unfinished && {}) : null
  const lastMessage = items[items.length - 1]?.message
  const streamingThought = lastMessage?.isStreaming && !lastMessage.message?.trim()
  const liveIndex = items.length - (streamingThought ? 2 : 1)
  const recovered = recoveredFailuresOf(items)

  return (
    <div className='gc-turn'>
      {question && (
        <div className='gc-user'>
          <ChatAttachments attachments={question.attachments} threadId={threadId} token={token} />
          {question.message && question.message.trim() && (
            <div className='bubble' title={sentAt} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              <MentionText text={question.message} />
            </div>
          )}
        </div>
      )}
      {(items.length > 0 || children || failed) && (
        <div className='gc-ai'>
          <div className='gc-who'>
            <Avatar name={agentName} seed={agentSeed} size='s' />
            {agentName}
          </div>
          {items.map((item, index) =>
            item.type === 'tools' ? (
              <ToolCalls
                key={item.batches[0].header.messageId || index}
                batches={item.batches}
                live={active && index === liveIndex}
                recovered={recovered}
                onOpenArtifact={onOpenArtifact}
                latestWidget={latestWidget}
                onAsk={onAskArtifactFix}
              />
            ) : (
              <Answer
                key={item.message.messageId || index}
                message={item.message}
                showActions={!item.beforeTools && !item.message.isStreaming && Boolean(item.message.messageId)}
                canAskAgain={Boolean(onAskAgain && question?.message)}
                sourcesOpen={activeSourcesMessageId === item.message.messageId}
                onSources={onSources && item.message.messageId ? () => onSources(item.message) : null}
                onAskAgain={() => onAskAgain(question.message)}
                onFeedback={onFeedback}
              />
            )
          )}
          {children}
          {failed && (
            <Failure
              failed={failed}
              onAskAgain={onAskAgain && question.message ? () => onAskAgain(question.message) : null}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ChatTurn
