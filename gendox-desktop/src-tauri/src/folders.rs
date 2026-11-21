//! Native folder selection and filesystem enforcement. Approval policy belongs to v2.
use crate::terminal::{self, TerminalState};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command as StdCommand,
};
use tauri::{AppHandle, Manager, State, WebviewWindow};

#[derive(Clone, Serialize, Deserialize)]
pub struct Folders {
    pub folders: Vec<String>,
    pub working_directory: String,
    pub enforcement_available: bool,
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_config_dir()
        .map_err(|_| "The settings folder is unavailable")?
        .join("folders.json"))
}

#[derive(Clone)]
pub struct WriteScope {
    pub roots: Vec<PathBuf>,
    pub protected: Vec<PathBuf>,
}

pub fn load(app: &AppHandle) -> Result<Folders, String> {
    let path = settings_path(app)?;
    if path.exists() {
        let mut settings: Folders =
            serde_json::from_slice(&fs::read(path).map_err(|_| "Cannot read folder permissions")?)
                .map_err(|_| {
                    "Folder permissions are unreadable. Select folders again in settings."
                })?;
        settings.enforcement_available = enforcement_available();
        return Ok(settings);
    }
    let working = app
        .path()
        .home_dir()
        .map_err(|_| "The home folder is unavailable")?
        .join("Gendox")
        .to_string_lossy()
        .into_owned();
    let working = Path::new(&working)
        .canonicalize()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or(working);
    Ok(Folders {
        folders: vec![working.clone()],
        working_directory: working,
        enforcement_available: enforcement_available(),
    })
}

pub(crate) fn save(app: &AppHandle, settings: &Folders) -> Result<(), String> {
    let path = settings_path(app)?;
    fs::create_dir_all(path.parent().unwrap()).map_err(|_| "Cannot create the settings folder")?;
    let temporary = path.with_extension("tmp");
    fs::write(
        &temporary,
        serde_json::to_vec(settings).map_err(|_| "Cannot save folder permissions")?,
    )
    .map_err(|_| "Cannot save folder permissions")?;
    fs::rename(temporary, path).map_err(|_| "Cannot save folder permissions".into())
}

impl Folders {
    pub fn canonical_roots(&self) -> Result<Vec<PathBuf>, String> {
        self.folders
            .iter()
            .filter(|path| Path::new(path).exists())
            .map(|path| {
                let canonical = Path::new(path)
                    .canonicalize()
                    .map_err(|_| "An allowed folder is unavailable")?;
                if canonical != Path::new(path) {
                    return Err("An allowed folder has moved. Select it again in settings.".into());
                }
                Ok(canonical)
            })
            .collect()
    }
}

pub fn resolve_directory(requested: &str, folders: &Folders) -> Result<Option<PathBuf>, String> {
    let path = Path::new(requested);
    if !path.is_absolute() {
        return Ok(None);
    }
    // The built-in workspace can be created only after the frontend has approved execution.
    if !path.exists()
        && requested == folders.working_directory
        && folders.folders.iter().any(|root| root == requested)
    {
        fs::create_dir_all(path).map_err(|_| "Cannot create the working folder")?;
    }
    let Ok(directory) = path.canonicalize() else {
        return Ok(None);
    };
    if !directory.is_dir() {
        return Ok(None);
    }
    Ok(folders
        .canonical_roots()?
        .iter()
        .any(|root| directory.starts_with(root))
        .then_some(directory))
}

#[tauri::command]
pub fn get_folders(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
) -> Result<Folders, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    load(&app)
}

#[tauri::command]
pub async fn choose_folder(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
) -> Result<serde_json::Value, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    let chosen = rfd::AsyncFileDialog::new()
        .set_title("Allow Gendox to write in this folder")
        .set_parent(&webview)
        .pick_folder()
        .await;
    terminal::authorize(&webview, &session_token, state.session_token())?;
    let mut settings = load(&app)?;
    let selected = chosen.is_some();
    if let Some(folder) = chosen {
        let folder = folder
            .path()
            .canonicalize()
            .map_err(|_| "The selected folder is unavailable")?
            .to_string_lossy()
            .into_owned();
        if !settings.folders.contains(&folder) {
            settings.folders.push(folder);
        }
        save(&app, &settings)?;
    }
    let mut value = serde_json::to_value(settings).map_err(|_| "Cannot read folder permissions")?;
    value["chosen"] = selected.into();
    Ok(value)
}

#[tauri::command]
pub fn remove_folder(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
    path: String,
) -> Result<Folders, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    let mut settings = load(&app)?;
    if settings.working_directory == path {
        return Err("Choose a different working folder before removing this one.".into());
    }
    settings.folders.retain(|folder| folder != &path);
    save(&app, &settings)?;
    Ok(settings)
}

#[tauri::command]
pub fn set_working_directory(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
    path: String,
) -> Result<Folders, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    let mut settings = load(&app)?;
    if !settings.folders.contains(&path) {
        return Err("Select an allowed folder.".into());
    }
    settings.working_directory = path;
    save(&app, &settings)?;
    Ok(settings)
}

pub fn enforcement_available() -> bool {
    #[cfg(target_os = "macos")]
    {
        Path::new("/usr/bin/sandbox-exec").is_file()
    }
    #[cfg(target_os = "linux")]
    {
        Path::new("/usr/bin/bwrap").is_file()
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        false
    }
}

#[cfg(target_os = "macos")]
fn quoted(path: &Path) -> Result<String, String> {
    let path = path.to_str().ok_or("Folder names must be valid UTF-8")?;
    serde_json::to_string(path).map_err(|_| "Cannot encode the folder permission".into())
}

// This is a filesystem write boundary, not a network or whole-system sandbox.
pub fn restrict(
    command: &mut tokio::process::Command,
    roots: &[PathBuf],
    protected: &[PathBuf],
) -> Result<(), String> {
    if !enforcement_available() {
        return Err(
            "Folder write protection is unavailable on this platform. Local commands are disabled."
                .into(),
        );
    }
    let original = command.as_std();
    let program = original.get_program().to_owned();
    let args: Vec<_> = original.get_args().map(ToOwned::to_owned).collect();
    // Unused only where no write protection exists and the function returns early.
    #[cfg_attr(not(any(target_os = "macos", target_os = "linux")), allow(unused_variables))]
    let cwd = original.get_current_dir().map(ToOwned::to_owned);
    #[cfg(target_os = "macos")]
    let mut wrapped = {
        let mut profile = String::from("(version 1)(allow default)(deny file-write*)");
        profile.push_str("(allow file-write* (literal \"/dev/null\") (literal \"/dev/tty\"))");
        for root in roots {
            profile.push_str(&format!("(allow file-write* (subpath {}))", quoted(root)?));
        }
        for path in protected {
            profile.push_str(&format!("(deny file-write* (subpath {}))", quoted(path)?));
        }
        let mut wrapper = StdCommand::new("/usr/bin/sandbox-exec");
        wrapper.args(["-p", &profile]).arg(program).args(args);
        wrapper
    };
    #[cfg(target_os = "linux")]
    let mut wrapped = {
        let mut wrapper = StdCommand::new("/usr/bin/bwrap");
        wrapper.args([
            "--die-with-parent",
            "--new-session",
            "--ro-bind",
            "/",
            "/",
            "--dev",
            "/dev",
            "--proc",
            "/proc",
        ]);
        for root in roots {
            wrapper.arg("--bind").arg(root).arg(root);
        }
        for path in protected.iter().filter(|path| path.exists()) {
            wrapper.arg("--ro-bind").arg(path).arg(path);
        }
        wrapper.arg("--").arg(program).args(args);
        wrapper
    };
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    let mut wrapped = {
        let _ = (roots, protected, program, args);
        return Err("Folder write protection is unavailable".into());
        #[allow(unreachable_code)]
        StdCommand::new("")
    };
    if let Some(cwd) = cwd {
        wrapped.current_dir(cwd);
    }
    *command = wrapped.into();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn directory_checks_use_canonical_component_boundaries() {
        let root = std::env::temp_dir().join(format!("gendox-folders-{}", std::process::id()));
        let allowed = root.join("allowed");
        let outside = root.join("allowed-other");
        fs::create_dir_all(&allowed).unwrap();
        fs::create_dir_all(&outside).unwrap();
        let allowed = allowed.canonicalize().unwrap();
        let settings = Folders {
            folders: vec![allowed.to_string_lossy().into()],
            working_directory: allowed.to_string_lossy().into(),
            enforcement_available: false,
        };
        assert!(resolve_directory(allowed.to_str().unwrap(), &settings)
            .unwrap()
            .is_some());
        assert!(resolve_directory(outside.to_str().unwrap(), &settings)
            .unwrap()
            .is_none());
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&outside, allowed.join("escape")).unwrap();
            assert!(
                resolve_directory(allowed.join("escape").to_str().unwrap(), &settings)
                    .unwrap()
                    .is_none()
            );
        }
        fs::remove_dir_all(root).unwrap();
    }
}
