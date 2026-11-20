# Notes between runs

Findings by coding agents, newest first: dated, short, one entry per finding. When a
finding turns out to be lasting, move it into `AGENTS.md` and delete it here. This file is
public: no secrets, no absolute paths, no details of unfixed security weaknesses.

## 2026-11-10

- **Possible application issues seen while writing tests**, not changed:
  - Chat: `sendMessage` (`gendoxChat.js`) throws, without a message, when the user or the agent
    is not set yet, and the input is cleared anyway. The message is lost with no feedback.
  - A document written in the editor shows "No sections available" after saving.
