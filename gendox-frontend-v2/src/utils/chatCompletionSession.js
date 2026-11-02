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
