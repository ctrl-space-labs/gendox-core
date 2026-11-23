// One project for the desktop and mobile apps. `desktop` and `mobile` are set by tauri-build;
// what only makes sense on a computer (menus, tray, terminal, folders, loopback sign-in) is desktop only.
#[cfg(desktop)]
mod auth;
mod diagnostics;
#[cfg(desktop)]
mod downloads;
mod links;
mod offline;
mod server;
#[cfg(desktop)]
mod terminal;
#[cfg(desktop)]
mod folders;
#[cfg(desktop)]
mod desktop;

use std::{borrow::Cow, collections::HashMap, fs, path::PathBuf, time::Duration};
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(desktop)]
use std::sync::Mutex;

use diagnostics::Event;
use server::{Saved, Server, ServerConfig};
#[cfg(desktop)]
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu, WINDOW_SUBMENU_ID};
use tauri::utils::config::{Csp, CspDirectiveSources};
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

/// Tells the page that the window has no title bar and its buttons sit over the top-left corner (macOS).
#[cfg(target_os = "macos")]
const TITLE_BAR_OVERLAY_SCRIPT: &str = "document.documentElement.classList.add('frameless', 'titlebar-overlay');";

/// Windows and Linux: the window buttons the page shows in place of the title bar.
#[cfg(all(desktop, not(target_os = "macos")))]
const WINDOW_CONTROLS_SCRIPT: &str = include_str!("window-controls.js");
use url::Url;

const SERVER_PAGE: &str = "/server/";
#[cfg(mobile)]
const SERVER_SHORTCUT_URL: &str = "gendox://server";

/// The server picker, asked for from the menu or the app shortcut.
#[derive(Default)]
struct ServerPage {
    /// Until the next page finishes loading: the startup check must not replace the picker.
    requested: AtomicBool,
    /// A navigation before the first page has loaded can be replaced by it (Android launch).
    first_page_loaded: AtomicBool,
}

#[cfg(desktop)]
struct ViewControls(Mutex<u16>);

#[cfg(desktop)]
impl Default for ViewControls {
    fn default() -> Self { Self(Mutex::new(100)) }
}

fn saved_path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("servers.json"))
}

fn load_saved(app: &AppHandle) -> Saved {
    let Some(path) = saved_path(app) else {
        diagnostics::record(app, Event::SettingsReadFailed);
        return Saved::default();
    };
    match fs::read_to_string(path) {
        Ok(text) => serde_json::from_str(&text).unwrap_or_else(|_| {
            diagnostics::record(app, Event::SettingsReadFailed);
            Saved::default()
        }),
        Err(error) => {
            if error.kind() != std::io::ErrorKind::NotFound {
                diagnostics::record(app, Event::SettingsReadFailed);
            }
            Saved::default()
        }
    }
}

fn store_saved(app: &AppHandle, saved: &Saved) -> Result<(), String> {
    let failure = || {
        diagnostics::record(app, Event::SettingsWriteFailed);
        "Cannot save the server settings".to_string()
    };
    let path = saved_path(app).ok_or_else(failure)?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|_| failure())?;
    }
    let json = serde_json::to_string_pretty(saved).map_err(|_| failure())?;
    fs::write(path, json).map_err(|_| failure())
}

/// Reads the server's public client configuration and checks it before the app uses it.
async fn fetch_config(address: &str) -> Result<ServerConfig, String> {
    let url = server::client_config_url(address)?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .https_only(server::REQUIRE_HTTPS)
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|_| "The server cannot be reached".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "This does not look like a Gendox server, or it is too old for this app ({})",
            response.status()
        ));
    }
    let config: ServerConfig = response
        .json()
        .await
        .map_err(|_| "This does not look like a Gendox server".to_string())?;
    server::validate_address(&config.api_url)?;
    server::validate_address(&config.oidc_authority)?;
    let app_version = env!("CARGO_PKG_VERSION");
    if !server::version_accepted(app_version, config.min_desktop_app_version.as_deref()) {
        return Err(format!(
            "This server needs version {} or newer of the Gendox app",
            config.min_desktop_app_version.unwrap_or_default()
        ));
    }
    Ok(config)
}

/// Checks a server while the user types its address, without saving it: the picker shows a tick or the reason.
#[tauri::command]
async fn check_server(address: String) -> Result<(), String> {
    fetch_config(&server::normalize_address(&address)).await.map(|_| ())
}

/// Switches to a server, preset or new, after reading its configuration; the app restarts on it.
#[tauri::command]
async fn set_server(app: AppHandle, name: Option<String>, address: String) -> Result<(), String> {
    let address = server::normalize_address(&address);
    let config = fetch_config(&address).await.map_err(|error| {
        diagnostics::record(&app, Event::ServerUnreachable);
        error
    })?;
    diagnostics::record(&app, Event::ServerConnected);
    let name = name
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty())
        .or_else(|| Url::parse(&address).ok().and_then(|u| u.host_str().map(str::to_string)))
        .unwrap_or_else(|| address.clone());
    let mut saved = load_saved(&app);
    saved.choose(Server { name, address, config: Some(config) }, &server::presets());
    store_saved(&app, &saved)?;
    diagnostics::record(&app, Event::ServerSelected);
    restart(&app)
}

/// Forgets a server the user added; the app restarts with the updated list.
#[tauri::command]
fn remove_server(app: AppHandle, address: String) -> Result<(), String> {
    let mut saved = load_saved(&app);
    saved.remove(&address);
    store_saved(&app, &saved)?;
    restart(&app)
}

#[cfg(desktop)]
fn restart(app: &AppHandle) -> Result<(), String> {
    app.restart()
}

/// A phone app cannot start itself again: the saved choice applies the next time the app opens.
#[cfg(mobile)]
fn restart(_app: &AppHandle) -> Result<(), String> {
    Ok(())
}

fn open_in_system_browser(app: &AppHandle, url: &Url) {
    if links::opens_externally(url) {
        let _ = app.opener().open_url(url.as_str(), None::<&str>);
    }
}

fn server_page_url() -> Url {
    Url::parse(&format!("{}{SERVER_PAGE}", server::app_origin())).expect("valid server picker URL")
}

fn open_server_page(app: &AppHandle) {
    let state = app.state::<ServerPage>();
    state.requested.store(true, Ordering::Relaxed);
    if !state.first_page_loaded.load(Ordering::Relaxed) {
        return; // on_page_load opens it
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.navigate(server_page_url());
    }
}

/// The platform's default menu, with "Server…" first in the app menu (macOS) or File menu.
#[cfg(desktop)]
fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let menu = Menu::default(app)?;
    let item = MenuItem::with_id(app, "server", "Server…", true, None::<&str>)?;
    let server_menu = if cfg!(target_os = "macos") {
        menu.items()?.first().and_then(|item| item.as_submenu().cloned())
    } else {
        menu.items()?.iter().filter_map(|item| item.as_submenu())
            .find(|submenu| submenu.text().is_ok_and(|text| text == "File")).cloned()
    };
    let server_menu = match server_menu {
        Some(submenu) => submenu,
        None => {
            let submenu = Submenu::with_items(app, "File", true, &[])?;
            menu.insert(&submenu, 0)?;
            submenu
        }
    };
    server_menu.insert_items(&[&item, &PredefinedMenuItem::separator(app)?], if cfg!(target_os = "macos") { 2 } else { 0 })?;

    let view = menu.items()?.iter().filter_map(|item| item.as_submenu())
        .find(|submenu| submenu.text().is_ok_and(|text| text == "View")).cloned();
    let view = match view {
        Some(submenu) => submenu,
        None => {
            let submenu = Submenu::with_items(app, "View", true, &[])?;
            let position = menu.items()?.iter().position(|item| item.id() == WINDOW_SUBMENU_ID).unwrap_or(0);
            menu.insert(&submenu, position)?;
            submenu
        }
    };
    view.insert_items(&[
        &MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "zoom-in", "Zoom In", true, Some("CmdOrCtrl+="))?,
        &MenuItem::with_id(app, "zoom-out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
        &MenuItem::with_id(app, "zoom-reset", "Actual Size", true, Some("CmdOrCtrl+0"))?,
        &PredefinedMenuItem::separator(app)?,
    ], 0)?;
    diagnostics::add_menu_item(app, &menu)?;
    Ok(menu)
}

#[cfg(desktop)]
fn change_zoom(app: &AppHandle, action: &str) {
    let Some(window) = app.get_webview_window("main") else { return; };
    let state = app.state::<ViewControls>();
    let Ok(mut percent) = state.0.lock() else { return; };
    let next = match action {
        "zoom-in" => percent.saturating_add(10).min(300),
        "zoom-out" => percent.saturating_sub(10).max(50),
        _ => 100,
    };
    if window.set_zoom(f64::from(next) / 100.0).is_ok() { *percent = next; }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(desktop)]
    let builder = desktop_builder();
    #[cfg(mobile)]
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![check_server, set_server, remove_server]);
    let app = builder
        .manage(ServerPage::default())
        .setup(setup)
        .build(tauri::generate_context!())
        .expect("error while building Gendox");
    #[cfg(target_os = "ios")]
    {
        extern "C" {
            fn register_gendox_server_shortcut();
        }
        // Tauri has registered its scene delegate class, but UIKit has yet to connect a scene.
        unsafe { register_gendox_server_shortcut() };
    }
    app.run(|_app, _event| {
        #[cfg(mobile)]
        if let tauri::RunEvent::Opened { urls } = _event {
            if urls.iter().any(|url| url.as_str() == SERVER_SHORTCUT_URL) {
                open_server_page(_app);
            }
        }
    });
}

/// Plugins, commands and menus of the desktop app.
#[cfg(desktop)]
fn desktop_builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        // First plugin: a second launch focuses the running app and exits.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(
            // The window never has a title bar: a state saved by an older version must not bring it back.
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(tauri_plugin_window_state::StateFlags::all() - tauri_plugin_window_state::StateFlags::DECORATIONS)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .manage(desktop::DesktopState::default())
        .manage(ViewControls::default())
        .manage(terminal::TerminalState::new().expect("cannot initialize the terminal session"))
        .invoke_handler(tauri::generate_handler![check_server, set_server, remove_server, terminal::run_command, terminal::stop_command, terminal::command_status, folders::get_folders, folders::choose_folder, folders::remove_folder, folders::set_working_directory, desktop::notification_permission, desktop::request_notification_permission, desktop::notify, desktop::badge, desktop::activity, desktop::autostart_enabled, desktop::set_autostart, desktop::deep_links, auth::prepare_sign_in, auth::open_sign_in, auth::cancel_sign_in])
        .menu(build_menu)
        .on_menu_event(|app, event| {
            match event.id().0.as_str() {
                diagnostics::COPY_MENU_ID => {
                    if diagnostics::copy(app).is_err() {
                        rfd::MessageDialog::new().set_title("Gendox")
                            .set_description("The diagnostics could not be copied.")
                            .set_level(rfd::MessageLevel::Error).show();
                    }
                    return;
                }
                "reload" => {
                    if let Some(window) = app.get_webview_window("main") { let _ = window.reload(); }
                    return;
                }
                "zoom-in" | "zoom-out" | "zoom-reset" => {
                    change_zoom(app, event.id().0.as_str());
                    return;
                }
                _ => {}
            }
            if event.id() == "server" {
                open_server_page(app);
            }
        })
}

/// The main window, on the server in use. Shared by the desktop and mobile apps.
fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _ = diagnostics::initialize(app.handle());
    #[cfg(desktop)]
    desktop::setup(app.handle())?;
    let presets = server::presets();
    let saved = load_saved(app.handle());
    let current = saved.current_or(&presets);
    let origin = server::app_origin();
    let runtime_env = server::runtime_env(&current, &presets, &saved, origin);
    let script = server::init_script(&runtime_env);
    let config = current.config.as_ref().expect("the server in use has a configuration");
    let secure_saved_config = !server::REQUIRE_HTTPS
        || (server::validate_address(&config.api_url).is_ok()
            && server::validate_address(&config.oidc_authority).is_ok());

    let on_navigation = app.handle().clone();
    let on_new_window = app.handle().clone();
    let address = current.address.clone();
    let api_origin = links::origin_of(&config.api_url).expect("valid API origin");
    let oidc_origin = links::origin_of(&config.oidc_authority).expect("valid OIDC origin");
    // Desktop: sign-in happens in the system browser (auth.rs); the window never shows the sign-in pages.
    #[cfg(desktop)]
    let allowed = vec![origin.to_string()];
    #[cfg(desktop)]
    app.manage(auth::AuthState::new(oidc_origin.clone()));
    // Mobile, until the platform's sign-in session replaces it (CLIENT-3b): sign-in inside the window,
    // as the web app does, returning to the app's own origin.
    #[cfg(mobile)]
    let allowed = vec![origin.to_string(), oidc_origin.clone()];
    let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::App(offline::CONNECTING.trim_start_matches('/').into()))
        .title(format!("Gendox — {}", current.name));
    #[cfg(desktop)]
    let window = window.inner_size(1280.0, 832.0).min_inner_size(800.0, 600.0);
    // No title bar: the page's top bar takes its place. macOS keeps its window buttons, over the page.
    #[cfg(target_os = "macos")]
    let window = window
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        // Buttons centred on the 56 px top bar of the page (their centre sits about 1 pt above this y)
        .traffic_light_position(tauri::LogicalPosition::new(18.0, 29.0))
        .initialization_script(TITLE_BAR_OVERLAY_SCRIPT);
    // Windows and Linux: no title bar at all; the page draws the window buttons.
    #[cfg(all(desktop, not(target_os = "macos")))]
    let window = window.decorations(false).initialization_script(WINDOW_CONTROLS_SCRIPT);
    let window = window.initialization_script(script);
    // The client-tool host: the terminal, folders and the browser sign-in. Desktop only.
    #[cfg(desktop)]
    let window = window
        .initialization_script(terminal::init_script(app.state::<terminal::TerminalState>().session_token()))
        .on_download(downloads::handle);
    let window = window
        .on_web_resource_request(move |request, response| {
            if let Some(script) = server::bundled_config_script(&request.uri().to_string(), &runtime_env) {
                *response.body_mut() = Cow::Owned(script.into_bytes());
                response.headers_mut().insert("Content-Type", "application/javascript; charset=utf-8".parse().unwrap());
                response.headers_mut().insert("Cache-Control", "no-store".parse().unwrap());
            } else if let Some(page) = offline::page(request.uri().path()) {
                *response.body_mut() = Cow::Borrowed(page);
                response.headers_mut().insert("Content-Type", "text/html; charset=utf-8".parse().unwrap());
                response.headers_mut().insert("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'".parse().unwrap());
            } else if let Some(header) = response.headers_mut().get_mut("Content-Security-Policy") {
                // The selected self-hosted server is only known at runtime.
                if let Ok(policy) = header.to_str() {
                    let mut directives: HashMap<String, CspDirectiveSources> = Csp::Policy(policy.to_string()).into();
                    let connect = directives.entry("connect-src".into()).or_default();
                    connect.push(&api_origin);
                    connect.push(&oidc_origin);
                    *header = Csp::from(directives).to_string().parse().unwrap();
                }
            }
        })
        .on_page_load(move |window, payload| {
            if payload.event() != PageLoadEvent::Finished {
                return;
            }
            diagnostics::record(window.app_handle(), Event::PageLoaded);
            let server_page = window.state::<ServerPage>();
            server_page.first_page_loaded.store(true, Ordering::Relaxed);
            if server_page.requested.swap(false, Ordering::Relaxed) && payload.url().path() != SERVER_PAGE {
                let _ = window.navigate(server_page_url());
                return;
            }
            if payload.url().path() == offline::CONNECTING {
                let address = address.clone();
                tauri::async_runtime::spawn(async move {
                    let path = if secure_saved_config && fetch_config(&address).await.is_ok() {
                        diagnostics::record(window.app_handle(), Event::ServerConnected);
                        "/"
                    } else {
                        diagnostics::record(window.app_handle(), Event::ServerUnreachable);
                        offline::OFFLINE
                    };
                    // On the main thread, in order with the shortcut and menu: never replace a picker asked for.
                    let target = window.clone();
                    let _ = window.run_on_main_thread(move || {
                        if !target.state::<ServerPage>().requested.load(Ordering::Relaxed)
                            && target.url().is_ok_and(|u| u.path() == offline::CONNECTING)
                        {
                            let url = Url::parse(&format!("{}{path}", server::app_origin())).expect("valid startup URL");
                            let _ = target.navigate(url);
                        }
                    });
                });
            }
        })
        .on_navigation(move |url| {
            let stays = links::stays_in_app(url, &allowed);
            if !stays {
                open_in_system_browser(&on_navigation, url);
            }
            stays
        })
        // target="_blank" and window.open: the system browser, never a second window.
        .on_new_window(move |url, _features| {
            open_in_system_browser(&on_new_window, &url);
            NewWindowResponse::Deny
        })
        .build()?;
    #[cfg(target_os = "ios")]
    window.with_webview(|webview| {
        extern "C" {
            fn configure_gendox_webview(webview: *mut std::ffi::c_void);
        }
        // Tauri supplies a live WKWebView on the main thread for this callback.
        unsafe { configure_gendox_webview(webview.inner()) };
    })?;
    #[cfg(not(target_os = "ios"))]
    let _ = window;
    Ok(())
}

#[cfg(test)]
mod tests {
    /// Against a running server: GENDOX_TEST_SERVER=http://localhost:8107 cargo test -- --ignored
    #[test]
    #[ignore]
    fn reads_a_running_servers_client_configuration() {
        let address = std::env::var("GENDOX_TEST_SERVER").expect("GENDOX_TEST_SERVER");
        let config = tauri::async_runtime::block_on(super::fetch_config(&address)).unwrap();
        assert_eq!(config.desktop_client_id, "gendox-pkce-public-client-desktop");
        assert!(config.api_url.ends_with("/gendox/api/v1/"));
        let refused = tauri::async_runtime::block_on(super::fetch_config("http://localhost:1"));
        assert_eq!(refused.unwrap_err(), "The server cannot be reached");
    }
}
