//! Native save dialogs for WebView downloads, including downloads backed by blob URLs.

use std::path::Path;

use tauri::{webview::DownloadEvent, Manager, Webview};

use crate::diagnostics::{self, Event};

fn download_allowed(bundled: bool, scheme: &str) -> bool {
    bundled && matches!(scheme, "http" | "https" | "blob" | "data")
}

fn suggested_name(destination: &Path) -> String {
    let raw = destination.file_name().and_then(|name| name.to_str()).unwrap_or("download");
    let name: String = raw.chars()
        .filter(|c| !c.is_control() && !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'))
        .take(180)
        .collect();
    let name = name.trim().trim_matches('.');
    if name.is_empty() { "download".into() } else { name.into() }
}

/// Use as `.on_download(downloads::handle)` on the main webview builder.
///
/// The callback is synchronous. rfd uses AppKit's native modal run loop on macOS, so this
/// does not wait on a future dispatched back to the already-blocked webview thread.
/// No filesystem or dialog commands are made available to JavaScript.
pub fn handle(webview: Webview, event: DownloadEvent<'_>) -> bool {
    let app = webview.app_handle();
    match event {
        DownloadEvent::Requested { url, destination } => {
            let bundled = webview.url().ok()
                .and_then(|url| crate::links::origin_of(url.as_str()))
                .is_some_and(|origin| origin == crate::server::app_origin());
            if !download_allowed(bundled, url.scheme()) {
                diagnostics::record(app, Event::DownloadRefused);
                return false;
            }
            diagnostics::record(app, Event::DownloadRequested);
            let mut dialog = rfd::FileDialog::new()
                .set_title("Save download")
                .set_file_name(suggested_name(destination));
            if let Some(window) = app.get_webview_window("main") {
                dialog = dialog.set_parent(&window);
            }
            match dialog.save_file() {
                Some(path) => { *destination = path; true }
                None => { diagnostics::record(app, Event::DownloadCancelled); false }
            }
        }
        DownloadEvent::Finished { success, .. } => {
            diagnostics::record(app, if success { Event::DownloadSucceeded } else { Event::DownloadFailed });
            true
        }
        _ => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn screenshot_data_urls_can_be_saved_only_from_the_bundle() {
        for scheme in ["http", "https", "blob", "data"] {
            assert!(download_allowed(true, scheme));
            assert!(!download_allowed(false, scheme));
        }
        for scheme in ["file", "javascript", "ftp"] {
            assert!(!download_allowed(true, scheme));
        }
    }

    #[test]
    fn filenames_keep_extensions_without_path_or_control_characters() {
        assert_eq!(suggested_name(Path::new("folder/report.pdf")), "report.pdf");
        assert_eq!(suggested_name(Path::new("export\n\r:*.csv")), "export.csv");
        assert_eq!(suggested_name(Path::new("...")), "download");
        let expected = if cfg!(windows) { "name.txt" } else { "reportname.txt" };
        assert_eq!(suggested_name(Path::new("report\\name.txt")), expected);
    }
}
