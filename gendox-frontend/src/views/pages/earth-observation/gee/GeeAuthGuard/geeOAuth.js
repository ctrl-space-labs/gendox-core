import commonConfig from 'src/configs/common.config.js'
import ee from '@google/earthengine'

// Expose ee to window so the EE library can find it after webpack bundling
if (typeof window !== 'undefined') {
  window.ee = ee
}

export const CLIENT_ID = commonConfig.GEE_clientId

// EE client defaults also include cloud-platform + drive; suppress and request only earthengine.
// If you uncomment EXTRA_SCOPES above, spread it: [ee.apiclient.AUTH_SCOPE, ...EXTRA_SCOPES]
const OAUTH_SCOPES = [ee.apiclient.AUTH_SCOPE]
const SUPPRESS_EE_DEFAULT_SCOPES = true

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
