# Gendox Desktop

The Gendox app for macOS, Windows and Linux: [Tauri 2](https://tauri.app) around the static export of
`gendox-frontend-v2`. The current plan is `.ai/client-2-desktop-app-2026-11-20.md`.

## Build and run

Needs Node, Yarn and Rust (`rustup`); on macOS the Xcode Command Line Tools.
The macOS app requires macOS 11.3 or later for native downloads.

```bash
npm install
npm run tauri build      # builds gendox-frontend-v2 with no environment baked in, then the app
npm test                 # Rust tests
```

On macOS the `.app` and `.dmg` land in `src-tauri/target/release/bundle/`, unsigned.

## Server

The app opens `app.gendox.dev`. Before the UI loads it sets `window.__GENDOX_ENV__`, which
`gendox-frontend-v2/src/configs/common.config.js` reads. Public settings also reach bundled
frames through `/env-config.js`; the Server page and native integration belong to the main frame.

## Downloads and diagnostics

Downloads use a native save dialog; Cancel prevents the download. The filename comes from the
web view's suggested name. Download links backed by blob URLs stay in the app until saved.

The app keeps two bounded diagnostic logs in the `logs` directory of its application data folder.
Help → Copy diagnostics copies the app version, operating system, architecture and recent events.
The events contain fixed names and timestamps: no tokens, page addresses, document names or local
paths. Nothing is sent automatically.

## Client terminal tool

Configure a custom tool on an agent with execution mode `CLIENT`, function name `run_command`,
and this parameter schema. Every command opens a native Run/Cancel dialog showing the command,
and its description. Cancel returns `{ "declined": true }` to the agent.

```json
{
  "type": "object",
  "properties": {
    "command": { "type": "string", "description": "Shell command to run" },
    "description": { "type": "string", "description": "Why this command is needed" }
  },
  "required": ["command", "description"],
  "additionalProperties": false
}
```

The app uses a login shell on macOS/Linux and PowerShell on Windows, in the user's
`Gendox` folder; that working directory is not a sandbox. Commands run one at a time, with a
60-second timeout. The result has `exit_code`, `stdout`, `stderr` and `duration_ms`; each output
stream keeps its last 64 KiB as valid UTF-8. A timed-out command and its process tree are stopped. Command text and output are not diagnostic events.

The main page uses the existing client-tool request/result protocol, including readiness,
acknowledgment and duplicate handling. Bundled child frames and remote pages do not receive
the native tool host.

## Local native tool check

The streaming fixture can return a fixed harmless `run_command` call while reading profile
and project data from an existing local ephemeral stack. It never proxies writes or calls a
model. Build the frontend first, then run from `gendox-e2e-tests`:

```bash
E2E_STREAMING_PORT=<free-loopback-port> \
E2E_DESKTOP_API_UPSTREAM=<loopback-api-url-ending-in-gendox/api/v1> \
E2E_DESKTOP_OIDC_AUTHORITY=<loopback-keycloak-realm-url> \
node fixtures/v2/chat-streaming-server.cjs
```

Both upstream URLs must be loopback addresses. Add the fixture's HTTP loopback address through
Server in the app, sign into the local test realm if needed, and send a chat message. Choose
Run and check the resumed answer; inspect `/__state` to verify the initial request has
`clientToolResults: true` and the next request has `role: "tool"` with the printed output.
Reset via `/__reset?mode=desktop`, start a new thread, and repeat with Cancel to verify
`{ "declined": true }`. Restore the original server afterward. The fixture keeps test messages
and tool results only in memory; do not use it with sensitive inputs.

The `streaming-contract` Playwright project also checks the top-level host with a fake native
runner for both outcomes. This complements the real native dialog and process checks.
