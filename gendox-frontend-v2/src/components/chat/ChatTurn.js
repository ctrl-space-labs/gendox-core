import { useState } from 'react'
import { BookMarked, Check, ChevronRight, CircleAlert, Copy, Lightbulb, RefreshCw, Wrench } from 'lucide-react'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import Avatar from 'src/components/ui/Avatar'
import Markdown from 'src/components/chat/Markdown'
import ChatAttachments from 'src/components/chat/ChatAttachments'

const Trace = ({ icon: Icon, label, children }) => {
  return (
    <details className='gc-trace'>
      <summary>
        <Icon className='lucide' />
        {label}
        <ChevronRight className='lucide' />
      </summary>
      <div>{children}</div>
    </details>
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
  const [title, text] = FAILURES[failed.code] ||
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

const skillNameOf = call => {
  try {
    const args =
      typeof call.function?.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function?.arguments

    return args?.name || ''
  } catch (_) {
    return ''
  }
}

// The tools one assistant message called, with their arguments and what each returned.
// Reading a skill shows as its own line: the skill's instructions are not worth showing as a tool result.
const ToolCalls = ({ header, responses }) => {
  const allCalls = header.toolCalls || []
  const skillCalls = allCalls.filter(call => call.function?.name === 'read_skill')
  const calls = allCalls.filter(call => call.function?.name !== 'read_skill')

  return (
    <>
      {header.reasoningContent && (
        <Trace icon={Lightbulb} label='Show thinking'>
          <Markdown text={header.reasoningContent} className='gc-md muted' />
        </Trace>
      )}
      {skillCalls.map(call => (
        <Trace key={call.id} icon={BookMarked} label={`Read skill: ${skillNameOf(call)}`}>
          <p className='muted'>
            The question matched the skill’s description, so the agent read its instructions before answering.
          </p>
        </Trace>
      ))}
      {calls.length > 0 && (
        <Trace icon={Wrench} label={`Used ${calls.map(call => call.function?.name).join(', ')}`}>
          {calls.map(call => (
            <div key={call.id}>
              <div className='mono sm' style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                <span className='faint'>↳ args</span>{' '}
                {typeof call.function?.arguments === 'string'
                  ? call.function.arguments
                  : JSON.stringify(call.function?.arguments, null, 2)}
              </div>
              {responses
                .filter(response => response.toolCallId === call.id)
                .map(response => (
                  <div
                    key={response.messageId}
                    className='mono sm'
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                  >
                    <span className='faint'>↳ result</span> {response.message}
                  </div>
                ))}
            </div>
          ))}
        </Trace>
      )}
    </>
  )
}

const Answer = ({ message, showActions, canAskAgain, sourcesOpen, onSources, onAskAgain }) => {
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
  onAskAgain,
  unfinished = false,
  children
}) => {
  const { question, items } = turn
  const sentAt = question?.createdAt ? new Date(question.createdAt).toLocaleString() : undefined
  // A turn that ended without an answer: it failed now, or it stopped before (seen after a reload)
  const hasAnswer = items.some(item => item.type === 'answer' && !item.beforeTools)
  const failed = !hasAnswer && !children && question ? question.failed || (unfinished && {}) : null

  return (
    <div className='gc-turn'>
      {question && (
        <div className='gc-user'>
          <ChatAttachments attachments={question.attachments} threadId={threadId} token={token} />
          {question.message && question.message.trim() && (
            <div className='bubble' title={sentAt} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {question.message}
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
              <ToolCalls key={item.header.messageId || index} header={item.header} responses={item.responses} />
            ) : (
              <Answer
                key={item.message.messageId || index}
                message={item.message}
                showActions={!item.beforeTools && !item.message.isStreaming && Boolean(item.message.messageId)}
                canAskAgain={Boolean(onAskAgain && question?.message)}
                sourcesOpen={activeSourcesMessageId === item.message.messageId}
                onSources={onSources && item.message.messageId ? () => onSources(item.message) : null}
                onAskAgain={() => onAskAgain(question.message)}
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
