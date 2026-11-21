import { Html, Head, Main, NextScript } from 'next/document'
import { STORAGE_KEY } from 'src/utils/server/serverChoice'

// Sets <html data-theme> before the first paint: ?theme= → saved choice → OS setting
const themeScript = `(function () {
  try {
    var prefs = ['light', 'dark', 'system']
    var fromUrl = new URLSearchParams(location.search).get('theme')
    var saved = localStorage.getItem('gx-theme')
    var pref = prefs.indexOf(fromUrl) > -1 ? fromUrl : prefs.indexOf(saved) > -1 ? saved : 'system'
    var osLight = matchMedia('(prefers-color-scheme: light)').matches
    document.documentElement.dataset.theme = pref === 'system' ? (osLight ? 'light' : 'dark') : pref
  } catch (e) {
    document.documentElement.dataset.theme = 'dark'
  }
})()`

// A server chosen on the /server/ page, applied before the app loads, as the desktop app does with its own.
// GENDOX_WEB tells that page which server is the site's own and which one is in use.
const serverScript = `(function () {
  try {
    var env = (window.__GENDOX_ENV__ = window.__GENDOX_ENV__ || {})
    if (env.GENDOX_DESKTOP) return
    var site = env.NEXT_PUBLIC_GENDOX_URL || ${JSON.stringify(process.env.NEXT_PUBLIC_GENDOX_URL || '')} || location.origin + '/gendox/api/v1/'
    var saved = JSON.parse(localStorage.getItem('${STORAGE_KEY}') || '{}') || {}
    var custom = saved.custom || []
    var current = custom.filter(function (s) { return s.address === saved.current })[0]
    env.GENDOX_WEB = { site: site, custom: custom, current: current ? current.address : null }
    if (current) {
      env.NEXT_PUBLIC_GENDOX_URL = current.config.apiUrl
      env.NEXT_PUBLIC_OIDC_AUTHORITY = current.config.oidcAuthority
      if (current.config.clientId) env.NEXT_PUBLIC_OIDC_CLIENT_ID = current.config.clientId
      // Refreshed in the background for the next visit; the API stays on the origin that was allowed
      fetch(current.config.apiUrl + 'public/client-config')
        .then(function (r) { return r.ok ? r.json() : null })
        .then(function (c) {
          if (!c || !c.oidcAuthority || new URL(c.apiUrl).origin !== new URL(current.config.apiUrl).origin) return
          current.config = { apiUrl: c.apiUrl, oidcAuthority: c.oidcAuthority, clientId: c.webClientId || null }
          localStorage.setItem('${STORAGE_KEY}', JSON.stringify(saved))
        })
        .catch(function () {})
    }
  } catch (e) {}
})()`

const CustomDocument = () => {
  return (
    <Html lang='en'>
      <Head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap'
        />
        <link rel='icon' href='/images/logo.svg' type='image/svg+xml' />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <script src='/env-config.js' />
        <script dangerouslySetInnerHTML={{ __html: serverScript }} />
        <NextScript />
      </body>
    </Html>
  )
}

export default CustomDocument
