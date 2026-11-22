// Serves a deterministic streaming API. Optional native checks proxy only reads to a local stack.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const root = path.resolve(__dirname, '../../../gendox-frontend-v2/out')
const port = Number(process.env.E2E_STREAMING_PORT || 3520)
const base = `http://127.0.0.1:${port}`
function loopback(value, name) {
  if (!value) return null
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be a loopback HTTP(S) URL without credentials or query parameters.`)
  }
  return url.href.replace(/\/$/, '')
}
const upstream = loopback(process.env.E2E_DESKTOP_API_UPSTREAM, 'E2E_DESKTOP_API_UPSTREAM')
const authority = loopback(process.env.E2E_DESKTOP_OIDC_AUTHORITY, 'E2E_DESKTOP_OIDC_AUTHORITY')
if (Boolean(upstream) !== Boolean(authority)) throw new Error('Set both desktop fixture URLs together.')
const command = process.platform === 'win32' ? "Write-Output 'gendox-native-command-check'" : "printf 'gendox-native-command-check\\n'"
let state
// Modes: plain (no tools), navigation (an ACTION open_web_page), desktop (run_command), approval (a CLIENT
// lookup the agent's owner marked "Ask before running"), and the default: a CLIENT lookup.
const fresh = mode => ['desktop', 'approval'].includes(mode)
const reset = mode => { state = { mode, threadId: fresh(mode) ? randomUUID() : 'thread', turnId: fresh(mode) ? randomUUID() : 'turn', status: 'IDLE', messages: [], requests: [], pendingCalls: [] } }
reset(upstream ? 'desktop' : 'plain')
const row = (id, role, value, extra = {}) => ({ id, role, value, threadId: state.threadId, createdBy: role === 'user' ? 'anonymous' : 'agent', createdAt: new Date().toISOString(), ...extra })
const json = (res, data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function completion(req, res, body) {
  state.requests.push(body)
  const current = state
  if (body.role === 'tool') current.messages.push(row('tool-result', 'tool', body.value, { name: current.mode === 'desktop' ? 'run_command' : 'lookup', toolCallId: body.toolCallId }))
  else current.messages.push(row('user', 'user', body.value))
  current.status = 'GENERATING'
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  const emit = (event, data) => { if (!res.destroyed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) }
  emit('start', { threadId: current.threadId, turnId: current.turnId })
  if (body.role !== 'tool' && current.mode !== 'plain') {
    const navigation = current.mode === 'navigation'
    const desktop = current.mode === 'desktop'
    const call = { id: desktop ? randomUUID() : 'call', type: 'function', function: { name: navigation ? 'open_web_page' : desktop ? 'run_command' : 'lookup', arguments: JSON.stringify(navigation ? { url: base + '/test-host?resumed=1' } : desktop ? { command, description: 'Print a harmless desktop integration check.' } : { query: 'order' }) } }
    const assistant = row('call-message', 'assistant', 'Checking.', { toolCalls: [call], reasoningContent: 'Need a tool.' })
    current.messages.push(assistant)
    emit('message', { turnId: current.turnId, threadId: current.threadId, messageIndex: 0, message: assistant })
    if (!navigation) {
      current.status = 'WAITING_FOR_TOOLS'
      current.pendingCalls = [{ id: call.id, messageId: 'call-message', name: call.function.name, arguments: call.function.arguments, execution: 'CLIENT', ...(current.mode === 'approval' ? { requiresApproval: true } : {}) }]
      emit('waiting_for_tools', { threadId: current.threadId, turnId: current.turnId, status: current.status, pendingCalls: current.pendingCalls, resumeToken: 'test-session' })
      res.end(); return
    }
    emit('tool_calls', { threadId: current.threadId, turnId: current.turnId, messageId: 'call-message', execution: 'ACTION', toolCalls: [call] })
    await wait(3000)
  } else {
    emit('delta', { turnId: current.turnId, messageIndex: body.role === 'tool' ? 2 : 0, field: 'reasoningContent', text: 'Working through the evidence.' })
    emit('delta', { turnId: current.turnId, messageIndex: body.role === 'tool' ? 2 : 0, field: 'value', text: 'First' })
    await wait(700)
  }
  const answer = current.mode === 'navigation' ? 'Answer recovered after navigation.' : body.role === 'tool' ? 'Tool-based answer.' : 'First second.'
  const assistant = row('answer', 'assistant', answer, { reasoningContent: 'Working through the evidence.' })
  current.messages.push(assistant); current.status = 'COMPLETED'; current.pendingCalls = []
  emit('message', { turnId: current.turnId, threadId: current.threadId, messageIndex: body.role === 'tool' ? 2 : 0, message: assistant })
  emit('done', { threadId: current.threadId, messages: current.messages.filter(m => m.role !== 'user'), provenAiMetadata: [] })
  res.end()
}
http.createServer(async (req, res) => {
  const url = new URL(req.url, base)
  const allowedOrigins = [base, 'tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost']
  if (allowedOrigins.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
  if (req.method === 'OPTIONS') {
    if (!allowedOrigins.includes(req.headers.origin)) return json(res, {}, 403)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Gendox-Completion-Token')
    res.writeHead(204); return res.end()
  }
  if (url.pathname === '/__reset') { reset(url.searchParams.get('mode')); return json(res, {}) }
  if (url.pathname === '/__state') return json(res, state)
  if (url.pathname === '/env-config.js') {
    res.setHeader('Content-Type', 'application/javascript')
    return res.end(`window.__GENDOX_ENV__ = ${JSON.stringify({ NEXT_PUBLIC_GENDOX_URL: base + '/gendox/api/v1/' })}`)
  }
  if (url.pathname === '/test-host') {
    res.setHeader('Content-Type', 'text/html')
    return res.end(`<!doctype html><body><h1>Streaming test host</h1><script id="gendox-chat-script" src="/gendox-sdk/gendox-widget-plugin.js" data-gendox-src="${base}" data-organization-id="org" data-project-id="project" data-gendox-chat-initial-state="open"></script><script>window.toolExecutions=0;window.gendox.tools.registerTool('lookup', async args => {window.toolExecutions++;return {status:'shipped',query:args.query}})</script></body>`)
  }
  if (url.pathname.startsWith('/gendox/api/v1/')) {
    const api = url.pathname.slice('/gendox/api/v1/'.length)
    if (api === 'public/client-config' && upstream) return json(res, { apiUrl: base + '/gendox/api/v1/', oidcAuthority: authority, desktopClientId: 'gendox-pkce-public-client-desktop' })
    if (api.endsWith('messages/completions') && req.method === 'POST') {
      let text = ''; for await (const chunk of req) text += chunk
      return completion(req, res, JSON.parse(text)).catch(error => { console.error(error); res.destroy() })
    }
    if (req.method !== 'GET') return json(res, { error: 'The fixture does not proxy writes.' }, 405)
    if (api.endsWith('completion-status')) return json(res, { threadId: state.threadId, turnId: state.turnId, status: state.status, pendingCalls: state.pendingCalls })
    if (api.endsWith('/messages/attachments')) return json(res, { attachmentsByMessageId: {} })
    if (api.endsWith('/messages')) return json(res, { content: state.messages })
    if (api.includes('message-metadata')) return json(res, [])
    if (!upstream && api === 'organizations/org/projects') return json(res, { content: [{ id: 'project', name: 'Test', description: 'Test', projectAgent: { id: 'agent-config', userId: 'agent', agentName: 'Test agent' } }] })
    if (api === 'threads') return json(res, { content: state.messages.length ? [{ id: state.threadId, name: 'Test thread', chatThreadMembers: [{ userId: 'agent' }], latestMessageCreatedAt: new Date().toISOString() }] : [] })
    if (upstream) {
      // Fixed destination, no redirects: an existing test token never leaves this loopback stack.
      const headers = req.headers.authorization ? { Authorization: req.headers.authorization } : {}
      try {
        const response = await fetch(upstream + '/' + api + url.search, { headers, redirect: 'error' })
        res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/json' })
        return res.end(Buffer.from(await response.arrayBuffer()))
      } catch { return json(res, { error: 'Local fixture upstream unavailable.' }, 502) }
    }
    return json(res, { content: [] })
  }
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname))
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end() }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end() }
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}).listen(port, '127.0.0.1')
