// Policy is shared by browser and desktop. Adapters own only platform delivery.
export function createNotificationService({ preferences, visible, deliver, badge = () => {}, openThread }) {
  const seen = new Set()
  const unread = new Map()
  function read(threadId) {
    unread.delete(threadId)
    badge(unread.size)
  }
  return {
    read,
    async publish({ id, kind, threadId, projectId, organizationId }) {
      const settings = preferences()
      if (!id || !threadId || seen.has(id)) return false
      seen.add(id)
      // Bound deduplication without retaining message text or command arguments.
      if (seen.size > 512) seen.delete(seen.values().next().value)
      if (visible(threadId)) {
        read(threadId)
        return false
      }
      // the badge counts unread answers, also with notifications off; approvals count while they wait
      const target = { threadId, projectId, organizationId }
      if (kind === 'answer') {
        unread.set(threadId, target)
        badge(unread.size)
      }
      if (
        !settings.notifications ||
        !(kind === 'answer' ? settings.answerNotifications : settings.approvalNotifications)
      )
        return false
      try {
        await deliver({
          id,
          title: kind === 'answer' ? 'Your answer is ready' : 'Gendox needs your approval',
          body:
            kind === 'answer'
              ? 'Open the conversation to read the answer.'
              : 'Open the conversation to review the request.',
          onClick: () => {
            read(threadId)
            openThread(target)
          }
        })
        return true
      } catch {
        return false
      }
    }
  }
}

export function browserNotificationAdapter(browser) {
  return {
    supported: Boolean(browser.Notification),
    permission: () => browser.Notification?.permission || 'unsupported',
    requestPermission: () => browser.Notification?.requestPermission() || Promise.resolve('unsupported'),
    async deliver({ id, title, body, onClick }) {
      if (browser.Notification?.permission !== 'granted') throw new Error('Notifications are not enabled.')
      const notification = new browser.Notification(title, { body, tag: id })
      notification.onclick = () => {
        browser.focus()
        notification.close()
        onClick()
      }
    }
  }
}

export function completedThreads(before, after) {
  return Object.entries(after || {}).flatMap(([key, session]) => {
    const previous = before?.[key]
    const thread = session.currentThread
    if (
      !thread?.threadId ||
      previous?.currentThread?.threadId !== thread.threadId ||
      !['GENERATING', 'WAITING_FOR_TOOLS'].includes(previous.completionStatus) ||
      session.completionStatus !== 'COMPLETED'
    )
      return []
    const answer = [...(thread.messages || [])]
      .reverse()
      .find(message => message.role === 'assistant' && message.messageId && !message.isStreaming)
    if (!answer) return []
    return [
      {
        id: `answer:${thread.threadId}:${answer.messageId}`,
        kind: 'answer',
        threadId: thread.threadId,
        projectId: thread.projectId,
        organizationId: thread.organizationId
      }
    ]
  })
}
