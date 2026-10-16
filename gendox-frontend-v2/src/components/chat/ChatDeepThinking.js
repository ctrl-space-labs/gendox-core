import { useEffect, useRef } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { Brain, Square } from 'lucide-react'
import {
  cancelDeepThinking,
  finalizeDeepThinkingThread,
  pollDeepThinkingStatus,
  selectChatSession
} from 'src/store/chat/gendoxChat'
import { useChatKey } from 'src/components/chat/chatKey'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useIFrameMessageManager } from 'src/authentication/context/IFrameMessageManagerContext'

const STEP_TYPE_LABELS = {
  LLM_CALL: 'AI Processing',
  TOOL_EXECUTION: 'Executing Tool',
  SUB_AGENT_CREATED: 'Sub-agent Created',
  SUB_AGENT_COMPLETED: 'Sub-agent Completed',
  FINAL_RESPONSE: 'Final Response'
}

/**
 * A running deep-thinking job: its steps so far, with Stop.
 * It polls the job, and when the job completes it brings the answer into the thread.
 */
const ChatDeepThinking = () => {
  const dispatch = useDispatch()
  const iFrameMessageManager = useIFrameMessageManager()
  const pollingRef = useRef(null)

  const chatKey = useChatKey()
  const { isDeepThinking, deepThinkingJobId, deepThinkingSteps, currentThread } = useSelector(
    state => selectChatSession(state, chatKey),
    shallowEqual
  )

  useEffect(() => {
    if (!isDeepThinking || !deepThinkingJobId || !currentThread) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }

      return
    }

    const organizationId = currentThread.organizationId
    const projectId = currentThread.projectId
    const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

    const poll = () => {
      dispatch(
        pollDeepThinkingStatus({
          organizationId,
          projectId,
          jobExecutionId: deepThinkingJobId,
          token,
          chatKey
        })
      ).then(action => {
        if (!action.payload) return

        const { status, job } = action.payload
        const effectiveExitCode = (job?.exitCode || '').trim().toUpperCase()
        const terminal =
          ['COMPLETED', 'FAILED', 'STOPPED', 'ABANDONED'].includes(status) ||
          (status === 'UNKNOWN' && ['FAILED', 'COMPLETED', 'STOPPED', 'ABANDONED'].includes(effectiveExitCode))

        if (terminal) {
          clearInterval(pollingRef.current)
          pollingRef.current = null

          const finalStatus = status === 'UNKNOWN' ? effectiveExitCode || status : status
          if (finalStatus === 'COMPLETED') {
            dispatch(
              finalizeDeepThinkingThread({
                threadId: currentThread.threadId,
                token,
                iFrameMessageManager,
                chatKey
              })
            )
          }
        }
      })
    }

    poll()
    pollingRef.current = setInterval(poll, 3000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isDeepThinking, deepThinkingJobId, currentThread, dispatch, iFrameMessageManager, chatKey])

  const handleStop = () => {
    if (!currentThread || !deepThinkingJobId) return
    dispatch(
      cancelDeepThinking({
        organizationId: currentThread.organizationId,
        projectId: currentThread.projectId,
        jobExecutionId: deepThinkingJobId,
        token: window.localStorage.getItem(localStorageConstants.accessTokenKey),
        chatKey
      })
    )
  }

  if (!isDeepThinking) return null

  return (
    <div className='gc-deep'>
      <div className='row'>
        <b style={{ flex: 1 }}>
          <Brain className='lucide' />
          Deep thinking…
        </b>
        <button className='btn s' onClick={handleStop}>
          <Square className='lucide' />
          Stop
        </button>
      </div>
      {deepThinkingSteps.length > 0 && (
        <ol className='gc-steps'>
          {deepThinkingSteps.map((step, index) => (
            <li key={step.id || index} className={index === deepThinkingSteps.length - 1 ? 'cur' : ''}>
              <b>{STEP_TYPE_LABELS[step.stepType] || step.stepType}</b>
              {step.summary && <span className='muted'>{step.summary}</span>}
            </li>
          ))}
        </ol>
      )}
      <p className='faint sm'>This can take a few minutes. You can leave — the answer will be here.</p>
    </div>
  )
}

export default ChatDeepThinking
