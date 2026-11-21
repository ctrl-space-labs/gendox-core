// The web app's server choice, mainly for development: the /server/ page saves it, and a script in
// _document.js applies it to window.__GENDOX_ENV__ before the app loads, as the desktop app does.
// Plain JavaScript, so tests/serverChoice.test.mjs can import it.

/** localStorage: { current: address or null, custom: [{ name, address, config: { apiUrl, oidcAuthority, clientId } }] } */
export const STORAGE_KEY = 'gendox.servers.v1'

const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/

/** The API base of a server address, ending in a slash. The site's address means its /gendox/api/v1. */
export function apiBaseOf(address) {
  let text = String(address || '').trim()
  if (!/^https?:\/\//i.test(text)) text = `${/^(localhost|127\.0\.0\.1)\b/.test(text) ? 'http' : 'https'}://${text}`
  let url
  try {
    url = new URL(text)
  } catch {
    throw new Error('This is not a valid address.')
  }
  if (url.protocol !== 'https:' && !LOOPBACK.test(url.hostname)) throw new Error('Use an https:// address.')
  const path = url.pathname.replace(/\/+$/, '')

  return `${url.origin}${path || '/gendox/api/v1'}/`
}

/** Whether an origin is in the site's allowlist. In an entry, * stands for one subdomain label or a port. */
export const isAllowed = (origin, patterns = []) =>
  patterns.some(pattern => {
    const parts = String(pattern).trim().replace(/\/$/, '').split('*')
    const escaped = parts.map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))

    return new RegExp(`^${escaped.join('[a-z0-9-]+')}$`, 'i').test(origin)
  })

/** A server's public client configuration. */
export async function clientConfig(apiBase) {
  const response = await fetch(`${apiBase}public/client-config`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`The server answered ${response.status}.`)

  return response.json()
}
