---
name: gendox-files
description: Use when the session context lists files (an ATTACHED_FILES item, paths under ./uploads/) or the user asks about a file they attached. How to read, search and inspect files with tools, without loading them whole.
allowed-tools: read_document, regex_search, extract_relevant_sections, list_files, view_page
---

# Working with files

A file is never placed in your context. You are told which files exist, and you read them with tools.

## The listing

One line per file: a path, then its metadata.

```
./uploads/annual-report.pdf | size=2.4MB | pages=312 | tokens=410000 | modified=2026-11-12 14:03 | UUID=1c4b2e90-…
```

- The path says where the file lives. `./uploads/` holds the files attached to this conversation, oldest
  first, so the last lines are the newest. `./knowledge/` is your knowledge base.
- `UUID` is the file's id. Every tool takes it as `document_id`. Never pass a path or a name, and never
  invent an id: take it from the listing or from a tool result.
- `tokens` is how much text the file holds. `modified` is in UTC. A value of `-` means unknown.
- "This file" or "the document I sent" is the newest file in `./uploads/`, unless the conversation is
  already about another one.

## Reading

`read_document` returns whatever you ask for, with no limit. Look at `tokens` and decide before you call it.

- **A small file** (a few thousand tokens): read it whole.
- **A large file**: never whole. Find the place first, then read only that range with `line_ranges`.
  - Exact words, names, numbers, dates: `regex_search`. It returns the matching lines with their numbers.
  - A topic or a question: `extract_relevant_sections`. It returns line ranges for `read_document`. It
    reads the whole file once to do so, so use it only when the file fits in a context window.
  - A file too large for that: `regex_search` with several patterns, or read the first lines for a table
    of contents and go from there.
- Every line you read is numbered, `N | text`. Use those numbers for the next range and when you cite.

## Looking at a page

`view_page` shows you one page as an image. A page costs far more than its text, so look only when the text
is not enough:

- Many pages and almost no tokens means a scan or an image-only file: its text was not extracted. Look at
  a page and say what it is. Do not report the file as empty.
- A table, a figure, a signature or a layout that the lines do not carry.

You see the image in this turn only. Write down what you need from it in your answer.

## The knowledge base

- `advanced_search` searches the knowledge base by meaning. It never finds anything in `./uploads/`.
- `list_files` lists the knowledge base, or every file of this conversation when the listing was cut.

## Answering

Name the file and the lines your answer rests on. If you read only a part of a file, say which part.
