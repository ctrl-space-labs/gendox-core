# WordPress Plugin

:::warning
Features of the website widget are in **experimental stage**. Please report any issues you
encounter. Currently, only PUBLIC, existing, manually created projects are supported, with
no authentication.
:::

The **Gendox WP AI Agent** plugin adds a Gendox chat widget to your WordPress site without
writing any code. Train an agent on the posts, pages and WooCommerce products you choose,
then the plugin shows the widget automatically on the pages you pick.

If you are integrating Gendox into a website that is **not** WordPress, see
[Website Widget Installation](./01-website-widget-installation.md) instead — that page
covers adding the widget `<script>` tag yourself.

## What the plugin does

- Adds a menu item, **Gendox AI Chat**, to your WordPress admin sidebar.
- Injects the chat widget on the front end, scoped to whichever post types and
  taxonomies you assign to a project.
- Exposes your posts, pages and products to Gendox so an agent can be trained on them.
- Embeds the Gendox app directly inside wp-admin so you can manage things without leaving
  WordPress.

## Install

1. In WordPress, go to **Plugins → Add New**, search for **Gendox WP AI Agent**, and
   install and activate it. (Or upload the zip from the
   [plugin's GitHub releases](https://github.com/ctrl-space-labs/gendox-wp-ai-agent).)
2. Create a Gendox account and project at [app.gendox.dev](https://app.gendox.dev) if you
   don't already have one.
3. Train your agent, then enable it: project → **Settings → AI Agent** → toggle **Public**.
   _(This step is crucial — the widget does not support authenticated end-users yet.)_
4. Copy your Gendox **API key** from the Gendox app.

## Connect WordPress to Gendox

1. In WordPress, open **Gendox AI Chat → AI Chat Settings** and paste your API key.
2. Click **Test Connection** to confirm it works.
3. Go to the **WordPress Settings** tab and click **Fetch Projects** to pull in your Gendox
   projects.
4. For each project:
   - **Assign Content** — choose which posts, pages, or products train that project's agent.
   - **Assign Chat** — choose which post types and taxonomies should display the widget.

The chat widget then appears automatically on matching pages — there's nothing to paste
into a theme or page builder.

## Self-hosted Gendox

If you run your own Gendox instance rather than using `app.gendox.dev`, set your instance's
URL under the **API Settings** tab (Chat Script URL and Gendox API Base URL).

## For developers

Registering custom [local context](./02-agent-tool-use-and-website-tool-support.md) or
browser tools works a little differently on WordPress than on a generic site, because the
plugin injects the widget script for you rather than you adding it yourself. See the
[`gendox-wordpress-integration`](/skills/gendox-wordpress-integration/SKILL.md) agent skill
for the WordPress-specific hook points, or the plugin's own
[README](https://github.com/ctrl-space-labs/gendox-wp-ai-agent#readme) and
[`docs/agent-integration.md`](https://github.com/ctrl-space-labs/gendox-wp-ai-agent/blob/main/docs/agent-integration.md).

## Related

- [Website Widget Installation](./01-website-widget-installation.md) — for non-WordPress sites
- [Agent Tool Use and Website Tool Support](./02-agent-tool-use-and-website-tool-support.md)
- [Widget Programmer Guide](./03-widget-programmer-guide.md)
