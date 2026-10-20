// Serves the built frontend with a deterministic streaming API. Never contacts a model or real database.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../../gendox-frontend/out')
const base = 'http://127.0.0.1:3520'
let state
const reset = mode => { state = { mode, status: 'IDLE', messages: [], requests: [], pendingCalls: [] } }
reset('plain')
const row = (id, role, value, extra = {}) => ({ id, role, value, threadId: 'thread', createdBy: role === 'user' ? 'anonymous' : 'agent', createdAt: new Date().toISOString(), ...extra })
const json = (res, data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function completion(req, res, body) {
  state.requests.push(body)
  const current = state
  if (body.role === 'tool') current.messages.push(row('tool-result', 'tool', body.value, { name: 'lookup', toolCallId: body.toolCallId }))
  else current.messages.push(row('user', 'user', body.value))
  current.status = 'GENERATING'
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  const emit = (event, data) => { if (!res.destroyed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) }
  emit('start', { threadId: 'thread', turnId: 'turn' })
  if (body.role !== 'tool' && current.mode !== 'plain') {
    const navigation = current.mode === 'navigation'
    const call = { id: 'call', type: 'function', function: { name: navigation ? 'open_web_page' : 'lookup', arguments: JSON.stringify(navigation ? { url: base + '/test-host?resumed=1' } : { query: 'order' }) } }
    const assistant = row('call-message', 'assistant', 'Checking.', { toolCalls: [call], reasoningContent: 'Need a tool.' })
    current.messages.push(assistant)
    emit('message', { turnId: 'turn', threadId: 'thread', messageIndex: 0, message: assistant })
    if (!navigation) {
      current.status = 'WAITING_FOR_TOOLS'
      current.pendingCalls = [{ id: 'call', messageId: 'call-message', name: 'lookup', arguments: call.function.arguments }]
      emit('waiting_for_tools', { threadId: 'thread', turnId: 'turn', status: current.status, pendingCalls: current.pendingCalls, resumeToken: 'test-session' })
      res.end(); return
    }
    emit('tool_calls', { threadId: 'thread', turnId: 'turn', messageId: 'call-message', execution: 'ACTION', toolCalls: [call] })
    await wait(3000)
  } else {
    emit('delta', { turnId: 'turn', messageIndex: body.role === 'tool' ? 2 : 0, field: 'reasoningContent', text: 'Working through the evidence.' })
    emit('delta', { turnId: 'turn', messageIndex: body.role === 'tool' ? 2 : 0, field: 'value', text: 'First' })
    await wait(700)
  }
  const answer = current.mode === 'navigation' ? 'Answer recovered after navigation.' : body.role === 'tool' ? 'Tool-based answer.' : 'First second.'
  const assistant = row('answer', 'assistant', answer, { reasoningContent: 'Working through the evidence.' })
  current.messages.push(assistant); current.status = 'COMPLETED'; current.pendingCalls = []
  emit('message', { turnId: 'turn', threadId: 'thread', messageIndex: body.role === 'tool' ? 2 : 0, message: assistant })
  emit('done', { threadId: 'thread', messages: current.messages.filter(m => m.role !== 'user'), provenAiMetadata: [] })
  res.end()
}
http.createServer(async (req, res) => {
  const url = new URL(req.url, base)
  if (url.pathname === '/__reset') { reset(url.searchParams.get('mode')); return json(res, {}) }
  if (url.pathname === '/__state') return json(res, state)
  if (url.pathname === '/test-host') {
    res.setHeader('Content-Type', 'text/html')
    return res.end(`<!doctype html><body><h1>Streaming test host</h1><script id="gendox-chat-script" src="/gendox-sdk/gendox-widget-plugin.js" data-gendox-src="${base}" data-organization-id="org" data-project-id="project" data-gendox-chat-initial-state="open"></script><script>window.toolExecutions=0;window.gendox.tools.registerTool('lookup', async args => {window.toolExecutions++;return {status:'shipped',query:args.query}})</script></body>`)
  }
  if (url.pathname.includes('undefined')) {
    const api = url.pathname.split('undefined')[1]
    if (api.endsWith('messages/completions')) {
      let text = ''; for await (const chunk of req) text += chunk
      return completion(req, res, JSON.parse(text)).catch(error => { console.error(error); res.destroy() })
    }
    if (api.endsWith('completion-status')) return json(res, { threadId: 'thread', turnId: 'turn', status: state.status, pendingCalls: state.pendingCalls })
    if (api.endsWith('/messages/attachments')) return json(res, { attachmentsByMessageId: {} })
    if (api.endsWith('/messages')) return json(res, { content: state.messages })
    if (api.includes('message-metadata')) return json(res, [])
    if (api === 'organizations/org/projects') return json(res, { content: [{ id: 'project', name: 'Test', description: 'Test', projectAgent: { id: 'agent-config', userId: 'agent', agentName: 'Test agent' } }] })
    if (api === 'threads') return json(res, { content: state.messages.length ? [{ id: 'thread', name: 'Test thread', chatThreadMembers: [{ userId: 'agent' }], latestMessageCreatedAt: new Date().toISOString() }] : [] })
    return json(res, { content: [] })
  }
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname))
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end() }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end() }
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}).listen(3520, '127.0.0.1')
