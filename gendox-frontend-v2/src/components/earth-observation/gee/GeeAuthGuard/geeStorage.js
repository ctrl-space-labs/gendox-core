// ── localStorage helpers ──────────────────────────────────────────────────────
// Stores only the short-lived access token so the user does not need to
// sign in again on every page refresh (within the token's 1-hour lifetime).
// No refresh token is ever stored here.

const LS_TOKEN  = 'gee_access_token'
const LS_EXPIRY = 'gee_token_expiry'

const RESTORE_BUFFER_MS = 60 * 1000 // don't restore if < 1 min remaining

export function readStoredToken() {
  try {
    const token  = window.localStorage.getItem(LS_TOKEN)
    const expiry = Number(window.localStorage.getItem(LS_EXPIRY) || 0)
    if (!token || Date.now() >= expiry - RESTORE_BUFFER_MS) return null
    return { token, expiresIn: Math.floor((expiry - Date.now()) / 1000) }
  } catch { return null }
}

export function persistToken(accessToken, expiresIn) {
  try {
    window.localStorage.setItem(LS_TOKEN,  accessToken)
    window.localStorage.setItem(LS_EXPIRY, String(Date.now() + expiresIn * 1000))
  } catch {}
}

export function clearStoredToken() {
  try {
    window.localStorage.removeItem(LS_TOKEN)
    window.localStorage.removeItem(LS_EXPIRY)
  } catch {}
}
