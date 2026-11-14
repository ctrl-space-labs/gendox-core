# Agent files — one listing, one set of tools, one output format

Plan for SRCH-1 and SRCH-3 of the [agentic platform roadmap](agentic-platform-roadmap-2026-11-10.md). Covers #550 and #559.

**Status:** design agreed on 2026-11-13. All seven steps are implemented and not yet merged.

**Goal:** an agent works with files the way a person works in a terminal. It is told which files exist, with their
metadata, and it reads, searches and looks at them with tools. The same listing, the same tools and the same output
format serve chat uploads, the knowledge base, task documents and search results.

**Not a goal:**

- File content in the context. A person may attach many files of millions of tokens; the context carries the listing only.
- A virtual file system. Paths are for reading; tools take the document id.
- Page numbers on sections, an OCR tool, or any change to how Document Insights answers.
- Changes in `gendox-frontend`. Screens are in `gendox-frontend-v2` only.

## What exists today

| Part | Today |
|---|---|
| Upload of a chat attachment | Split into sections at once, not embedded. The document row has title, type, size, pages, total tokens, created and updated. |
| The attachment in the prompt | A local context of type `ATTACHED_DOCUMENT` that points to the document and has no value, so the model sees an empty item. Images take their own path and are sent as image parts. |
| Later turns | The history sends the text of earlier messages only. |
| Document Insights | Lists supporting documents in a local context "Supporting Documents", one path per file with `size`, `pages` and `UUID` (`DocumentInsightsProcessor.generateLocalContextForQuestion`). The main document is a `./main-document/…` line followed by its text. |
| `read_document` | Whole document as numbered lines, or `line_ranges`. No limit on what it returns. |
| `regex_search` | Lines matching patterns in the given documents. Reads sections, so it needs no embeddings. |
| `advanced_search` | Semantic search over the project's knowledge only. |
| Sub-agent tools | `summarize`, `extract_relevant_sections`, `diff_documents`. |
| Page images | `DownloadService.printDocumentPages` renders pages of PDF, DOCX and PPTX. Used by digitization. |
| Skills | System skills are files under `resources/skills`, imported at startup. `SkillService.getCompletionSkills` adds `gendox-assistant` when the prompt carries a Gendox-page context, and a skill's `allowed-tools` join the turn's tools. |
| Tool results | JSON text. A tool cannot return an image to the model. |

## Design

### 1. Three things, kept apart

| Thing | Unix equivalent | Where the agent meets it |
|---|---|---|
| A file listing | `ls -l` / `find` | The session context of the turn; the result of `list_files` |
| A search hit: a part of a file | `grep -n` | The result of `advanced_search` and `regex_search`; the retrieved sections of `ALWAYS` mode |
| File content | `cat -n`, `head` | The result of `read_document` |

A knowledge-base file, an uploaded file and a search hit are different things and stay recognisable as such: the path
says where a file lives, and a hit names the file it is a part of.

### 2. The file line

The format Document Insights already uses, with two more fields. One line per file:

```
<path> | size=<size> | pages=<n> | tokens=<n> | modified=<yyyy-MM-dd HH:mm> | UUID=<document id>
```

- **Path:** `./<scope>/<title>`. It tells the agent where the file lives. Titles are not unique, so the path is never an argument.
- **UUID:** the handle every tool takes.
- **size:** bytes in a readable unit. **pages:** `-` when the type has none. **tokens:** the document's total tokens. **modified:** the last update, UTC.
- Every field is null-safe; a missing one is `-`.

Scopes:

| Path | Files |
|---|---|
| `./uploads/` | Files attached to this conversation |
| `./knowledge/` | The agent's knowledge base |
| `./supporting-documents/<main-document or questions>/<node id>/` | Supporting documents of a Document Insights run, as today |
| `./main-document/` | The document a Document Insights run is about, as today |

Later scopes (artifacts, synced connector files, sandbox files) are new paths over the same line. No code for them now.

Example, as the agent sees it in a chat:

```
./uploads
./uploads/annual-report-2025.pdf | size=2.4MB | pages=312 | tokens=410000 | modified=2026-11-12 14:03 | UUID=1c4b2e90-…
./uploads/contract-scan.pdf | size=18MB | pages=40 | tokens=85 | modified=2026-11-13 09:10 | UUID=7ab3d1f2-…
./uploads/prices.xlsx | size=88KB | pages=- | tokens=12000 | modified=2026-11-13 09:11 | UUID=9f02c7aa-…
```

Forty pages and 85 tokens is a scan: the agent can tell from the listing alone.

One class builds the line. `DocumentInsightsProcessor` calls it instead of its own string builder, so its output
changes by the two new fields and nothing else.

### 3. The listing in the context

- The `ATTACHED_DOCUMENT` contexts of a message render as one session item holding the listing, instead of one empty item per file.
- It lists **every file of the thread**, not only those of this message, so a later question still sees them. The source is the local contexts of the thread's messages: an attachment can be uploaded before its thread exists, so the thread-documents table is not a complete source.
- The listing is built when the prompt is rendered, from the document rows. Nothing is stored in the context's value, so there is nothing to migrate and the metadata is always current.
- Images are listed like any file and are still sent as image parts on the message they were attached to.

### 4. Tools

| Need | Tool | Change |
|---|---|---|
| Read a few pages at a time | `read_document` | None. It has `line_ranges` and sets no limit; the skill tells the agent to check `tokens` in the listing and read a large file by range. |
| Find exact text | `regex_search` | None. |
| Find by meaning in an uploaded file | `extract_relevant_sections` | None. A sub-agent scans the file and returns the line ranges that matter, ready for `read_document`. |
| Semantic search of the knowledge base | `advanced_search` | The output format only (section 6). It keeps searching the knowledge base and nothing else. |
| List the knowledge base | new `list_files(scope, page)` | The same lines, paged. The knowledge base is too large for the context. |
| Look at a page | new `view_page(document_id, page)` | Renders with `printDocumentPages`. The image reaches the model as base64 inside the request, the way an attached image does today; no separate upload. |
| Summarise, compare | `summarize`, `diff_documents` | None expected; to be confirmed on an uploaded file, as for `extract_relevant_sections`. |

**No embeddings for uploads.** An uploaded file is split into sections and nothing more, at upload or later. The
agent finds things in it with `regex_search`, with `read_document` by range, and with `extract_relevant_sections`
when the question is about meaning. Semantic search over uploads would need a second kind of embedding, kept apart
from the knowledge base, for a need that these three already cover. It is left out until a real case shows they do not.

**Access.** Requirement: a file tool resolves a document id only inside the scopes of its turn — this thread's
uploads, the agent's knowledge base, the documents of the running task. Specifics belong in the private tracker.

### 5. The skill `gendox-files`

A new system skill, not an extension of `gendox-assistant`: that one applies only inside the Gendox web app, while
files also arrive through the widget, the API and tasks.

```
---
name: gendox-files
description: Use when the session context lists files (an ATTACHED_FILES item, paths under ./uploads/) or the user asks about a file they attached. How to read, search and inspect files with tools, without loading them whole.
allowed-tools: read_document, regex_search, extract_relevant_sections, list_files, view_page
---
```

`advanced_search` is not in the list: whether an agent searches its knowledge base is its search mode, not this
skill.

Body, about forty lines:

- How to read a file line and what each scope means.
- `advanced_search` searches the knowledge base only. It never finds anything in an uploaded file.
- Be reasonable about what you read: `read_document` returns whatever is asked, with no limit. Look at `tokens` in the listing first.
- A small file is read whole.
- A large file is never read whole. It is searched first (`regex_search` for exact terms, `extract_relevant_sections` for meaning), then read by line range around the hits.
- Many pages with almost no tokens is a scan: look at a page before saying the file is empty.
- Answers name the file and the lines they rest on.
- Ids come from the listing or from a tool result, never invented.

**It attaches itself.** `getCompletionSkills` adds it when the turn has a file listing, the same way it adds
`gendox-assistant` for a Gendox-page context. That is also what brings the tools to an agent that does not have them:
no second mechanism.

Cost: about 80 tokens in the system prompt while files are present, and one `read_skill` call before the first file is
opened. Because the listing covers the whole thread, the skill stays attached once a thread has a file, so the prompt
prefix changes once.

### 6. Search hits and file content (SRCH-3)

A hit is the file line of its document, with where the part sits and how close it is, followed by the numbered text:

```
./knowledge/annual-report-2025.pdf | lines=2210-2248 | modified=2026-11-12 14:03 | distance=0.12 | UUID=1c4b2e90-…
2210 | Revenue grew 14% …
2211 | …
```

- The line numbers are the ones `read_document` and `regex_search` use, so a hit goes straight into `line_ranges`.
- `modified` is the source time the roadmap asks for: the document's last update, which for a synced file is its sync time.
- `AdvancedSearchTool` returns the line in the field `file` and the numbered text in `section_text`. `section_id`, `document_id` and `source` stay: the answer's sources are read from them. `document_title` and `distance` are now part of `file`.
- A section that comes from another project has no lines here: its `lines` value is `-` and its text is not numbered.
- Section templates: `SectionTemplateAuthor` gains one value, `file`, the file line with `modified` and `UUID`. Templates that do not use it are unaffected; the default section template shows it in place of the title, in a migration. Line ranges are in the tool result only.
- v2: the citation shows the modified date.

File content keeps the existing format: every line prefixed with its number, `N | line`. The numbers are what lets
the agent ask for a range and cite it, so they stay on every line.

## Steps

Each step is shippable on its own and leaves the others working.

| # | Step | Task | State |
|---|---|---|---|
| 1 | The file-line formatter; Document Insights uses it. | SRCH-1 | Done |
| 2 | The thread's files as a listing in the chat context. | SRCH-1 | Done |
| 3 | The access requirement of section 4. | SRCH-1 | Done |
| 4 | The skill `gendox-files` and its attach rule. | SRCH-1 | Done |
| 5 | The hit format in `advanced_search` and in section templates; the date on the v2 citation. | SRCH-3 | Done |
| 6 | `list_files`. | SRCH-1 | Done |
| 7 | `view_page`. | SRCH-1 | Done |

Steps 1–4 answer #550 and the "later questions" part of #559.

## Files touched

- New: the formatter `FileListing`, `ListFilesTool`, `AgentDocumentAccess` (the one access check, in place of a copy in each document tool), `ViewPageTool`, `resources/skills/gendox-files/SKILL.md`.
- Changed: `ChatTemplateAuthor`, `MessageLocalContextService`, `DocumentInsightsProcessor` (listing only), `AdvancedSearchTool`, `SectionTemplateAuthor`, `SkillService.getCompletionSkills`, the four tools that read a document, `CreateSubAgentTool` (a sub-agent is told of the same files), `MessageMetadataDTO` and `ChatSources` in v2 (the date on a citation).
- Core: `CompletionRuntimeContextResolver` gains one call that loads the thread's files for the template. For `view_page`, a tool can hand images to the loop: `ToolExecutionContext` and `ToolRound` carry them, and `CompletionService` adds them after the round's results. `CompletionTurnService` is not touched.
- One migration: the default section template (step 5).

## Verification

- Unit tests: the formatter with missing fields; the listing for a thread with files on several messages; the skill attached with and without files; a hit's line numbers against `read_document`; `extract_relevant_sections` and `regex_search` on an uploaded file.
- The loop tests of CORE-1 stay green.
- On the ephemeral stack with the mock model: the test #550 asks for — a small `.txt` with a distinctive sentence, attached, then "what does the file say", in the same turn and in a later one.
- Document Insights: a run with supporting documents before and after step 1.

As of 2026-11-14:

- The unit tests above exist and pass, except for `extract_relevant_sections` and `regex_search` on an uploaded file: the access check they share is tested on its own.
- `gendox-e2e-tests`, `chat.api`: an attached file is one line of the listing in its turn and in the next one, listed once when attached twice, and its text is not in the prompt; a search hit carries its file line and numbered text.
- `view_page`: unit tests print a real page of a Word file, refuse a page the document does not have, and check that the image reaches the next model request after the tool results and is not saved. Not run with a real model: the ephemeral stack has no provider key, and the mock model never calls it.
- Not checked: the Document Insights run; the date on the v2 citation, because the sources endpoint does not answer on the ephemeral stack (a schema it reads is not installed there).

## Decided in review, 2026-11-13

| | Question | Outcome |
|---|---|---|
| O1 | A limit on what `read_document` returns | **None.** The skill tells the agent to be reasonable; the listing gives it the token count to judge by. |
| O2 | How `view_page` returns an image | **As base64 inside the model request**, like an attached image. The tool result says which page follows; the image goes in a user message right after the round's tool results, the form every provider adapter already sends. It is not saved, so it is seen in that turn only, and a turn that pauses for a client tool resumes without it. |
| O3 | Line numbers | **On every line, as today.** Numbering fewer lines to save tokens is not pursued. |
| O4 | Embedding uploads | **Never, for now.** No semantic search over uploads: `regex_search`, reading by range and `extract_relevant_sections` cover it. |
| O5 | A thread with very many files | **The newest fifty are listed**, with a note of how many more `list_files` shows. |

## Open point

The first line of a search hit is computed from the sections of its document, once per document and search. It is
not measured on a large document yet; store the first line on the section only if it proves slow.
