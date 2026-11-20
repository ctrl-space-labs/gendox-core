mod diagnostics;
mod downloads;
mod links;
mod offline;
mod server;
mod terminal;
mod folders;
mod desktop;

use std::{borrow::Cow, collections::HashMap, fs, path::PathBuf, sync::Mutex, time::Duration};

use diagnostics::Event;
use server::{Saved, Server, ServerConfig};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu, WINDOW_SUBMENU_ID};
use tauri::utils::config::{Csp, CspDirectiveSources};
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;
use url::Url;

const SERVER_PAGE: &str = "/server/";

struct ViewControls(Mutex<u16>);

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
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|_| "The server cannot be reached".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "This does not look like a Gendox server, or it is too old for the desktop app ({})",
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
            "This server needs Gendox Desktop {} or newer",
            config.min_desktop_app_version.unwrap_or_default()
        ));
    }
    Ok(config)
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
    app.restart()
}

/// Forgets a server the user added; the app restarts with the updated list.
#[tauri::command]
fn remove_server(app: AppHandle, address: String) -> Result<(), String> {
    let mut saved = load_saved(&app);
    saved.remove(&address);
    store_saved(&app, &saved)?;
    app.restart()
}

fn open_in_system_browser(app: &AppHandle, url: &Url) {
    if links::opens_externally(url) {
        let _ = app.opener().open_url(url.as_str(), None::<&str>);
    }
}

/// The platform's default menu, with "Server…" first in the app menu (macOS) or File menu.
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

pub fn run() {
    tauri::Builder::default()
        // First plugin: a second launch focuses the running app and exits.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .manage(desktop::DesktopState::default())
        .manage(ViewControls::default())
        .manage(terminal::TerminalState::new().expect("cannot initialize the terminal session"))
        .invoke_handler(tauri::generate_handler![set_server, remove_server, terminal::run_command, terminal::stop_command, terminal::command_status, folders::get_folders, folders::choose_folder, folders::remove_folder, folders::set_working_directory, desktop::notification_permission, desktop::request_notification_permission, desktop::notify, desktop::badge, desktop::activity, desktop::autostart_enabled, desktop::set_autostart, desktop::deep_links])
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
                if let Some(window) = app.get_webview_window("main") {
                    if let Ok(url) = Url::parse(&format!("{}{SERVER_PAGE}", server::app_origin())) {
                        let _ = window.navigate(url);
                    }
                }
            }
        })
        .setup(|app| {
            let _ = diagnostics::initialize(app.handle());
            desktop::setup(app.handle())?;
            let presets = server::presets();
            let saved = load_saved(app.handle());
            let current = saved.current_or(&presets);
            let origin = server::app_origin();
            let runtime_env = server::runtime_env(&current, &presets, &saved, origin);
            let script = server::init_script(&runtime_env);
            let tool_script = terminal::init_script(app.state::<terminal::TerminalState>().session_token());
            let config = current.config.as_ref().expect("the server in use has a configuration");
            let mut allowed = vec![origin.to_string()];
            allowed.extend(links::origin_of(&config.oidc_authority));

            let on_navigation = app.handle().clone();
            let on_new_window = app.handle().clone();
            let address = current.address.clone();
            let api_origin = links::origin_of(&config.api_url).expect("valid API origin");
            let oidc_origin = links::origin_of(&config.oidc_authority).expect("valid OIDC origin");
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App(offline::CONNECTING.trim_start_matches('/').into()))
                .title(format!("Gendox — {}", current.name))
                .inner_size(1280.0, 832.0)
                .min_inner_size(800.0, 600.0)
                .initialization_script(script)
                .initialization_script(tool_script)
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
                    if payload.event() == PageLoadEvent::Finished {
                        diagnostics::record(window.app_handle(), Event::PageLoaded);
                    }
                    if payload.event() == PageLoadEvent::Finished && payload.url().path() == offline::CONNECTING {
                        let address = address.clone();
                        tauri::async_runtime::spawn(async move {
                            let path = if fetch_config(&address).await.is_ok() {
                                diagnostics::record(window.app_handle(), Event::ServerConnected);
                                "/"
                            } else {
                                diagnostics::record(window.app_handle(), Event::ServerUnreachable);
                                offline::OFFLINE
                            };
                            // Do not interrupt a server choice made while the check was running.
                            if window.url().is_ok_and(|u| u.path() == offline::CONNECTING) {
                                if let Ok(url) = Url::parse(&format!("{}{path}", server::app_origin())) {
                                    let _ = window.navigate(url);
                                }
                            }
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
                .on_download(downloads::handle)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Gendox");
}

#[cfg(test)]
mod tests {
    /// Against a running server: GENDOX_TEST_SERVER=http://localhost:8107 cargo test -- --ignored
    #[test]
    #[ignore]
    fn reads_a_running_servers_client_configuration() {
        let address = std::env::var("GENDOX_TEST_SERVER").expect("GENDOX_TEST_SERVER");
        let config = tauri::async_runtime::block_on(super::fetch_config(&address)).unwrap();
        assert_eq!(config.desktop_client_id, "gendox-desktop");
        assert!(config.api_url.ends_with("/gendox/api/v1/"));
        let refused = tauri::async_runtime::block_on(super::fetch_config("http://localhost:1"));
        assert_eq!(refused.unwrap_err(), "The server cannot be reached");
    }
}
