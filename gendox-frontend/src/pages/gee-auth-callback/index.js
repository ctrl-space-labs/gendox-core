import { useEffect } from 'react'

// Callback page for the GEE PKCE OAuth flow.
// Google redirects here after the user grants consent.
// This page reads the auth code from the URL and postMessages it back to the opener, then closes.
export default function GeeAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const error  = params.get('error')

    if (window.opener) {
      window.opener.postMessage(
        { type: 'GEE_AUTH_CALLBACK', code, error },
        window.location.origin
      )
      window.close()
    }
  }, [])

  return null
}
