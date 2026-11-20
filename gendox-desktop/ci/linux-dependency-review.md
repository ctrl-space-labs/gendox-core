# Linux dependency review — 2026-11-20

Review scope: #584/#585, using the committed desktop `Cargo.lock`. No dependency
versions or advisory suppressions were changed.

## Platform scope

The locked Linux graph resolves Tauri 2.12.7, GTK 0.18.2, WebKitGTK 2.0.2 and
glib 0.18.5. Both Linux architectures include glib through the GTK/WebKitGTK
backend, including the native menu and window dependencies. Neither macOS
architecture nor either Windows architecture includes glib in its target graph.
Its presence in the shared lockfile alone does not make it part of a Mac binary.

## Reachability assessment

[RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html)
applies to glib 0.18.5. It identifies the `VariantStrIter` iterator APIs and lists
glib 0.20.0 and newer as patched.

The Linux source review found no callers of `VariantStrIter` or
`Variant::array_iter_str` in Gendox or its resolved dependencies outside glib's
own definitions, documentation and tests. Within glib 0.18.5 the iterator's
constructor is crate-private and `array_iter_str` is its only production
construction site. The review covered 417 resolved packages and 11,878 Rust
source files for the x86_64 Linux graph. The arm64 reverse dependency graph has
the same GTK/glib versions and consumers.

Conclusion: no reachable affected API was identified in the current source
graph. This is a bounded static assessment, not a Linux runtime test or a claim
that the dependency is patched. Reassess after changes to the lockfile, native
plugins or GVariant usage. Tauri's
[upstream discussion](https://github.com/tauri-apps/tauri/issues/12048)
also distinguishes the dependency advisory from use of the affected API.

## Supported mitigation and release boundary

GTK 0.18.2 requires `glib 0.18`; WebKitGTK 2.0.2 requires `glib ^0.18.0`.
The advisory lists no patched release satisfying those constraints. Adding
glib 0.20 as a direct dependency would leave the affected transitive copy in
place; forcing a replacement crosses the GTK binding family's type/API boundary.

The supported long-term remedy is a released, compatible Tauri Linux backend
using patched bindings. The upstream
[GTK4/WebKitGTK 6 migration](https://github.com/tauri-apps/tauri/pull/14684)
remains open at review time and is not a drop-in stable upgrade. The
[upstream iterator fix](https://github.com/gtk-rs/gtk-rs-core/pull/1343)
could be backported to a locally maintained glib 0.18 fork, but that would be a
separate maintenance commitment requiring Linux build/runtime verification,
not a supported registry update. No fork, unrelated upgrade, compiler workaround
or blanket advisory ignore is introduced here.

This advisory does not block the macOS merge readiness of #584/#585. Linux
artifacts remain unsigned test builds; remote Linux CI and native verification
are still outstanding. Before Linux distribution, recheck upstream remediation
and the locked graph, then apply a supported fix or make an explicit Linux
release risk decision based on current reachability evidence. This review does
not approve a Linux release or start #588.

## Reproduce the source review

From `gendox-desktop/`, run the following for `x86_64-unknown-linux-gnu`,
`aarch64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-apple-darwin`,
`x86_64-pc-windows-msvc` and `aarch64-pc-windows-msvc`:

```sh
cargo tree --locked --manifest-path src-tauri/Cargo.toml --target <target> -i glib
```

For the Linux source inventory:

```sh
cargo metadata --locked --format-version 1 \
  --filter-platform x86_64-unknown-linux-gnu \
  --manifest-path src-tauri/Cargo.toml > linux-metadata.json
```

Use `resolve.nodes[].id` to select resolved packages, then search the Rust
sources under each package's `manifest_path` directory for `VariantStrIter` and
`array_iter_str`. Inspect all matches, the constructor visibility and the
binding manifests' version constraints. Metadata contains machine-local paths;
keep that generated inventory local rather than committing it.
