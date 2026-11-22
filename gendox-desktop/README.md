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

Sign-in uses the system browser and returns to Gendox through a one-time loopback address.
The `gendox-pkce-public-client-desktop` Keycloak client uses authorization code with PKCE and requests the
`offline_access` scope. Keycloak users need the `offline_access` realm role to receive an offline
refresh token. The app uses that token to renew your session when it reopens after access-token
expiry. Signing out revokes the token and ends the browser session.

## Downloads and diagnostics

Downloads use a native save dialog; Cancel prevents the download. The filename comes from the
web view's suggested name. Download links backed by blob URLs stay in the app until saved.

The app keeps two bounded diagnostic logs in the `logs` directory of its application data folder.
Help → Copy diagnostics copies the app version, operating system, architecture and recent events.
The events contain fixed names and timestamps: no tokens, page addresses, document names or local
paths. Nothing is sent automatically.

## Client terminal tool

`run_command` is a system tool, like the tools that run in Gendox, but the app runs it. Nothing is
added to the agent and there is no setting: every message sent from the app lists the client tools the
app runs (`clientTools` in its `GENDOX_DESKTOP` context), and the server offers the model those tools,
for that message and its resumed turn. A browser, a widget or a channel lists none, so its agents never
see `run_command`; neither does the app in Plan mode or where local commands are unavailable. An agent
tool named `run_command` is never offered. The server defines the schema (`ClientTools` in the API);
its parameters are below. In Ask mode, every command opens a frontend approval card showing the command
and its description. Decline returns `{ "declined": true }` to the agent.

```json
{
  "type": "object",
  "properties": {
    "command": { "type": "string", "description": "Shell command to run" },
    "description": { "type": "string", "description": "Why this command is needed" },
    "cwd": { "type": "string", "description": "Optional absolute working folder; requires permission" },
    "timeout_seconds": { "type": "integer", "minimum": 1, "maximum": 7200, "description": "Optional; 600 when omitted" }
  },
  "required": ["command", "description"],
  "additionalProperties": false
}
```

The app uses a login shell on macOS/Linux and PowerShell on Windows, in the user's
`Gendox` folder by default. Profile → Desktop selects the working folder, additional writable folders
and approval mode: Ask (default), Auto-approve inside permitted folders, or Plan (no local commands).
Commands run one at a time, with a
10-minute timeout unless the call sets `timeout_seconds` (at most two hours). The chat shows the output as
it arrives, the time it has run, and Stop. The result has `exit_code`, `stdout`, `stderr` and `duration_ms`;
each output stream keeps its last 64 KiB as valid UTF-8. A timed-out command (exit code 124) or a stopped one
(130) has its process tree ended. A call that waited while the app was closed is answered with `app_closed`
and never started afterwards. Command text and output are not diagnostic events.

The native runner applies a filesystem write boundary to the shell and its descendants. It allows
the chosen folders and a private command temporary directory, while protecting the app's own state.
A write elsewhere is blocked; the frontend asks the user to select another allowed folder before an
explicit retry. Retrying may repeat work from the first attempt. This does not restrict reads or
network access and is not a complete system sandbox. macOS uses Seatbelt; Linux needs `/usr/bin/bwrap`.

**It guards against accidents, not against a command written to get around it.** A mistaken or
careless command cannot change files outside the allowed folders; a deliberately crafted one may still
reach the rest of the system. Approving a command (or choosing Auto) is trusting it with everything
your user account can read and reach.
Without supported enforcement (including native Windows for now), local execution fails closed.
Windows/Linux native verification remains deferred.

The main page uses the existing client-tool request/result protocol, including readiness,
acknowledgment and duplicate handling. Bundled child frames and remote pages do not receive
the native tool host.

## Agent guidance

The API ships a `gendox-desktop` system skill through its existing skill catalog. The main desktop
chat sends capability context for the current message, so the agent can discover the skill with
`read_skill`; browser widgets do not send that context. Tool-result resumption uses the saved
message context. The skill explains approval modes, folder permissions and tool-managed local
notes. It does not configure `run_command` automatically or read and attach saved notes.

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
Allow and check the resumed answer. Inspect `/__state` to verify the initial request has
`clientToolResults: true` and the next request has `role: "tool"` with the printed output.
Reset via `/__reset?mode=desktop`, start a new thread, and repeat with Don’t allow to verify
`{ "declined": true }`. Restore the original server afterward. The fixture keeps test messages
and tool results only in memory; do not use it with sensitive inputs.

The `streaming-contract` Playwright project also checks the top-level host with a fake native
runner for both outcomes, live output, and Stop.

## Notifications and OS integration

Notification preferences and event detection live in the v2 frontend and also work in the browser.
Profile → Notifications enables them on this device; they are off by default. Only an answer
completed or an approval requested outside the visible chat produces a notification. Text is generic;
message contents and command arguments are not included. Notification clicks reopen the conversation
where supported by the OS. The native adapter also supplies a badge and a menu-bar/tray menu with
Open, Stop command and Quit. Launch at login is opt-in in Profile → Desktop.

Conversation links use `gendox://chat/<threadId>?organizationId=<orgId>&projectId=<projectId>`.
The frontend validates and routes them through the normal authentication and membership guards.
Links cannot change server. No notification is delivered after the application has exited; that
would need a separate push-delivery design. Updater controls remain unavailable until #586.

## Agent-managed local notes

Skills and system prompts can instruct the agent to keep notes or scratchpads in a hidden folder
inside the allowed workspace using `run_command`. The client provides the general tool and enforces
write permissions; it does not prescribe a memory layout, create note files, inject memory
instructions or automatically read/upload saved notes. A read requested through the tool follows
the normal command-result flow.
