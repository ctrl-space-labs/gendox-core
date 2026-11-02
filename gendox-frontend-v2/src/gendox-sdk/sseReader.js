/** SSE frames can span network chunks, UTF-8 characters and CRLF boundaries. */
export async function readEventStream(body, onEvent) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let data = []
  let event = 'message'
  const line = async value => {
    if (!value) {
      if (data.length) await onEvent(event, JSON.parse(data.join('\n')))
      data = []
      event = 'message'
      return
    }
    if (value.startsWith(':')) return
    const colon = value.indexOf(':')
    const field = colon < 0 ? value : value.slice(0, colon)
    let content = colon < 0 ? '' : value.slice(colon + 1)
    if (content.startsWith(' ')) content = content.slice(1)
    if (field === 'event') event = content
    if (field === 'data') data.push(content)
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      pending += decoder.decode(value, { stream: !done })
      let end
      while ((end = pending.indexOf('\n')) >= 0) {
        await line(pending.slice(0, end).replace(/\r$/, ''))
        pending = pending.slice(end + 1)
      }
      if (done) break
    }
    if (pending) await line(pending.replace(/\r$/, ''))
    await line('')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
