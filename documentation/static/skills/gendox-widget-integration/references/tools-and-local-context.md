# Tools and Local Context Reference

## Local context — give the agent page awareness

When the user sends a message, the iframe fires `gendox.events.chat.message.context.local.request`. The SDK runs every registered callback and sends their return values as context to the model.

### Register a callback

Call `window.gendox.widget.addLocalContextRequestCallback(contextType, fn)` inside `script.onload`. `contextType` is any string key; duplicate keys throw.

**Synchronous (most common):**

```js
window.gendox.widget.addLocalContextRequestCallback('PAGE_SUMMARY', () => ({
  contextType: 'PAGE_SUMMARY',
  value: document.querySelector('main')?.innerText?.slice(0, 3000) || ''
}))
```

**Return multiple values from one callback:**

```js
window.gendox.widget.addLocalContextRequestCallback('PAGE_META', () => [
  { contextType: 'PAGE_TITLE', value: document.title },
  { contextType: 'CURRENT_URL', value: window.location.href }
])
```

**Asynchronous (use `sendResponse`):**

```js
window.gendox.widget.addLocalContextRequestCallback('API_DATA', (_event, sendResponse) => {
  fetch('/api/context').then(r => r.text()).then(value => {
    sendResponse({ contextType: 'API_DATA', value })
  })
})
```

### Tuning `localContextMaxResponses`

Set this to the **total number of context messages** you expect the SDK to receive per user message (counting multiple values from one callback separately, plus the default `SELECTED_TEXT` callback unless disabled).

```html
data-gendox-local-context-max-responses="3"
data-gendox-local-context-max-wait-ms="1000"
```

The iframe waits until it receives `maxResponses` messages or `maxWaitMs` elapses, whichever comes first.

### Avoid stale closures (React)

Callbacks are closures captured at registration time. If they reference React state or props that change, mirror the value into a ref:

```js
const myValueRef = useRef(myValue)
useEffect(() => { myValueRef.current = myValue }, [myValue])

// in script.onload:
window.gendox.widget.addLocalContextRequestCallback('MY_VALUE', () => ({
  contextType: 'MY_VALUE',
  value: String(myValueRef.current)
}))
```

### Cleanup

`removeLocalContextRequestCallback` **throws** if the key is not registered. Track registration:

```js
let contextRegistered = false

script.onload = () => {
  window.gendox.widget.addLocalContextRequestCallback('MY_CONTEXT', myFn)
  contextRegistered = true
}

// cleanup:
if (contextRegistered) {
  window.gendox.widget.removeLocalContextRequestCallback('MY_CONTEXT')
}
```

---

## Tools — let the agent trigger front-end actions

Tools are two-sided: define a schema in Gendox, register a handler in the browser.

### Step 1: Define the tool schema in Gendox

Go to **Project → Settings → AI Agent → Tools**, click **Add Tool**, paste an OpenAI-style JSON schema:

```json
{
  "name": "navigate_to_section",
  "strict": true,
  "description": "Scrolls the page to a named section.",
  "parameters": {
    "type": "object",
    "required": ["sectionId"],
    "additionalProperties": false,
    "properties": {
      "sectionId": {
        "type": "string",
        "description": "The HTML id of the section element to scroll to."
      }
    }
  }
}
```

### Step 2: Register the handler in the browser

Use `window.gendox.tools.registerTool(name, handler)`. `handler(args)` receives the **parsed** arguments object (not a JSON string). Return a plain object as the result.

```js
window.gendox.tools.registerTool('navigate_to_section', (args) => {
  const el = document.getElementById(args.sectionId)
  if (!el) return { success: false, error: 'Section not found' }
  el.scrollIntoView({ behavior: 'smooth' })
  return { success: true }
})
```

**Always validate arguments before executing** — especially URLs and command strings:

```js
window.gendox.tools.registerTool('open_web_page', (args) => {
  let url
  try { url = new URL(args.url) } catch { return { success: false, error: 'Invalid URL' } }
  if (!['https:', 'http:'].includes(url.protocol)) return { success: false, error: 'Disallowed protocol' }
  window.location.href = url.href
  return { success: true, navigated: true }
})
```

### Registration timing

The SDK waits up to `data-gendox-pending-tool-handler-wait-ms` (default 1000ms) for a handler when a queued tool call arrives. Register handlers inside `script.onload` to avoid the race. If your tool registration depends on async setup, use the polling pattern:

```js
// poll every 500ms until window.gendox.tools is ready
let intervalId = setInterval(() => {
  if (!window.gendox?.tools?.registerTool) return
  clearInterval(intervalId)
  window.gendox.tools.registerTool('my_tool', myHandler)
}, 500)
```

### Cleanup

`removeTool` **throws** if the name is not registered. Track registration:

```js
let toolRegistered = false

script.onload = () => {
  window.gendox.tools.registerTool('my_tool', myHandler)
  toolRegistered = true
}

// cleanup:
if (toolRegistered) window.gendox.tools.removeTool('my_tool')
```

### Default `open_web_page` tool

The SDK auto-registers `open_web_page` (navigates to `args.url` in the current tab). Disable it if you want full control:

```html
data-gendox-open-web-page-tool-enabled="false"
```

Or remove it at runtime before registering your own:

```js
window.gendox.tools.removeTool('open_web_page')
window.gendox.tools.registerTool('open_web_page', myHandler)
```

### Current limitations

- **Tool results are not returned to the agent.** The handler runs, but the return value is not fed back into the model's context. Tool use is currently one-way (fire-and-forget).
- **Navigation side-effect**: if `open_web_page` navigates the page, the widget script is torn down. The SDK persists remaining queued tool calls in `sessionStorage` and resumes them when the new page reloads the widget.
