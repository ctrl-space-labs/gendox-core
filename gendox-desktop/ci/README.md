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

## Linux: the glib advisory

The Linux builds include glib 0.18.5 through GTK 0.18 and WebKitGTK 2.0, which are what Tauri 2's
Linux backend uses; macOS and Windows builds do not include glib. glib 0.18.5 is affected by
[RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html), fixed in glib 0.20,
in its `VariantStrIter` iterator (reached through `Variant::array_iter_str`).

Reviewed on 2026-11-20: nothing in Gendox or its resolved Linux dependencies calls those APIs, so
no affected code is reachable. No compatible patched glib exists for GTK 0.18; the real fix is
Tauri's move to GTK 4 and WebKitGTK 6
([tauri#14684](https://github.com/tauri-apps/tauri/pull/14684), open at review time). Nothing was
forked, upgraded out of line or ignored.

This does not block macOS. **Before any Linux release**, check whether Tauri has shipped the
patched backend; if not, repeat the review and make the release decision explicitly. To repeat it:

```sh
cargo tree --locked --manifest-path src-tauri/Cargo.toml --target x86_64-unknown-linux-gnu -i glib
```

then search the sources of every resolved Linux package (`cargo metadata --locked
--filter-platform x86_64-unknown-linux-gnu`) for `VariantStrIter` and `array_iter_str`, and repeat
for `aarch64-unknown-linux-gnu`. Keep the generated metadata local: it contains machine paths.
