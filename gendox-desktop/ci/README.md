# Desktop CI checks

`.github/workflows/desktop-build.yml` builds five unsigned downloads: a universal macOS DMG,
Windows x64 and ARM64 NSIS installers, and Linux x86_64 and arm64 AppImage, Debian and RPM
packages. Linux builds use Ubuntu 22.04 to keep the glibc baseline low. Artifacts expire after
five days. The workflow never publishes a release or signs a package.

Each job builds the bundled v2 frontend, runs the Rust tests on its native architecture, and
launches the desktop app against a loopback fixture. The fixture checks that the bundled UI
requests OIDC discovery, sends a desktop authorization-code request with PKCE, and renders
the sign-in page. It uses no accounts and does not issue tokens or contact a hosted server.

Linux and Windows use `tauri-driver` to inspect that page, load the bundled `/server/` route,
verify runtime configuration, and reload the route. macOS has no `tauri-driver` WKWebView
backend, so its launch check requires a readiness request after the fixture page renders.

`smoke.mjs` runs only with `CI=true`, creates fixture server settings with an exclusive write,
and refuses to replace any existing settings. Its own app and driver processes are stopped
and its settings file removed when the check ends. Run it on fresh CI machines. Downloaded
installers retain their production preset configuration; the fixture is a runtime setting.

The fixture and settings safeguards can also be checked without launching the app:

```bash
node --test ci/smoke.test.mjs
```

Native prerequisites and runner choices follow the
[Tauri WebDriver setup](https://v2.tauri.app/develop/tests/webdriver/manual-setup/),
[Tauri CI guide](https://v2.tauri.app/develop/tests/webdriver/ci/), and
[GitHub runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
