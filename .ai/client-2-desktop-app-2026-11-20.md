# Desktop app — CLIENT-2, with the terminal as a client tool

Work status is recorded in section 10. Revised on 2026-11-20 from the [original plan](client-2-desktop-app-2026-11-19.md):
choosing the server became a page in the v2 frontend with a list of servers each build offers (section 4), since
Tauri has no native dialog that asks for text. Roadmap: [CLIENT](agentic-platform-roadmap-2026-11-10.md) (section 5, decision D4).

## 1. What it is

One Tauri 2 app for macOS, Windows and Linux that wraps the v2 web app. There is no second UI.

- **The UI is the v2 static export, shipped inside the app.** Fast start, and native features are granted only to the
  bundled origin, never to a remote page. The cost is version skew between the bundled UI and the server, handled by
  a compatibility check (section 7).
- **The server is `app.gendox.dev` by default.** A setting changes it to a self-hosted server. One build serves both.
- **The most important feature is the terminal:** the agent runs commands on the user's computer when the user chats
  from the desktop app. First as an example client tool (section 5), then with the full logic (section 6).
- **The first goal is the app running.** Desktop-only screens in the v2 frontend (settings, allowed folders) come after.
- macOS first, then Windows and Linux.

**Why Tauri and not native apps.** Native apps would mean the v2 frontend written again three times (Swift for macOS,
WinUI for Windows, GTK for Linux) and kept in step with the web. Tauri keeps one UI, the v2 web app, and one small Rust
codebase for what a browser cannot do: run commands, the menu and tray, updates, the keychain. Against Electron, the
other one-codebase option: Tauri uses the system's web view instead of shipping Chromium, so the download is about a
tenth of the size and the native side is Rust instead of Node. The price is three web engines: WebKit on macOS and
Linux, WebView2 (Chromium) on Windows, so the UI is tested on each (section 9). The same Tauri code later builds the
iOS and Android apps (CLIENT-3).

**Change to the roadmap's order (2026-11-19).** The roadmap had a terminal on the user's computer in phase 3, as
CODE-3: a runner the server drives over a connection the app opens, so a phone or Slack could run commands on the
desktop. This plan brings the terminal forward as a `CLIENT` tool instead, which works while the user chats from the
desktop app, and needs neither the runner contract of CODE-2 nor a connection of its own. Commands from mobile, Slack
and the other channels run in the cloud sandbox of CODE-2, outside this plan. The CODE-3 runner stays a later option.

## 2. Platforms and architectures

| OS | Architectures | Rust target | Package | Notes |
|---|---|---|---|---|
| macOS | Apple Silicon (arm64), Intel (x86_64) | `universal-apple-darwin` (both in one binary) | `.dmg`; `.app.tar.gz` for the updater | One download for every Mac. macOS 11.3 and later. Developer ID signing and notarization. Not the Mac App Store: its sandbox does not allow a terminal. |
| Windows | x64, ARM64 | `x86_64-pc-windows-msvc`, `aarch64-pc-windows-msvc` | NSIS `.exe` (per-user, no admin) | WebView2 is on Windows 11 and current Windows 10; the installer bootstraps it when missing. MSI for managed deployment later (the MSI toolchain does not build ARM64). |
| Linux | x86_64, arm64 | `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu` | AppImage (self-updates), `.deb`, `.rpm` | Needs WebKitGTK 4.1: Ubuntu 22.04, Debian 12, Fedora 38 and later. Built on the oldest supported distribution so the glibc requirement stays low. Flatpak and Snap later. |

Left out: 32-bit Windows and 32-bit ARM Linux. Five downloads in all.

The minimum macOS version was approved as 11.3 on 2026-11-20, matching the native WebKit download API.
The Google account-specific Earth Engine sign-in check is deferred by user decision; it does not block #584 or #585.

## 3. Repository layout

In this repository, beside the other modules: the bundled UI is built from the same commit, and one pull request can
change the API, the v2 frontend and the app together. A workflow here builds the app unsigned (section 8) and runs
only when its paths change.

No folder per OS or architecture. Tauri is one project; an architecture is a build target, and the differences per OS
are small and sit next to each other:

```
gendox-desktop/
  package.json               Tauri CLI, build scripts
  README.md
  src-tauri/
    Cargo.toml
    tauri.conf.json          shared settings
    tauri.macos.conf.json    per-OS overrides: signing, bundle formats, minimum versions
    tauri.windows.conf.json
    tauri.linux.conf.json
    presets.json             the servers this build offers; GENDOX_DESKTOP_PRESETS names another file
    capabilities/            which native calls the bundled UI may make
    icons/
    src/
      main.rs, lib.rs
      server.rs              servers, the one in use, runtime configuration
      links.rs               which addresses stay in the window
      terminal/
        mod.rs               run_command
        unix.rs              macOS and Linux shell
        windows.rs           PowerShell, process tree
```

`frontendDist` points at `gendox-frontend-v2/out`. The desktop build runs the v2 build with no environment baked in.

## 4. The shell (CLIENT-2a)

**Server and runtime configuration.** Each build carries a list of preset servers, `presets.json`, the first one used
until another is chosen. Builds for other environments differ by this file only (`GENDOX_DESKTOP_PRESETS` at build
time), as the web builds differ by their `NEXT_PUBLIC_*` variables. The default build lists `app.gendox.dev`, its
configuration built in.

Each server publishes a public `GET /gendox/api/v1/public/client-config`: API URL, OIDC authority, the desktop client
ID, server version, API version, and the lowest app version it accepts. Its public addresses come from
`GENDOX_CLIENT_API_URL` and `GENDOX_CLIENT_OIDC_AUTHORITY` where the API sits behind a proxy.

"Server…" in the app's menu opens `/server/`, a page in the v2 frontend: the presets, the servers the user added (each
can be removed), and a form to add one by address. Tauri has no native dialog that asks for text, and a page keeps the
look of the app. The page calls one native command, `set_server`: the app reads that server's client configuration,
refuses an address without https (plain http only for this computer) or a server that needs a newer app, saves the
choice in the app's settings folder, and restarts on it. `remove_server` forgets an added one. Outside the desktop app
the page says that only the app connects to other servers.

Before the UI loads, the app sets `window.__GENDOX_ENV__`, which `common.config.js` already reads, through Tauri's
initialization script, with the list of servers and the current one under `GENDOX_DESKTOP`. The v2 change is the page
alone; the configuration code stays as it is. The window lets only the bundled UI and the current server's sign-in
pages load; switching restarts the app, so that list is always the current server's.

**Sign-in.** At first inside the app window, as the web app does today, returning to the app's own origin: no v2
change. A new public Keycloak client, `gendox-desktop`, with the app's redirect URIs and web origins, added to the realm
files of every compose environment. The API's CORS allows the app's origins (`tauri://localhost` on macOS and Linux,
`http://tauri.localhost` on Windows). Sign-in in the system browser (CLIENT-2h) follows, before Google or Microsoft
sign-in is offered: those providers refuse sign-in inside embedded web views.

**What a wrapped web app gets wrong unless handled, all in the Rust side:**

- External links and `target="_blank"` open in the system browser; the window never leaves the bundled origin.
- Downloads (documents, artifacts, exports, blob URLs) open a native save dialog.
- macOS needs a native Edit menu, or copy and paste stop working. Standard shortcuts, zoom, reload.
- One instance only; a second launch focuses the running one. Window size and position are kept.
- The system proxy and the operating system's certificate store are used, so corporate networks and self-hosted
  servers with an internal CA work.
- Offline: a page that says the server cannot be reached, with Retry, not a blank window.
- Logs to a file in the app's data folder; "Copy diagnostics" in the Help menu. No telemetry.

**Security requirements.** Only the bundled origin gets native calls, through Tauri capabilities listing exactly the
commands it uses. Remote pages, iframes, artifacts and the CODE-1 sandbox get none. A Content Security Policy for the
bundle. Specifics of any weakness found belong in the private tracker.

**Spike, first:**

- The static export served by Tauri's asset protocol: trailing-slash routes, dynamic routes, reload on a deep URL.
- Keycloak sign-in inside the window and the redirect back to the app's origin; token renewal.
- WebKit (macOS, Linux) renders the v2 app as Chrome does: the editor, maps, KaTeX, streaming answers.
- The Earth Engine sign-in pop-up.

## 5. The terminal, first version — an example client tool (CLIENT-2b)

`run_command` is a client tool like `open_web_page` or any custom tool a developer adds. Nothing new in the backend:
`CLIENT` tools, the turn that waits for their results, the `role: "tool"` answer and the resume exist already (#518).

- **The tool.** Added to an agent in Agent → Tools as a custom tool with execution `CLIENT` and a JSON schema:
  `command`, `description` (what it does, in plain words). The result: `exit_code`, `stdout`, `stderr` (each capped;
  the end is kept when cut), `duration_ms`, or `declined`.
- **The handler.** The desktop app registers a handler for `run_command`, as a website registers `open_web_page`
  through the widget's `registerTool`. The handler calls the app's Rust side and returns the result to the turn.
- **Asking first.** Before every command the app shows a native dialog with the command and its description: Run or
  Cancel. A native dialog, so the v2 frontend gains no desktop screens.
- **Running.** macOS and Linux: the user's login shell (`$SHELL -l -c`), so the PATH is the one the user's terminal
  has (an app started from the Finder does not get it otherwise). Windows: PowerShell. Working folder: a `Gendox`
  folder in the user's home, created on first use. A timeout ends the whole process tree. One command at a time.
- **Only in the app.** An agent with this tool, used from the browser, calls a tool that no handler answers, as with
  any custom client tool a page did not register. Section 6 removes that.

**What a confirmation does and does not protect.** A shell command can reach anything the user can; no folder setting
confines it. The real control is the user reading the command before Run. Allowed folders (CLIENT-2f) limit the
working folder; they do not sandbox the shell.

## 6. The terminal, full logic (CLIENT-2i, later)

- **A built-in tool,** turned on per agent, not a custom tool each agent defines.
- **The server decides where a command runs.** The completion request lists the client tools the client can run
  (`clientTools: ["run_command"]`, next to `clientToolResults`). From the desktop app the call goes to the app; from
  the browser, mobile and the channels to the cloud sandbox of CODE-2 when it exists, otherwise the tool is not
  offered. The one backend change is in `CompletionRuntimeContextResolver`, which the roadmap does not reserve.
- **The model sees one tool wherever it runs:** same arguments and result in the app and in CODE-2.
- **Asking in the chat:** a card with the command, its description, Run and Decline, on whichever device the user
  chats from; rules for commands that run without asking, through APPR-1.
- **While it runs:** output streamed into the chat, duration, Stop; background commands; the "Commands" view of CODE-2
  lists the commands run on the computer too.
- **Working folder** from the allowed folders of CLIENT-2f; `cwd` and `timeout_seconds` as arguments.
- **A closed app:** what happens to a turn that waits for a command while the app is closed.

## 7. Updates and versions

Through the Tauri updater: every update package carries a signature from the Gendox update key, checked by the app, in
addition to the operating system's code signing. Built in CLIENT-2c (macOS), extended in CLIENT-2d and CLIENT-2e.

| Mode | When | What the user sees |
|---|---|---|
| **Automatic** (default) | Checks at start and every few hours | Downloads in the background, installs on the next restart; "Restart to update" in the menu. |
| **Propose** | Chosen by the user | "Version x.y is available": Update now, Later, Skip this version. |
| **Forced** | The server's lowest accepted version is above the app's, or the release is marked critical | A blocking screen: Update and restart. Nothing else works until it is done. |

- Until the settings page exists (CLIENT-2f), the mode is a choice in the app's menu, and the forced screen is a page
  of the app's own, not of the v2 frontend.
- **Release feed.** A static `latest.json` per channel (stable, beta) at the public download location (section 8), read by the updater. A
  self-hosted installation updates from the public feed; its server only states the lowest version it accepts.
- **Windows:** the NSIS installer updates in place, per user, with no administrator prompt.
- **Linux:** the AppImage updates itself. For `.deb` and `.rpm`, check whether the current updater installs them;
  otherwise the app says a version is available and links to it, until an apt and dnf repository exists.
- **Later:** an administrator turns automatic updates off through a policy (macOS configuration profile, Windows
  registry, a file under `/etc` on Linux).

**Versions.** The app has its own version (semver), apart from the server's. The server publishes its API version and
the lowest app version it accepts (section 4): an older app is forced to update; a newer app on an older server says
which server version it needs. An API change the bundled UI depends on keeps the previous behaviour for the accepted
range of app versions.

## 8. Builds, releases and signing

**Unsigned builds, in this repository (CLIENT-2a).** `.github/workflows/desktop-build.yml` builds the app for the five
targets of section 2 on GitHub-hosted runners: on a push that changes `gendox-desktop/` or `gendox-frontend-v2/`, and
by hand. No secrets: the builds are unsigned and kept as workflow artifacts for a few days, for testing on each system.
The Rust tests run in the same jobs.

**Signed releases, outside this repository (CLIENT-2c, 2d, 2e).** Signing and publishing run in a separate release
pipeline that holds the certificates and the update key; none of them enters this public repository or its workflows.
It builds from a tag of this repository, signs, and publishes the installers and `latest.json` to a public download
location, linked from a download page on gendox.dev.

What signing needs per system:

- **macOS:** an Apple Developer Program membership, a Developer ID Application certificate, and notarization by Apple.
  Without them a downloaded app is blocked by Gatekeeper.
- **Windows:** a code-signing certificate held in a cloud HSM or a signing service, so no key sits on a build disk.
  Without it SmartScreen warns on every download.
- **Linux:** no system signing; the updater signature, and GPG signatures for `.deb` and `.rpm` once there are package
  repositories.
- **Update key:** signs every update package; the app checks it. Losing it means no installed app can update again,
  so it is kept in two places.
- Later: Homebrew cask, winget, Flathub.

## 9. Testing from an Apple Silicon Mac

| Target | On the Mac | In CI |
|---|---|---|
| macOS arm64 | Native; `npm run tauri build` gives the `.app` and `.dmg` | macOS arm64 runner |
| macOS x86_64 | The Intel half of the universal app under Rosetta 2: `arch -x86_64 <app>/Contents/MacOS/<binary>` | An Intel macOS runner while GitHub offers one |
| Windows ARM64 | Windows 11 ARM in a VM (UTM, free, or Parallels): native | Windows ARM64 runner |
| Windows x64 | The same VM runs x64 apps through Windows' emulation: good for a smoke test, not for performance | Windows x64 runner; a real x64 PC or cloud VM once before each release |
| Linux arm64 | Ubuntu Desktop ARM in a VM: native | Linux arm64 runner |
| Linux x86_64 | A Docker container with `--platform linux/amd64` runs the Rust tests (through Rosetta); an emulated x86 VM is slow but works for a look | Linux x64 runner |

- **Rust tests of the terminal on all five runners.** The shells differ the most between systems: quoting, PATH, exit
  codes, ending a process tree, output encoding.
- **Desktop end-to-end tests** with `tauri-driver` (WebDriver) on the Windows and Linux runners; it does not support
  macOS. On macOS CI, a launch smoke test: the app starts, loads the bundle, reaches the server.
- **The UI itself** stays covered by the Playwright suite in a browser. Adding Playwright's WebKit project there
  approximates the web view of macOS and Linux.

## 10. Tickets

Created on 2026-11-19 with the label `needs-review`; each is a sub-issue of #583. Order: #584, #585, then a decision (below).

| Ticket | Issue | What | Waits for | Status |
|---|---|---|---|---|
| Epic | #583 | Gendox Desktop | | |
| CLIENT-2a | #584 | Build the Tauri desktop app, run locally on macOS; unsigned CI builds for every OS | Nothing | Done: review follow-ups merged on feature-desktop-app; Windows CI helper pinned to a reviewed immutable commit. macOS .app/.dmg rebuilt and native launch reached local sign-in. [Linux glib assessment](../gendox-desktop/ci/linux-dependency-review.md) complete; distribution requires reassessment and a Linux release risk decision or supported mitigation. Remote Windows/Linux CI remains unexecuted. Google account-specific check deferred by user. |
| CLIENT-2b | #585 | Terminal: `run_command` as an example client tool | #584 | Done: confirmed native runner and main-frame bridge merged on feature-desktop-app. Timeout regression stabilized with gated child/grandchild writes and a positive control; 12 stress runs passed and disabling process-group termination made the safety assertion fail. Post-merge: 30 Rust tests, separate live configuration check and 16 desktop script checks passed. Earlier native Run/Cancel, six streaming and 21 smoke checks passed. Windows/Linux execution awaits remote CI. |
| CLIENT-2c | #586 | macOS signed release and updates | #584 | Not started |
| CLIENT-2d | #587 | Windows app (x64, ARM64), then its signed release | #584; signed release after #586 | Not started |
| CLIENT-2e | #588 | Linux app (x86_64, arm64), then its signed release | #584; signed release after #586 | Not started |
| CLIENT-2f | #589 | Desktop settings and allowed folders | #585 | Not started |
| CLIENT-2g | #590 | Notifications, tray, deep links, launch at login | #584 | Not started |
| CLIENT-2h | #591 | Sign-in in the system browser | #584 | Not started |
| CLIENT-2i | #592 | Terminal: where commands run and what may run | #585, #589; APPR-1; CODE-2 for the cloud part | Not started |

**First milestone:** #584 and #585 done: a Mac app, built and tested locally, that runs commands. Then a decision:
signed macOS releases (#586), Windows and Linux (#587, #588), or the rest. The Status column says where the work
stands, kept current by whoever works on it.

CLIENT-2a is the app for every OS, developed and run on macOS first. The three release tickets are the per-OS work:
packaging, signing, updates and testing on that system.
