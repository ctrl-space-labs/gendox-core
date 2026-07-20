---
name: gendox-widget-integration
description: Integrate the Gendox AI chat widget into a website. Use when a developer asks to embed the Gendox widget, add a chat assistant to a webpage, wire up local page context, register browser-side tools, or handle widget lifecycle in any frontend framework.
---

# Gendox Widget Integration

## Prerequisites

1. A Gendox account with a project and a trained agent at [app.gendox.dev](https://app.gendox.dev).
2. **The agent must be Public**: open the project → **Settings → AI Agent** → toggle **Public**. The widget does not support authenticated end-users yet.
3. Copy `organizationId` and `projectId` from the Gendox webapp URL when viewing the project.

## Minimal embed

Add this script to the page (typically in `<head>`). Works with any frontend — plain HTML, Vue, Angular, Svelte, React, etc. The widget renders a chat bubble in the bottom-right corner.

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

`data-gendox-src` must match the Gendox app origin used in `src`. For self-hosted deployments, replace `https://app.gendox.dev` with your own origin.

In SPAs you can also inject the same `<script>` tag dynamically after mount; register context/tools on `script.onload` and clean them up on unmount. Prefer the static tag when the page is not a SPA.

## Position and initial open/closed state

**Initial chat state** — set on the script tag (default is closed):

- `data-gendox-chat-initial-state="closed"` — bubble only (default)
- `data-gendox-chat-initial-state="open"` — chat window open on load

Only the exact value `"open"` opens the chat; anything else is treated as closed. Change it later with `window.gendox.widget.open()` / `close()` / `updateConfig({ chatInitialState: 'open' })`.

**Move or restyle the widget** — override the container CSS (default id `gendox-chat-container-id`):

```css
#gendox-chat-container-id.gendox-chat-container-position {
  position: fixed;
  bottom: 2rem;
  right: 1rem;   /* change bottom/right/left/top to reposition */
  z-index: 1000;
}
```

To place it inside a layout panel instead of floating, create that container element yourself (same id), set `position: relative; width/height: 100%`, and append it to your panel before the script loads.

## Defaults already registered

On load, the SDK registers two built-ins (both on by default; set the matching data attribute to `"false"` to disable):

| Built-in | Type | Attribute to disable |
|----------|------|----------------------|
| **Selected text** (`SELECTED_TEXT`) | Local context provider | `data-gendox-local-context-selected-text-enabled="false"` |
| **`open_web_page`** | Tool (navigates the current tab to `args.url`) | `data-gendox-open-web-page-tool-enabled="false"` |

## Register local context

Provide extra page context to the agent when the user sends a message. Call after the script has loaded:

```js
window.gendox.widget.addLocalContextRequestCallback('PAGE_SUMMARY', () => ({
  contextType: 'PAGE_SUMMARY',
  value: document.querySelector('main')?.innerText?.slice(0, 3000) || ''
}))
```

Increase `data-gendox-local-context-max-responses` so the iframe waits for your custom callbacks (plus the default selected-text callback if still enabled).

## Register a tool

1. Define the tool in Gendox: **Project → Settings → AI Agent → Tools** (OpenAI-style JSON schema).
2. Register a browser handler with the same name:

```js
window.gendox.tools.registerTool('navigate_to_section', (args) => {
  const el = document.getElementById(args.sectionId)
  if (!el) return { success: false, error: 'Section not found' }
  el.scrollIntoView({ behavior: 'smooth' })
  return { success: true }
})
```

Validate arguments before acting. Tool results are currently one-way (not returned to the model).

`removeLocalContextRequestCallback` and `removeTool` **throw** if the name was never registered — only call them after a successful register.

## Controlling the widget

```js
window.gendox.widget.open()
window.gendox.widget.close()
window.gendox.widget.toggle()
window.gendox.widget.isOpen()        // true | false
window.gendox.widget.updateConfig({  // runtime config push to the iframe
  chatInitialState: 'open',
  localContextMaxResponses: 2,
  localContextMaxWaitMs: 1000
})
```

## Further reference

- **Local context and tools (detail)**: [skills/gendox-widget-integration/references/tools-and-local-context.md](/skills/gendox-widget-integration/references/tools-and-local-context.md)
- **Human docs**: [Website Widget docs](https://docs.gendox.dev/website-widget/website-widget-installation)
