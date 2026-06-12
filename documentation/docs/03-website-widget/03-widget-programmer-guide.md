# Widget Programmer Guide

This guide is for developers who need to integrate, customize, or automate the Gendox chat widget on their site. It covers the JavaScript API, PostMessage events, initialization options, and practical examples.

:::info
For basic setup and parameters, see [Website Widget Installation](./01-website-widget-installation.md). For agent tool use (e.g. `open_web_page`), see [Agent Tool Use and Website Tool Support](./02-agent-tool-use-and-website-tool-support.md).
:::

---

## 1. Overview

The widget consists of:

- **Parent page**: Your site loads the Gendox script and hosts the iframe container.
- **Embedded iframe**: The chat UI runs inside an iframe; communication is via `postMessage`.

All programmer-facing APIs are on `window.gendox` after the script runs. The script auto-invokes `window.gendox.initializeGendoxChat()` when loaded; you can also call it yourself with overrides.

---

## 2. Script tag and data attributes

Install by adding the script (typically in `<head>`):

```html
<script
  id="gendox-chat-script"
  src="https://app.gendox.dev/gendox-sdk/gendox-widget-plugin.js"
  data-gendox-src="https://app.gendox.dev"
  data-organization-id="YOUR_ORG_ID"
  data-project-id="YOUR_PROJECT_ID"
  data-gendox-chat-initial-state="closed"
  data-gendox-local-context-selected-text-enabled="true"
  data-gendox-open-web-page-tool-enabled="true"
  data-gendox-local-context-max-responses="1"
  data-gendox-local-context-max-wait-ms="500">
</script>
```

The SDK reads configuration from **data attributes on the script tag** with `id="gendox-chat-script"`. Invalid values are replaced by defaults.

| Attribute | Parsing / validation | Default |
|-----------|----------------------|---------|
| `data-gendox-chat-initial-state` | Only `"open"` is accepted; anything else → `"closed"` | `closed` |
| `data-gendox-local-context-selected-text-enabled` | Only `"true"` and `"false"` are accepted; anything else → default | `true` |
| `data-gendox-open-web-page-tool-enabled` | Only `"true"` and `"false"` are accepted; anything else → default | `true` |
| `data-gendox-local-context-max-responses` | Positive integer; non-integer or &lt; 0 → default | `1` |
| `data-gendox-local-context-max-wait-ms` | Non-negative integer; invalid → default | `500` |

Example: starting with chat open and waiting for up to 2 local-context responses with a 1.2s timeout:

```html
<script
  id="gendox-chat-script"
  src="https://app.gendox.dev/gendox-sdk/gendox-widget-plugin.js"
  data-gendox-src="https://app.gendox.dev"
  data-organization-id="org_123"
  data-project-id="proj_456"
  data-gendox-chat-initial-state="open"
  data-gendox-local-context-selected-text-enabled="true"
  data-gendox-open-web-page-tool-enabled="true"
  data-gendox-local-context-max-responses="2"
  data-gendox-local-context-max-wait-ms="1200">
</script>
```

---

## 3. JavaScript API on the parent page

After the widget script runs, the following are available on `window.gendox`.

### 3.1 Widget control (`window.gendox.widget`)

| Method / property | Description |
|-------------------|-------------|
| `window.gendox.widget.open()` | Request the embedded chat to open. Returns `true` if the request was sent. |
| `window.gendox.widget.close()` | Request the embedded chat to close. |
| `window.gendox.widget.toggle()` | Request open if currently closed, close if open. |
| `window.gendox.widget.isOpen()` | Returns `true` or `false` (reflects last known state from the iframe). |
| `window.gendox.widget.updateConfig(partial)` | Send config updates to the iframe (e.g. `chatInitialState`, `localContextMaxResponses`, `localContextMaxWaitMs`). Takes effect immediately in the embedded chat. Returns `true` if the message was sent. |
| `window.gendox.widget.addLocalContextRequestCallback(contextType, callback)` | Register a callback under a `contextType` key. The callback receives `(event, sendResponse)` and may either return one `{ contextType, value }` object, return an array of them, or call `sendResponse(...)` directly for async work. See example in §5.4. |
| `window.gendox.widget.removeLocalContextRequestCallback(contextType)` | Remove a callback previously added with `addLocalContextRequestCallback`. |
| `window.gendox.widget.state` | Internal state object (e.g. `state.isOpen`). Prefer `isOpen()` for reading. |
| `window.gendox.widget.config` | Merged config (data attributes + `origin`). Read-only. |

These methods send a `postMessage` to the iframe. They are safe to call as soon as the script has run; if the iframe is not ready, the SDK may log a warning and the call no-ops.

Example: open chat when a button is clicked:

```javascript
document.getElementById('open-chat-btn').addEventListener('click', () => {
  window.gendox.widget.open();
});
```

### 3.2 Programmatic initialization and config updates

**Initial load:** You can (re)initialize with custom config by calling `window.gendox.initializeGendoxChat(userConfig)`. `userConfig` is merged over the config derived from data attributes (e.g. `chatInitialState`, `localContextMaxResponses`, `localContextMaxWaitMs`, `openWebPageToolEnabled`, `customStyles`). This runs when the script loads; calling it again later recreates or reuses the widget DOM but the iframe has already received its initial config, so **runtime config changes are not applied** by calling `initializeGendoxChat` again.

**Updating config after the widget is loaded:** Use `window.gendox.widget.updateConfig(partial)` to push new values into the embedded chat. The iframe applies them immediately (e.g. chat opens/closes, or the next message uses the new local-context limits).

```javascript
// Update config at any time after the widget is visible
window.gendox.widget.updateConfig({
  chatInitialState: 'open',
  localContextMaxResponses: 2,
  localContextMaxWaitMs: 1200
});
```

Example: force chat to start open and use custom CSS on first load (e.g. from a feature flag):

```javascript
window.gendox.initializeGendoxChat({
  chatInitialState: 'open',
  customStyles: `
    #gendox-chat-container-id.gendox-chat-container-position {
      bottom: 4rem;
      right: 2rem;
    }
  `
});
```

### 3.3 Tool registration (`window.gendox.tools`)

| Property / method | Description |
|------------------|-------------|
| `window.gendox.tools.allTools` | Object mapping tool name → handler function. |
| `window.gendox.tools.registerTool(name, handler)` | Register a tool. `handler(args)` receives parsed arguments; throw or return a result. |
| `window.gendox.tools.removeTool(name)` | Unregister a tool by name. |

Tool calls are triggered by the agent; the widget sends `gendox.events.chat.message.tool_calls.request` (see Events section). The SDK auto-registers the default `open_web_page` tool handler unless you disable it with `data-gendox-open-web-page-tool-enabled="false"` on the script tag, or `openWebPageToolEnabled: false` in `initializeGendoxChat(...)`. For full tool-use documentation and payload format, see [Agent Tool Use and Website Tool Support](./02-agent-tool-use-and-website-tool-support.md).

---

## 4. PostMessage events

Communication between parent and iframe uses `window.postMessage`. All Gendox events use a payload shape like:

```json
{
  "type": "event.type.name",
  "data": { ... },
  "payload": { ... }
}
```

`type` is always present. `data` or `payload` (or both) may be used depending on the event.

### 4.1 Event summary

| Event | Direction | Purpose |
|-------|-----------|---------|
| `gendox.events.initialization.request` | Iframe → Parent | Iframe asks for initial config (chat state, local-context limits). |
| `gendox.events.initialization.response` | Parent → Iframe | Parent (SDK) sends config: `chatInitialState`, `localContextMaxResponses`, `localContextMaxWaitMs`. |
| `gendox.events.embedded.chat.toggle.request` | Parent → Iframe | Parent requests state change; `data.action` is `"open"`, `"close"`, or `"toggle"`. |
| `gendox.events.embedded.chat.toggle.action` | Iframe → Parent | Iframe notifies that the window opened or closed; `data.isOpen` is boolean. |
| `gendox.events.chat.message.context.local.request` | Iframe → Parent | Chat needs local context (e.g. selected text, page content). |
| `gendox.events.chat.message.context.local.response` | Parent → Iframe | Parent sends context; `payload.contextType`, `payload.value`. |
| `gendox.events.chat.message.new.sent` | Iframe → Parent | User sent a message. |
| `gendox.events.chat.message.new.response.received` | Iframe → Parent | Completion response received. |
| `gendox.events.chat.message.tool_calls.request` | Iframe → Parent | Agent requested tool execution; payload is array of tool calls. |
| `gendox.events.embedded.config.update` | Parent → Iframe | Parent sends updated config (e.g. `chatInitialState`, `localContextMaxResponses`, `localContextMaxWaitMs`). |

Always check `event.origin` in listeners to avoid processing messages from untrusted origins.

### 4.2 Initialization handshake

1. Iframe loads and sends `gendox.events.initialization.request` (no required payload).
2. Parent SDK reads config from the script tag (or previous `initializeGendoxChat`), then sends `gendox.events.initialization.response` with a payload like:

```json
{
  "type": "gendox.events.initialization.response",
  "payload": {
    "chatInitialState": "closed",
    "localContextMaxResponses": 1,
    "localContextMaxWaitMs": 500
  }
}
```

The iframe uses this to set initial open/closed state and local-context limits for the send flow.

### 4.3 Chat window toggle

- **Parent → Iframe (request)**  
  Parent sends:

```json
{
  "type": "gendox.events.embedded.chat.toggle.request",
  "data": { "action": "open" }
}
```

`action` is one of: `"open"`, `"close"`, `"toggle"`.

- **Iframe → Parent (notification)**  
  When the window state changes, the iframe sends:

```json
{
  "type": "gendox.events.embedded.chat.toggle.action",
  "data": { "isOpen": true }
}
```

The parent SDK updates `window.gendox.widget.state.isOpen` and container CSS classes when it receives this.

### 4.4 Local context (page content for the agent)

When the user sends a message, the chat may ask the parent for “local context” (e.g. selected text or page content). The iframe sends:

- **Request (iframe → parent):** `type === 'gendox.events.chat.message.context.local.request'`.

The default SDK behavior on the parent is to auto-register a selected-text local-context callback and reply with a **local.response** event. You can register additional callbacks through the SDK, or disable the selected-text callback with `data-gendox-local-context-selected-text-enabled="false"`.

**Response (parent → iframe):**

```json
{
  "type": "gendox.events.chat.message.context.local.response",
  "payload": {
    "contextType": "SELECTED_TEXT",
    "value": "the string to include as context"
  }
}
```

`contextType` can be any string (e.g. `"SELECTED_TEXT"`, `"PAGE_HTML"`, `"CUSTOM"`). The chat backend may use it for logging or routing; the important part for the model is `value`.

The iframe waits for up to **`localContextMaxResponses`** responses (from initialization config) or until **`localContextMaxWaitMs`** has elapsed, then continues with the completion request.

---

## 5. Examples

### 5.1 Minimal embed (data attributes only)

```html
<script
  id="gendox-chat-script"
  src="https://app.gendox.dev/gendox-sdk/gendox-widget-plugin.js"
  data-gendox-src="https://app.gendox.dev"
  data-organization-id="org_abc"
  data-project-id="proj_xyz">
</script>
```

Defaults: chat starts closed, `localContextMaxResponses=1`, `localContextMaxWaitMs=500`.

### 5.2 Open chat programmatically after 2 seconds

```javascript
setTimeout(() => {
  if (window.gendox?.widget?.open) {
    window.gendox.widget.open();
  }
}, 2000);
```

### 5.3 React to chat open/close on the parent

```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://app.gendox.dev') return;
  if (event.data?.type === 'gendox.events.embedded.chat.toggle.action') {
    const isOpen = event.data.data?.isOpen;
    console.log('Chat is now', isOpen ? 'open' : 'closed');
    document.body.classList.toggle('gendox-chat-open', isOpen);
  }
});
```

### 5.4 Register local-context callbacks

Use `addLocalContextRequestCallback(contextType, callback)` to register one or more callbacks that run when the chat asks for local context. Callbacks are stored by `contextType` key, similar to tool registration. By default, the SDK auto-registers a selected-text callback under `SELECTED_TEXT`. Your callbacks can add more context, or you can disable the default selected-text callback with `data-gendox-local-context-selected-text-enabled="false"`.

Return a single object:

```javascript
window.gendox.widget.addLocalContextRequestCallback('CUSTOM_PAGE_SUMMARY', function () {
  return {
    contextType: 'CUSTOM_PAGE_SUMMARY',
    value: JSON.stringify({
      pageTitle: document.title,
      url: window.location.href,
      mainContent: document.querySelector('main')?.innerText?.slice(0, 5000) || ''
    })
  };
});
```

Return multiple context objects:

```javascript
window.gendox.widget.addLocalContextRequestCallback('PAGE_METADATA', function () {
  return [
    {
      contextType: 'PAGE_TITLE',
      value: document.title
    },
    {
      contextType: 'CURRENT_URL',
      value: window.location.href
    }
  ];
});
```

Use `sendResponse` directly for async work:

```javascript
window.gendox.widget.addLocalContextRequestCallback('API_SUMMARY', function (_event, sendResponse) {
  fetch('/api/page-summary')
    .then(response => response.text())
    .then(value => {
      sendResponse({
        contextType: 'API_SUMMARY',
        value
      });
    });
});
```
> Important: `maxResponses` must be set initially to the actual maximum number of callbacks expected. If you expect 2 callbacks, set it to 2. If you expect 0 callbacks, set it to 1. If you expect 1 callback, set it to 1.

Disable the SDK's auto-selected-text callback:

```html
<script
  id="gendox-chat-script"
  src="https://app.gendox.dev/gendox-sdk/gendox-widget-plugin.js"
  data-gendox-src="https://app.gendox.dev"
  data-organization-id="org_123"
  data-project-id="proj_456"
  data-gendox-local-context-selected-text-enabled="false">
</script>
```

If you want to remove a callback later:

```javascript
const callback = function () {
  return {
    contextType: 'CUSTOM_FLAG',
    value: 'true'
  };
};

window.gendox.widget.addLocalContextRequestCallback('CUSTOM_FLAG', callback);
window.gendox.widget.removeLocalContextRequestCallback('CUSTOM_FLAG');
```

### 5.5 Update config after the widget is loaded

Do **not** rely on calling `initializeGendoxChat` again to change config; the embedded chat only receives config at initialization. Use `updateConfig` so the iframe gets new values and applies them (e.g. open/close chat, or new local-context limits on the next message):

```javascript
// Open the chat and allow 2 local-context responses with 1.2s wait
window.gendox.widget.updateConfig({
  chatInitialState: 'open',
  localContextMaxResponses: 2,
  localContextMaxWaitMs: 1200
});
```

You can call `updateConfig` at any time (e.g. after user login, or when switching sections of your app).

### 5.6 Register a custom tool

Define the tool in your Gendox project (Settings → AI Agent → Tools) with an OpenAI-style JSON schema, then register a handler on the parent page. When the agent calls the tool, the SDK invokes your handler with the parsed arguments.

By default, the SDK registers `open_web_page`. If you want to disable that default handler entirely, set:

```html
<script
  id="gendox-chat-script"
  src="https://app.gendox.dev/gendox-sdk/gendox-widget-plugin.js"
  data-gendox-src="https://app.gendox.dev"
  data-organization-id="org_123"
  data-project-id="proj_456"
  data-gendox-open-web-page-tool-enabled="false">
</script>
```

Example: custom tool `navigate_to_section` that scrolls to a section on the page:

```javascript
// 1. In Gendox: add a tool with name "navigate_to_section" and parameters e.g. { "sectionId": "string" }

// 2. On your site: register the handler (after the widget script has run)
window.gendox.tools.removeTool('open_web_page'); // optional: remove default if you don't want it

window.gendox.tools.registerTool('navigate_to_section', function (args) {
  const el = document.getElementById(args.sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    return { status: 'ok', message: 'Scrolled to section' };
  }
  return { status: 'error', message: 'Section not found' };
});
```

Example: tool that sets a filter on the page (e.g. for a product list):

```javascript
window.gendox.tools.registerTool('set_category_filter', function (args) {
    const select = document.querySelector('[data-filter="category"]');
    if (select && args.category) {
      select.value = args.category;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return { status: 'executed', category: args.category };
    }
    return { status: 'error', message: 'Filter not found' };
});
```

API: `window.gendox.tools.registerTool(name, handler)` — `name` is the tool name (must match the tool defined in Gendox), `handler(args)` receives the parsed arguments object. Return a plain object (or throw) as the tool result. For full payload format and tool definition, see [Agent Tool Use and Website Tool Support](./02-agent-tool-use-and-website-tool-support.md).

---

## 6. Validation and fallbacks

- **Chat initial state:** Only the exact string `"open"` (case-sensitive) sets the chat to open; any other value (missing, typo, or `"closed"`) results in `closed`.
- **Selected-text local context:** `data-gendox-local-context-selected-text-enabled` accepts only `"true"` or `"false"`. Missing or invalid values fall back to `true`.
- **Default `open_web_page` tool:** `data-gendox-open-web-page-tool-enabled` accepts only `"true"` or `"false"`. Missing or invalid values fall back to `true`.
- **Integers (max-responses, max-wait-ms):** Parsed with `parseInt(..., 10)`. If the result is not a non-negative integer (for max-wait) or positive (for max-responses), the default is used. No errors are thrown; invalid attributes are silently replaced.
- **Widget methods:** `open()`, `close()`, `toggle()` return `true` if the postMessage was sent; they do not throw if the iframe is not ready (the SDK may log a console warning instead).

---

## 7. Styling and container IDs

You can override the default position and size of the widget with CSS. The container has a default id `gendox-chat-container-id` (overridable via `data-gendox-container-id`). The iframe has a default id `gendox-chat-iframe-id` (overridable via `data-gendox-iframe-id`). Target the container for layout:

```css
#gendox-chat-container-id.gendox-chat-container-position {
  position: fixed;
  bottom: 2rem;
  right: 1rem;
  z-index: 1000;
  border-radius: 20px;
}
```

For more styling options, see [Website Widget Installation](./01-website-widget-installation.md).

---

## 8. Quick reference

| Need | Where to look |
|------|----------------|
| Install script and parameters | [01. Website Widget Installation](./01-website-widget-installation.md) |
| Open/close/toggle from JS | `window.gendox.widget.open/close/toggle/isOpen()` |
| Initial state and local-context limits | Data attributes or `initializeGendoxChat({ ... })` on first load |
| Update config after load | `window.gendox.widget.updateConfig({ ... })` |
| Event names and direction | Section 4 above |
| Tool use (e.g. `open_web_page`) | [02. Agent Tool Use and Website Tool Support](./02-agent-tool-use-and-website-tool-support.md); example §5.6 |
| Custom local context | `window.gendox.widget.addLocalContextRequestCallback(fn)` (§5.4) |
