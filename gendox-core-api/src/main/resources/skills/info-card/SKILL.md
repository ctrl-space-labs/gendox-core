---
name: info-card
description: Use when the user asks for a card, a fact sheet, a one-pager or an at-a-glance summary of one thing - a document, a policy, a product, a customer, a supplier, a person, a project. The card is an HTML artifact with the key facts, a short summary and the documents it comes from.
allowed-tools: create_artifact, update_artifact, read_artifact, advanced_search, read_document
---

# Info card

An info card puts the essentials of one subject on a single small page that the user can keep, look
at again and share: what it is, the few facts that matter, and where they come from. You make it as
an `html` artifact with `create_artifact`, and change it with `update_artifact`.

## Before you write

- **One subject per card.** If the user names several, ask which, or make one card each only when
  they ask for that.
- **Facts from the documents.** Find them with the project's search and, when one document is the
  subject, read it with `read_document`. Put on the card only what the documents say. If a fact the
  card would normally have is not in them, leave it out; do not fill it in from general knowledge.
- **Pick the facts that matter for this subject**, the ones a reader would look for first: for a
  policy its deadlines and conditions, for a supplier its terms and contacts, for a document its
  purpose, parties, dates and amounts. Four to eight facts, never a copy of the document.

## The card

Keep this structure, in this order:

1. **Title** - the subject's name - and one line saying what it is.
2. **Key facts** - four to eight label and value pairs. Values short: a date, an amount, a name, a
   few words.
3. **Summary** - at most three sentences.
4. **Watch out** (optional) - up to three points the reader must not miss: deadlines, exceptions,
   risks. Leave the section out when there are none.
5. **Sources** - the names of the documents the card comes from.

Start from this page and change only the text, the facts and the sections you leave out. It follows
the app's light and dark theme through the variables, and fits a narrow panel.

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:var(--color-background-primary,#fff);color:var(--color-text-primary,#222);font:14px/1.5 var(--font-sans,system-ui,sans-serif)}
.card{max-width:560px;margin:auto;border:1px solid var(--color-border-primary,#ddd);border-radius:12px;padding:18px;background:var(--color-background-secondary,#f7f7f8)}
h1{font-size:19px;margin:0}.what{color:var(--color-text-secondary,#555);margin:2px 0 14px}
dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 14px}
dl div{border:1px solid var(--color-border-primary,#ddd);border-radius:8px;padding:8px 10px;background:var(--color-background-primary,#fff)}
dt{font-size:12px;color:var(--color-text-secondary,#555)}dd{margin:0;font-weight:600}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--color-accent,#08b68d);margin:14px 0 4px}
p,ul{margin:0}ul{padding-left:18px}.src{margin-top:14px;font-size:12px;color:var(--color-text-secondary,#555)}
</style></head><body><div class="card">
<h1>Returns policy</h1><div class="what">How customers return goods bought online</div>
<dl><div><dt>Window</dt><dd>45 days from delivery</dd></div><div><dt>Needs</dt><dd>The receipt</dd></div></dl>
<h2>Summary</h2><p>Customers return goods within 45 days of delivery with the receipt, and get their money back in 5 working days.</p>
<h2>Watch out</h2><ul><li>Opened software can't be returned.</li></ul>
<div class="src">Sources: Returns policy 2026.pdf</div>
</div></body></html>
```

- Write the facts as text, never as images. No script: the card needs none.
- The artifact runs sealed off: no links to images, fonts or styles on the web. Draw anything extra
  with inline SVG.
- Give the artifact the subject's name as its `title`.

## Changing a card

- Change it with `edits` on the card the user is talking about, not by making a new card. Each edit
  replaces one `old_text`, copied exactly, that occurs once.
- If an edit fails, read the card with `read_artifact` and try again with the exact text.

## In your reply

After the tool call, say in one or two sentences what the card covers and which documents it comes
from. Do not repeat the card's facts in the conversation.