import commonConfig from 'src/configs/common.config.js'
import ee from '@google/earthengine'

// Expose ee to window so the EE library can find it after webpack bundling
if (typeof window !== 'undefined') {
  window.ee = ee
}

export const CLIENT_ID = commonConfig.GEE_clientId

// EE client defaults also include cloud-platform + drive; suppress and request only what we need.
// - earthengine     — required to call EE APIs. Per Google docs, EE's per-project endpoints
//                     (/v1/projects/{project}/...) accept either this scope or cloud-platform,
//                     so we deliberately avoid the sensitive cloud-platform scope here to keep
//                     the OAuth consent screen free of "unverified app" warnings.
// - userinfo.email  — non-sensitive scope; used to display the Google account connected to EE
//                     in the EO header (separate from the Gendox-app user).
const OAUTH_SCOPES = [ee.apiclient.AUTH_SCOPE, 'https://www.googleapis.com/auth/userinfo.email']
const SUPPRESS_EE_DEFAULT_SCOPES = true

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

/**
 * Initialize Earth Engine, preferring the org-configured Cloud project (opt_project)
 * but never blocking the user when the project is unusable.
 *
 * Strategy:
 *   1. If no project ID is configured → init without opt_project (shared rate limits).
 *   2. If a project ID exists → try ee.initialize with it. EE validates everything
 *      internally (API enabled, project registered with Earth Engine, user access,
 *      etc.) and either succeeds or fails on its first internal request.
 *   3. On any project-init failure → hard-reset EE state, restore the auth token,
 *      and re-init WITHOUT the project. The reset is essential: EE caches the
 *      failed project context, so a plain ee.initialize(null, null) retry still
 *      routes through the bad project and fails identically.
 *
 * We intentionally do NOT probe the project beforehand. Different EE endpoints
 * (value:compute, algorithms on different hosts) disagree about project
 * usability — a probe can return 200 for a project that EE init then rejects
 * with 403. Trust EE's own validation and recover cleanly from failure.
 *
 * Resolves with { projectFailed: boolean } once EE is initialized; rejects only
 * when even the no-project init fails (expired token, EE service down).
 */
export function initializeEarthEngineWithFallback(geeProjectId, accessToken) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof ee.reset === 'function') ee.reset()
    } catch {}

    const initWithoutProject = ({ projectFailed }) => {
      ee.initialize(
        null,
        null,
        () => resolve({ projectFailed }),
        err => reject(err)
      )
    }

    if (!geeProjectId) {
      initWithoutProject({ projectFailed: false })
      return
    }

    ee.initialize(
      null,
      null,
      () => resolve({ projectFailed: false }),
      err => {
        console.warn(
          `GEE init with project "${geeProjectId}" failed; resetting EE state and falling back to shared rate limits:`,
          err
        )
        try {
          if (typeof ee.reset === 'function') ee.reset()
        } catch {}
        try {
          if (ee.apiclient && typeof ee.apiclient.setProject === 'function') {
            ee.apiclient.setProject(ee.apiclient.DEFAULT_PROJECT)
          }
        } catch {}
        setTimeout(() => initWithoutProject({ projectFailed: true }), 0)
      },
      undefined,
      geeProjectId
    )
  })
}

/**
 * Fetch the Google account email associated with the current EE access token.
 * Requires the `userinfo.email` OAuth scope; returns null on any failure so the
 * caller can fall back to a placeholder without breaking the workspace.
 */
export async function fetchGeeUserEmail(accessToken) {
  if (!accessToken) return null
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.email || null
  } catch {
    return null
  }
}

// Wraps ee.data.authenticateViaOauth in a Promise.
//
// Flow (handled internally by the EE library):
//   1. Loads the Google Identity Services script if not already present.
//   2. Attempts a silent token refresh.
//   3. If silent refresh fails:
//      - If onImmediateFailed is provided → calls it (e.g. to show the login dialog).
//      - If not provided → falls back to ee.data.authenticateViaPopup() automatically.
//
// For popup (user-initiated login): call WITHOUT onImmediateFailed.
// For silent attempt on page load: call WITH onImmediateFailed to handle the no-session case.
//
// No client_secret, no redirect URI, no manual token exchange.
export function authenticateViaOauth({ onImmediateFailed } = {}) {
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaOauth(
      CLIENT_ID,
      resolve,
      reject,
      OAUTH_SCOPES,
      onImmediateFailed,
      SUPPRESS_EE_DEFAULT_SCOPES
    )
  })
}
