---
name: artifacts
description: Use when the user asks for something substantial and standalone that they will keep, reuse or look at beside the conversation - a page, a report, a dashboard, a diagram, a long document, a code file. The content is written as an artifact, shown in its own panel, and changed with edits instead of being written again.
allowed-tools: create_artifact, update_artifact, read_artifact
---

# Artifacts

An artifact is content that stands on its own: the user sees it in a panel beside the conversation,
can open it again later, and can ask you to change it. You write it with `create_artifact` and change
it with `update_artifact`.

## When to make one

Make an artifact when the content is all of these:

- substantial: more than a screen of text, or something visual;
- standalone: it makes sense without the conversation around it;
- worth keeping: the user will read it again, reuse it, or ask for changes.

Answer in the conversation, with no artifact, for short answers, explanations, lists of a few lines,
small code snippets, and anything that only makes sense as a reply. When you are not sure, do not
make one. Make at most one artifact per message, unless the user asks for more.

## Kinds

- `html`: a complete page - a report, a dashboard, a visual summary.
- `svg`: one `<svg>` element - a diagram or an illustration.
- `markdown`: a document that is mostly text.
- `code`: source code, with its `code_language`. It is shown highlighted; it does not run.

## Writing the content

- **Self-contained.** The artifact runs sealed off: no network, no images, fonts or scripts from
  the web, no browser storage. Everything it needs is inside it. Draw with inline SVG and CSS
  instead of linking images.
- **Follow the theme.** The panel provides the app's colors and fonts as CSS variables, in light and
  dark. Use them instead of fixed colors, each with a fallback:

  ```css
  body {
    background: var(--color-background-primary, #fff);
    color: var(--color-text-primary, #222);
    font-family: var(--font-sans, system-ui, sans-serif);
  }
  ```

  The variables: `--color-background-primary`, `--color-background-secondary`,
  `--color-text-primary`, `--color-text-secondary`, `--color-border-primary`,
  `--color-accent`, `--font-sans`, `--font-mono`.
- **Compact.** Your output for one call is limited, and a call that is cut short is lost. Write
  tight markup with no filler. Build something large in steps: create a complete, smaller first
  version, then add sections with `update_artifact`.
- **Cite.** When the content comes from the project's documents, name the documents in the artifact,
  as you would in an answer.

## Changing an artifact

- Change with `edits`, not by sending the whole content again. Each edit replaces one `old_text`,
  copied exactly, that occurs once. Send the whole `content` only when most of it changes.
- If an edit fails because the text was not found or is not unique, read the artifact with
  `read_artifact` and try again with the exact text and more of its surroundings.
- When the user asks for a change to an artifact, update that artifact. Do not create a new one for
  each change.

## Artifacts this conversation was opened on

When the user opened this conversation on an artifact made elsewhere, your session context has an
`OPENED_ARTIFACTS` item listing it:

    ./artifacts
    ./artifacts/Order counter | kind=html | version=2 | role=EDIT | modified=2026-11-23 11:40 | UUID=…

- Neither the artifact nor its content is in this conversation's history. Before you change it,
  read it with `read_artifact` and its `UUID`.
- `role` is what the user may do with it. With `EDIT` or `OWNER` you may change it with
  `update_artifact`. With `VIEW` or `INTERACT` you may only read it: if the user asks for a change,
  say that its owner can give them the `EDIT` role.
- "The artifact" or "it" in the user's messages means this one, unless they say otherwise. Change
  it; do not create a new one.

## In your reply

After the tool call, say in a sentence or two what you made or changed. Do not repeat the
artifact's content in the conversation.