//! Curated local diagnostics: only fixed event names, never request bodies, addresses or paths.

use std::{
    fs::{self, File, OpenOptions},
    io::{self, Read, Seek, SeekFrom, Write},
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};

use tauri::{menu::{Menu, MenuItem, HELP_SUBMENU_ID}, AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

pub const COPY_MENU_ID: &str = "copy-diagnostics";
const MAX_LOG_BYTES: u64 = 256 * 1024;
const REPORT_LOG_BYTES: u64 = 16 * 1024;

/// Keeping this list typed prevents a caller from accidentally logging a token or a file path.
#[derive(Clone, Copy)]
pub enum Event {
    Started,
    ServerSelected,
    ServerConnected,
    ServerUnreachable,
    PageLoaded,
    SettingsReadFailed,
    SettingsWriteFailed,
    DownloadRequested,
    DownloadCancelled,
    DownloadSucceeded,
    DownloadFailed,
    DownloadRefused,
    DiagnosticsCopied,
    DiagnosticsCopyFailed,
}

impl Event {
    fn label(self) -> &'static str {
        match self {
            Self::Started => "app_started",
            Self::ServerSelected => "server_selected",
            Self::ServerConnected => "server_connected",
            Self::ServerUnreachable => "server_unreachable",
            Self::PageLoaded => "page_loaded",
            Self::SettingsReadFailed => "settings_read_failed",
            Self::SettingsWriteFailed => "settings_write_failed",
            Self::DownloadRequested => "download_requested",
            Self::DownloadCancelled => "download_cancelled",
            Self::DownloadSucceeded => "download_succeeded",
            Self::DownloadFailed => "download_failed",
            Self::DownloadRefused => "download_refused",
            Self::DiagnosticsCopied => "diagnostics_copied",
            Self::DiagnosticsCopyFailed => "diagnostics_copy_failed",
        }
    }
}

const EVENT_LABELS: &[&str] = &[
    "app_started", "server_selected", "server_connected", "server_unreachable", "page_loaded",
    "settings_read_failed", "settings_write_failed", "download_requested", "download_cancelled",
    "download_succeeded", "download_failed", "download_refused", "diagnostics_copied",
    "diagnostics_copy_failed",
];

struct LogFiles {
    current: PathBuf,
    previous: PathBuf,
}

impl LogFiles {
    fn new(directory: PathBuf) -> io::Result<Self> {
        fs::create_dir_all(&directory)?;
        Ok(Self { current: directory.join("desktop.log"), previous: directory.join("desktop.previous.log") })
    }

    fn append(&self, event: Event, timestamp: u64) -> io::Result<()> {
        let line = format!("{timestamp} {}\n", event.label());
        let size = fs::metadata(&self.current).map(|m| m.len()).unwrap_or(0);
        if size.saturating_add(line.len() as u64) > MAX_LOG_BYTES {
            // Replacing the previous log keeps storage bounded to two files.
            if self.previous.exists() {
                fs::remove_file(&self.previous)?;
            }
            fs::rename(&self.current, &self.previous)?;
        }
        let mut file = OpenOptions::new().create(true).append(true).open(&self.current)?;
        file.write_all(line.as_bytes())
    }

    fn recent(&self) -> io::Result<String> {
        let mut file = match File::open(&self.current) {
            Ok(file) => file,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(String::new()),
            Err(error) => return Err(error),
        };
        let offset = file.metadata()?.len().saturating_sub(REPORT_LOG_BYTES);
        file.seek(SeekFrom::Start(offset))?;
        let mut bytes = Vec::new();
        file.take(REPORT_LOG_BYTES).read_to_end(&mut bytes)?;
        let text = String::from_utf8_lossy(&bytes);
        // Only copy well-formed records. A modified log must not inject arbitrary private text.
        let mut lines = text.lines();
        if offset > 0 { lines.next(); }
        Ok(lines.filter(|line| safe_record(line)).collect::<Vec<_>>().join("\n"))
    }
}

fn safe_record(line: &str) -> bool {
    let Some((timestamp, label)) = line.split_once(' ') else { return false; };
    !timestamp.is_empty() && timestamp.bytes().all(|b| b.is_ascii_digit()) && EVENT_LABELS.contains(&label)
}

struct Diagnostics(Mutex<LogFiles>);

/// Call once during app setup, before recording lifecycle events.
pub fn initialize(app: &AppHandle) -> Result<(), &'static str> {
    let directory = app.path().app_data_dir().map_err(|_| "Diagnostics folder unavailable")?.join("logs");
    let files = LogFiles::new(directory).map_err(|_| "Cannot create diagnostics log")?;
    app.manage(Diagnostics(Mutex::new(files)));
    record(app, Event::Started);
    Ok(())
}

pub fn record(app: &AppHandle, event: Event) {
    let Some(state) = app.try_state::<Diagnostics>() else { return; };
    let Ok(files) = state.0.lock() else { return; };
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let _ = files.append(event, timestamp);
}

fn header() -> String {
    format!("Gendox Desktop {}\nSystem: {} {}\n\nRecent events (Unix seconds):\n", env!("CARGO_PKG_VERSION"), std::env::consts::OS, std::env::consts::ARCH)
}

/// Requires tauri_plugin_clipboard_manager::init() on the native builder; no JS permissions.
pub fn copy(app: &AppHandle) -> Result<(), &'static str> {
    let recent = app.try_state::<Diagnostics>()
        .and_then(|state| state.0.lock().ok().and_then(|files| files.recent().ok()))
        .unwrap_or_else(|| "Local log unavailable".into());
    let report = format!("{}{recent}\n", header());
    app.clipboard().write_text(report).map_err(|_| {
        record(app, Event::DiagnosticsCopyFailed);
        "Cannot copy diagnostics"
    })?;
    record(app, Event::DiagnosticsCopied);
    Ok(())
}

/// Adds the item to Tauri's standard Help menu. Call from the existing menu builder.
pub fn add_menu_item(app: &AppHandle, menu: &Menu<tauri::Wry>) -> tauri::Result<()> {
    if let Some(help) = menu.get(HELP_SUBMENU_ID).and_then(|item| item.as_submenu().cloned()) {
        help.append(&MenuItem::with_id(app, COPY_MENU_ID, "Copy diagnostics", true, None::<&str>)?)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT: AtomicU64 = AtomicU64::new(0);

    fn scratch() -> PathBuf {
        std::env::temp_dir().join(format!("gendox-diagnostics-{}-{}", std::process::id(), NEXT.fetch_add(1, Ordering::Relaxed)))
    }

    #[test]
    fn copied_logs_reject_unrecognized_or_modified_records() {
        let directory = scratch();
        let files = LogFiles::new(directory.clone()).unwrap();
        fs::write(&files.current, "12 app_started\n13 bearer=secret\n14 download_succeeded\n15 server_connected extra\nnot-a-time page_loaded\n").unwrap();
        assert_eq!(files.recent().unwrap(), "12 app_started\n14 download_succeeded");
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn logs_rotate_at_the_limit_and_keep_recent_events() {
        let directory = scratch();
        let files = LogFiles::new(directory.clone()).unwrap();
        fs::write(&files.current, vec![b' '; MAX_LOG_BYTES as usize]).unwrap();
        files.append(Event::Started, 20).unwrap();
        assert_eq!(fs::metadata(&files.previous).unwrap().len(), MAX_LOG_BYTES);
        assert_eq!(files.recent().unwrap(), "20 app_started");
        fs::write(&files.current, vec![b' '; MAX_LOG_BYTES as usize]).unwrap();
        files.append(Event::DownloadSucceeded, 21).unwrap();
        assert_eq!(files.recent().unwrap(), "21 download_succeeded");
        assert_eq!(fs::read_dir(&directory).unwrap().count(), 2);
        fs::remove_dir_all(directory).unwrap();
    }
}
