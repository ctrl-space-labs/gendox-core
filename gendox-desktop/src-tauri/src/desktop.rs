//! Operating-system adapters. Frontend code decides notification and approval behavior.
use crate::terminal::{self, TerminalState};
use serde::Deserialize;
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, State, WebviewWindow};
use tauri_plugin_autostart::ManagerExt as AutostartExt;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_notification::NotificationExt;

const MAX_QUEUED_LINKS: usize = 16;

#[derive(Default)]
pub struct DesktopState {
    stop: Mutex<Option<MenuItem<tauri::Wry>>>,
    links: Mutex<Vec<String>>,
    initial_links: Mutex<bool>,
}

pub(crate) fn emit(app: &AppHandle, detail: serde_json::Value) {
    if let Some(window) = app.get_webview_window("main") {
        if window.url().is_ok_and(|url| {
            crate::links::origin_of(url.as_str()).as_deref() == Some(crate::server::app_origin())
        }) {
            let _ = window.eval(format!(
                "window.dispatchEvent(new CustomEvent('gendox.native', {{detail:{detail}}}));"
            ));
        }
    }
}

fn focus(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "desktop-open", "Open Gendox", true, None::<&str>)?;
    let stop = MenuItem::with_id(app, "desktop-stop", "Stop command", false, None::<&str>)?;
    let quit = MenuItem::with_id(app, "desktop-quit", "Quit Gendox", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &stop, &quit])?;
    let mut tray = TrayIconBuilder::with_id("gendox")
        .menu(&menu)
        .tooltip("Gendox");
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.on_menu_event(|app, event| match event.id().as_ref() {
        "desktop-open" => focus(app),
        "desktop-quit" => app.exit(0),
        "desktop-stop" => {
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                app.state::<TerminalState>().stop().await;
            });
        }
        _ => {}
    })
    .build(app)?;
    *app.state::<DesktopState>().stop.lock().unwrap() = Some(stop);
    let notifications = app.clone();
    let _ = app.notification().on_action(move |action| {
        focus(&notifications);
        emit(
            &notifications,
            serde_json::json!({ "type": "notification", "action": action }),
        );
    });
    let links = app.clone();
    app.deep_link().on_open_url(move |event| {
        let urls: Vec<String> = event.urls().iter().map(ToString::to_string).collect();
        {
            // Links queue only until the UI reads them; another program must not grow it unbounded.
            let state = links.state::<DesktopState>();
            let mut queue = state.links.lock().unwrap();
            queue.extend(urls.clone());
            let excess = queue.len().saturating_sub(MAX_QUEUED_LINKS);
            queue.drain(..excess);
        }
        focus(&links);
        emit(
            &links,
            serde_json::json!({ "type": "deep-link", "urls": urls }),
        );
    });
    Ok(())
}

#[tauri::command]
pub fn notification_permission(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
) -> Result<String, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    app.notification()
        .permission_state()
        .map(|state| format!("{state:?}").to_lowercase())
        .map_err(|_| "Cannot read notification permission".into())
}

#[tauri::command]
pub fn request_notification_permission(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
) -> Result<String, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    app.notification()
        .request_permission()
        .map(|state| format!("{state:?}").to_lowercase())
        .map_err(|_| "Cannot request notification permission".into())
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Notice {
    pub id: i32,
    pub title: String,
    pub body: String,
}

#[tauri::command]
pub fn notify(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
    notice: Notice,
) -> Result<(), String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    if notice.title.len() > 200 || notice.body.len() > 500 {
        return Err("The notification is too long".into());
    }
    app.notification()
        .builder()
        .id(notice.id)
        .title(notice.title)
        .body(notice.body)
        .show()
        .map_err(|_| "Cannot show the notification".into())
}

#[tauri::command]
pub fn badge(
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
    count: i64,
) -> Result<(), String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    webview
        .set_badge_count(Some(count.clamp(0, 999)))
        .map_err(|_| "Cannot update the badge".into())
}

#[tauri::command]
pub fn activity(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
    running: bool,
) -> Result<(), String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    if let Some(stop) = app.state::<DesktopState>().stop.lock().unwrap().as_ref() {
        let _ = stop.set_enabled(running);
    }
    if let Some(tray) = app.tray_by_id("gendox") {
        let _ = tray.set_tooltip(Some(if running {
            "Gendox — command running"
        } else {
            "Gendox"
        }));
    }
    Ok(())
}

#[tauri::command]
pub fn autostart_enabled(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
) -> Result<bool, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    app.autolaunch()
        .is_enabled()
        .map_err(|_| "Cannot read launch-at-login status".into())
}

#[tauri::command]
pub fn set_autostart(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
    enabled: bool,
) -> Result<(), String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    let result = if enabled {
        app.autolaunch().enable()
    } else {
        app.autolaunch().disable()
    };
    result.map_err(|_| "Cannot change launch-at-login. Check the operating system settings.".into())
}

#[tauri::command]
pub fn deep_links(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    session_token: String,
) -> Result<Vec<String>, String> {
    terminal::authorize(&webview, &session_token, state.session_token())?;
    let desktop = app.state::<DesktopState>();
    let mut links = std::mem::take(&mut *desktop.links.lock().unwrap());
    let mut initial = desktop.initial_links.lock().unwrap();
    if !*initial {
        *initial = true;
        if let Ok(Some(current)) = app.deep_link().get_current() {
            links.extend(current.iter().map(ToString::to_string));
        }
    }
    Ok(links)
}
