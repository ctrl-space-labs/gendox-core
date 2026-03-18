import commonConfig from 'src/configs/common.config.js'

export const CLIENT_ID     = commonConfig.GEE_clientId
export const CLIENT_SECRET = commonConfig.GEE_clientSecret
export const REDIRECT_URI  = commonConfig.GEE_redirectUri

// Scopes required by the Earth Engine JS library
export const GEE_SCOPES = [
  'https://www.googleapis.com/auth/earthengine',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/drive'
].join(' ')

// ── OAuth flow helpers ────────────────────────────────────────────────────────

// Opens the Google consent popup and resolves with the authorization code.
// Requires /gee-auth-callback to be a registered Next.js page (src/pages/gee-auth-callback.js).
export function openAuthPopup(codeChallenge) {
  console.log('Opening auth popup with code challenge:', codeChallenge)
  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    response_type:         'code',
    scope:                 GEE_SCOPES,
    access_type:           'offline',
    prompt:                'consent', // always returns a refresh_token
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256'
  })

  window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'gee_auth',
    'width=500,height=620,menubar=no,toolbar=no,location=no'
  )
  console.log('Auth popup opened, waiting for message...')

  return new Promise((resolve, reject) => {
    const handler = event => {
      if (event.origin !== window.location.origin) return
      if (!event.data || event.data.type !== 'GEE_AUTH_CALLBACK') return
      window.removeEventListener('message', handler)
      if (event.data.error) {
        console.error('Received error from auth popup:', event.data.error)
        reject(new Error(event.data.error))
      } else {
        console.log('Received auth code from popup.')
        resolve(event.data.code)
      }
    }
    console.log('Adding message event listener for auth callback...')
    window.addEventListener('message', handler)
  })
}

// Exchanges the authorization code for access + refresh tokens.
export async function exchangeCodeForTokens(code, verifier) {
  console.log('Exchanging code for tokens...')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      code_verifier: verifier,
      grant_type:    'authorization_code',
      redirect_uri:  REDIRECT_URI
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)
  console.log('Received tokens:', data)
  return data // { access_token, refresh_token, expires_in, ... }
}

// Uses the stored refresh token to silently get a new access token.
export async function doTokenRefresh(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token'
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)
  return data // { access_token, expires_in, ... }
}
