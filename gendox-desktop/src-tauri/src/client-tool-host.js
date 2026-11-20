// Installed by the native main-frame bootstrap. The invoke closure holds the private native proof.
function installClientToolHost(native, origin) {
  if (window.top !== window || location.protocol + '//' + location.host !== origin) return null
  if (window.__GENDOX_CLIENT_TOOL_HOST__) return window.__GENDOX_CLIENT_TOOL_HOST__

  const REQUEST = 'gendox.events.chat.message.tool_calls.request'
  const RESPONSE = 'gendox.events.chat.message.tool_calls.response'
  const READY = 'gendox.events.chat.message.tool_calls.ready'
  const ACK = 'gendox.events.chat.message.tool_calls.ack'
  const handlers = new Map()
  const executions = new Map()
  const outbox = new Map()
  const readyThreads = new Set()
  let queue = Promise.resolve()

  const keyOf = call => JSON.stringify([call.threadId, call.turnId || call.messageId || '', call.id])
  const failed = message => ({ exit_code: -1, stdout: '', stderr: message, duration_ms: 0 })
  const post = (type, payload) => window.postMessage({ type, payload }, origin)
  const validId = value => typeof value === 'string' && value.length > 0

  function flush(threadId, replay = false) {
    const results = []
    for (const entry of outbox.values()) {
      if (entry.result.threadId !== threadId || (!replay && entry.sent)) continue
      entry.sent = true
      results.push(entry.result)
    }
    if (results.length) post(RESPONSE, results)
  }

  function publish(call, value) {
    let serialized
    try {
      serialized = JSON.stringify(value ?? null)
    } catch {
      serialized = JSON.stringify(failed('The tool result could not be serialized.'))
    }
    const result = {
      threadId: call.threadId,
      turnId: call.turnId,
      messageId: call.messageId,
      toolCallId: call.id,
      value: serialized
    }
    outbox.set(keyOf(call), { result, sent: false })
    if (readyThreads.has(call.threadId)) flush(call.threadId)
  }

  function pruneExecutions() {
    if (executions.size <= 128) return
    for (const [key, execution] of executions) {
      if (execution.completed && !outbox.has(key)) executions.delete(key)
      if (executions.size <= 128) break
    }
  }

  function enqueue(call) {
    if (call?.execution !== 'CLIENT' || !validId(call.threadId) || !validId(call.id)) return
    const handler = handlers.get(call.function?.name)
    if (!handler) return // As with the website widget, an unregistered client tool has no answer.
    const key = keyOf(call)
    const previous = executions.get(key)
    if (previous) {
      if (previous.completed && !outbox.has(key)) publish(call, previous.result)
      return
    }
    const execution = { completed: false }
    executions.set(key, execution)
    queue = queue
      .then(async () => {
        let result
        try {
          const args =
            typeof call.function.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function.arguments
          result = await handler(args, key, call)
        } catch (error) {
          result = failed(String(error?.message || error))
        }
        execution.completed = true
        execution.result = result
        publish(call, result)
        pruneExecutions()
      })
      .catch(() => {
        // A failed result delivery must not prevent a later command from being processed.
      })
  }

  function registerTool(name, handler) {
    if (!validId(name) || typeof handler !== 'function') throw new TypeError('A tool needs a name and a handler.')
    handlers.set(name, handler)
  }

  const host = Object.freeze({ registerTool })
  Object.defineProperty(window, '__GENDOX_CLIENT_TOOL_HOST__', { value: host, configurable: false, writable: false })
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== origin || !event.isTrusted) return
    const message = event.data
    if (message?.type === 'gendox.events.native.request') {
      const request = message.payload
      if (!validId(request?.id) || !Array.isArray(request.args)) return
      if (!Object.hasOwn(native, request.method) || typeof native[request.method] !== 'function') {
        // Answer, so the caller does not wait forever for a method this app does not have.
        post('gendox.events.native.response', { id: request.id, error: 'This operation is not available in this app.' })
        return
      }
      Promise.resolve()
        .then(() => native[request.method](...request.args))
        .then(
          result => post('gendox.events.native.response', { id: request.id, result }),
          error => post('gendox.events.native.response', { id: request.id, error: String(error?.message || error) })
        )
    } else if (message?.type === 'gendox.events.initialization.request') {
      post('gendox.events.initialization.response', { localContextMaxResponses: 0, localContextMaxWaitMs: 0 })
    } else if (message?.type === REQUEST && Array.isArray(message.payload)) {
      message.payload.forEach(enqueue)
    } else if (message?.type === READY && validId(message.payload?.threadId)) {
      readyThreads.add(message.payload.threadId)
      flush(message.payload.threadId, true)
    } else if (message?.type === ACK && validId(message.payload?.threadId) && validId(message.payload?.toolCallId)) {
      const ack = message.payload
      outbox.delete(keyOf({ ...ack, id: ack.toolCallId }))
      pruneExecutions()
    }
  })
  return host
}
