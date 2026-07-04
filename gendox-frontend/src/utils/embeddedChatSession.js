const STORAGE_KEY = 'gendox-widget'

export function buildSessionKey(origin, orgId, projId) {
  return `${origin}|${orgId}|${projId}`
}

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable (e.g. private browsing quota exceeded) — silently skip
  }
}

/**
 * Persist the current session for an embedded chat instance.
 * Also prunes entries that are older than timeoutMs on every write.
 *
 * @param {string} origin       - Host page origin (e.g. "https://example.com")
 * @param {string} orgId        - Organization ID
 * @param {string} projId       - Project ID
 * @param {{ threadId: string|null, isOpen: boolean }} session
 * @param {number} timeoutMs    - Expiry window used for pruning (milliseconds)
 */
export function saveSession(origin, orgId, projId, { threadId, isOpen }, timeoutMs) {
  const data = readStorage()
  const sessions = data.sessions || {}

  const key = buildSessionKey(origin, orgId, projId)
  const now = Date.now()

  sessions[key] = {
    threadId: threadId ?? null,
    isOpen: Boolean(isOpen),
    updatedAt: now
  }

  // Prune entries that have exceeded the timeout
  const cutoff = now - timeoutMs
  for (const k of Object.keys(sessions)) {
    if (sessions[k].updatedAt < cutoff) {
      delete sessions[k]
    }
  }

  writeStorage({ ...data, sessions })
}

/**
 * Patch only the threadId on an existing session entry, preserving isOpen.
 * If no entry exists yet (defensive), a minimal one is created with isOpen: true,
 * since a completion response implies the chat is open.
 *
 * This is used to persist a newly created thread ID synchronously the moment it is
 * known (before dispatching tool calls), so a tool that navigates the host page
 * cannot race ahead of the save.
 *
 * @param {string} origin   - Host page origin
 * @param {string} orgId    - Organization ID
 * @param {string} projId   - Project ID
 * @param {string} threadId - The thread ID to persist
 */
export function updateSessionThreadId(origin, orgId, projId, threadId) {
  if (!origin || !orgId || !projId || !threadId) return

  const data = readStorage()
  const sessions = data.sessions || {}
  const key = buildSessionKey(origin, orgId, projId)
  const existing = sessions[key]

  sessions[key] = {
    threadId,
    isOpen: existing ? Boolean(existing.isOpen) : true,
    updatedAt: Date.now()
  }

  writeStorage({ ...data, sessions })
}

/**
 * Load a previously saved session for an embedded chat instance.
 * Returns null if no entry exists or if the entry has expired.
 *
 * @param {string} origin    - Host page origin
 * @param {string} orgId     - Organization ID
 * @param {string} projId    - Project ID
 * @param {number} timeoutMs - Expiry window (milliseconds)
 * @returns {{ threadId: string|null, isOpen: boolean } | null}
 */
export function loadSession(origin, orgId, projId, timeoutMs) {
  const data = readStorage()
  const sessions = data.sessions || {}
  const key = buildSessionKey(origin, orgId, projId)
  const entry = sessions[key]

  if (!entry) return null
  if (Date.now() - entry.updatedAt > timeoutMs) return null

  return {
    threadId: entry.threadId ?? null,
    isOpen: Boolean(entry.isOpen)
  }
}
