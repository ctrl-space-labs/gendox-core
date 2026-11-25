const prefix = 'gendox-completion:'
export function readCompletionSession(threadId) {
  try { return JSON.parse(localStorage.getItem(prefix + threadId)) || {} } catch { return {} }
}
export function saveCompletionSession(threadId, session) {
  if (!threadId) return
  try {
    const previous = readCompletionSession(threadId)
    localStorage.setItem(prefix + threadId, JSON.stringify({ ...previous, ...session }))
  } catch { /* Storage can be disabled by the host browser. */ }
}

export function routeHostCall(call, { nativeHost, replayed, sent, decisions }) {
  const needsApproval = call.requiresApproval && !(nativeHost && call.function?.name === 'run_command')
  if (needsApproval) {
    const approved = Object.hasOwn(decisions, call.id) ? decisions[call.id] : undefined
    if (approved === false) return 'decline'
    if (approved !== true) return 'ask'
  }

  if (nativeHost || replayed || !sent.has(call.id)) return 'send'
}
