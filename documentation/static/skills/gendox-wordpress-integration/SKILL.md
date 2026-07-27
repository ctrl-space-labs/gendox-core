---
name: gendox-wordpress-integration
description: Integrate Gendox on a WordPress site running the Gendox WP AI Agent plugin. Use when a developer or agent needs to set up the plugin, register browser-side agent tools or local context callbacks on WordPress, or understand what the plugin does and doesn't expose. Not for generic (non-WordPress) websites - use gendox-widget-integration for those.
---

# Gendox WordPress Integration

For a **WordPress site running the [Gendox WP AI Agent](https://github.com/ctrl-space-labs/gendox-wp-ai-agent) plugin**.
If the site is not WordPress, use [`gendox-widget-integration`](../gendox-widget-integration/SKILL.md) instead —
this skill only covers what differs on WordPress.

## Setup

1. In Gendox ([app.gendox.dev](https://app.gendox.dev)) create a project and train an agent.
2. Set the agent to **Public**: project → **Settings → AI Agent → Public**. The widget does
   not support authenticated end-users yet.
3. In WordPress: **Gendox AI Chat → AI Chat Settings**, paste your Gendox API key, click
   **Test Connection**.
4. **WordPress Settings** tab → **Fetch Projects**, then use **Assign Content** to pick
   which posts/pages/products feed the project, and **Assign Chat** to choose which post
   types and taxonomies display the widget.
5. If you self-host Gendox, set both URLs under **API Settings** (or the hidden page at
   `/wp-admin/admin.php?page=chat-script-settings`).

The widget then renders automatically on matching pages. You do not add a script tag
yourself — the plugin does it for you, which is exactly what makes WordPress different
from the generic embed.

## Registering local context and tools on WordPress

The [`gendox-widget-integration`](../gendox-widget-integration/SKILL.md) skill tells you to
register inside `script.onload`. **You cannot do that here** — the plugin echoes a plain
`<script>` tag during `wp_footer` (priority 10), so there is no handle to attach an
`onload` to and nothing can declare a dependency on it.

Instead, hook `wp_footer` at a **later priority** and emit your own inline script. Because
the plugin's tag is neither `async` nor `defer`, the SDK has already executed by the time
a later `wp_footer` callback runs.

### What is available, and when

Verified against the SDK source — the two halves of the API become ready at different times:

| API | Ready |
|---|---|
| `window.gendox.tools.registerTool` | **Immediately** after the SDK script executes (assigned synchronously). |
| `window.gendox.widget.addLocalContextRequestCallback` | Only after the widget initialises, which the SDK **defers to `DOMContentLoaded`** when the document is still parsing — the normal case in `wp_footer`. |

So a tool can be registered straight away, but local context must wait. Note there is no
reliable *PHP-side* way to ask "did the plugin render the widget on this page?" — the tag
is raw HTML, not a registered script handle, so `wp_script_is()` will never report it.
Detect it in JavaScript instead:

```php
add_action( 'wp_footer', function () {
    ?>
    <script>
    (function () {
      function whenGendoxReady(cb) {
        // The SDK registers its own DOMContentLoaded listener when it executes, and
        // listeners fire in registration order - so ours runs after the widget is up.
        if (window.gendox && window.gendox.widget && window.gendox.widget.addLocalContextRequestCallback) {
          cb();
        } else {
          document.addEventListener('DOMContentLoaded', cb);
        }
      }

      whenGendoxReady(function () {
        if (!window.gendox || !window.gendox.widget) return;

        window.gendox.widget.addLocalContextRequestCallback('PAGE_SUMMARY', function () {
          var main = document.querySelector('main') || document.body;
          return { contextType: 'PAGE_SUMMARY', value: main.innerText.slice(0, 3000) };
        });
      });
    })();
    </script>
    <?php
}, 20 ); // priority > 10 so this runs after the plugin's script tag
```

Registering a tool (see the widget skill for defining the matching schema in Gendox first):

```js
window.gendox.tools.registerTool('navigate_to_section', function (args) {
  var el = document.getElementById(args.sectionId);
  if (!el) return { success: false, error: 'Section not found' };
  el.scrollIntoView({ behavior: 'smooth' });
  return { success: true };
});
```

### Passing WordPress data into context

Use `wp_localize_script` or `wp_add_inline_script` on your own theme handle, or inline
values with `wp_json_encode()` — never interpolate raw post content into JavaScript.

```php
$payload = wp_json_encode( array(
    'postId'    => get_the_ID(),
    'postType'  => get_post_type(),
    'title'     => get_the_title(),
) );
```

## Limits you should know before planning work

- **The plugin emits only four attributes** on the widget tag: `src`, `data-gendox-src`,
  `data-organization-id`, `data-project-id`. The SDK's other options
  (`data-gendox-chat-initial-state`, `data-gendox-local-context-max-responses`,
  `data-gendox-local-context-max-wait-ms`, `data-gendox-open-web-page-tool-enabled`)
  are **not** configurable from the WordPress admin. Set them at runtime instead:

  ```js
  window.gendox.widget.updateConfig({ localContextMaxResponses: 2, localContextMaxWaitMs: 1000 });
  ```

  `localContextMaxResponses` defaults to 1, which is the built-in `SELECTED_TEXT`
  callback — **if you add your own context callback without raising this, your value may
  never reach the model.**

- **There are no filter hooks.** You cannot alter the injected tag from PHP. The only
  action is `GENDOX/plugin_loaded`.

- **`removeTool` and `removeLocalContextRequestCallback` throw** if the name was never
  registered. Guard them.

- **Tool results are one-way** — they are not returned to the model.

## REST API exposed to Gendox

The plugin registers read-only routes under `gendox/v1`, authenticated with the same API
key (`check_api_key_permission`):

| Route | Purpose |
|---|---|
| `GET /wp-json/gendox/v1/assigned-ids` | Post IDs assigned to a project. |
| `GET /wp-json/gendox/v1/content` | Rendered content for one post/page/product. |
| `GET /wp-json/gendox/v1/…` (organization) | Projects with assigned content and chat. |

These exist for Gendox to pull content in. They are not a general-purpose API.

## Further reference

- **Widget SDK API (detail)**: [gendox-widget-integration/references/tools-and-local-context.md](../gendox-widget-integration/references/tools-and-local-context.md)
- **Human docs**: [Website Widget on WordPress](https://docs.gendox.dev/website-widget/wordpress-plugin)
- **Plugin source**: [github.com/ctrl-space-labs/gendox-wp-ai-agent](https://github.com/ctrl-space-labs/gendox-wp-ai-agent)
