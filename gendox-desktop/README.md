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
