use std::{env, fs, path::PathBuf};

fn main() {
    // The servers a build offers. GENDOX_DESKTOP_PRESETS names another file, so builds for
    // other environments differ by this file only, as the web builds differ by their variables.
    println!("cargo:rerun-if-env-changed=GENDOX_DESKTOP_PRESETS");
    let presets = env::var("GENDOX_DESKTOP_PRESETS").unwrap_or_else(|_| "presets.json".into());
    println!("cargo:rerun-if-changed={presets}");
    let out = PathBuf::from(env::var("OUT_DIR").unwrap()).join("presets.json");
    fs::copy(&presets, out).unwrap_or_else(|e| panic!("cannot read presets {presets}: {e}"));

    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["set_server", "remove_server"]),
    ))
    .expect("failed to run tauri-build");
}
