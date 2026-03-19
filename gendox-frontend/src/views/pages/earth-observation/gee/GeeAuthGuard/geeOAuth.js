import commonConfig from 'src/configs/common.config.js'
import ee from '@google/earthengine'

export const CLIENT_ID = commonConfig.GEE_clientId

// Drive scope is not included in the EE default scopes, so we add it explicitly.
const EXTRA_SCOPES = ['https://www.googleapis.com/auth/drive']

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
    ee.data.authenticateViaOauth(CLIENT_ID, resolve, reject, EXTRA_SCOPES, onImmediateFailed)
  })
}
