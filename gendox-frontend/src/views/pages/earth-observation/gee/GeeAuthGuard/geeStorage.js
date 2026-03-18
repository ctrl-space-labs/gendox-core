// ── localStorage helpers ──────────────────────────────────────────────────────
export const LS_TOKEN         = 'gee_access_token'
export const LS_EXPIRY        = 'gee_token_expiry'
export const LS_REFRESH_TOKEN = 'gee_refresh_token'
export const EXPIRY_BUFFER_MS = 5 * 60 * 1000 // refresh 5 min before real expiry

export function readStoredToken() {
  try {
    const token  = window.localStorage.getItem(LS_TOKEN)
    const expiry = Number(window.localStorage.getItem(LS_EXPIRY) || 0)
    if (!token || Date.now() >= expiry - EXPIRY_BUFFER_MS) return null
    return { token, expiresIn: Math.max(60, Math.floor((expiry - Date.now()) / 1000)) }
  } catch { return null }
}

export function persistToken(accessToken, expiresIn) {
  try {
    window.localStorage.setItem(LS_TOKEN,  accessToken)
    window.localStorage.setItem(LS_EXPIRY, String(Date.now() + expiresIn * 1000))
  } catch {}
}

export function persistRefreshToken(refreshToken) {
  try { window.localStorage.setItem(LS_REFRESH_TOKEN, refreshToken) } catch {}
}

export function readRefreshToken() {
  try { return window.localStorage.getItem(LS_REFRESH_TOKEN) } catch { return null }
}

export function clearStoredToken() {
  try {
    window.localStorage.removeItem(LS_TOKEN)
    window.localStorage.removeItem(LS_EXPIRY)
    window.localStorage.removeItem(LS_REFRESH_TOKEN)
  } catch {}
}
