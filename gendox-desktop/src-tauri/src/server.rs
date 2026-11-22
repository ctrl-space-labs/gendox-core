//! The servers the app can use, the one in use, and the runtime configuration the bundled UI
//! reads from `window.__GENDOX_ENV__` (see `gendox-frontend-v2/src/configs/common.config.js`).

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use url::Url;

pub const REQUIRE_HTTPS: bool = cfg!(all(target_os = "android", not(debug_assertions)));

/// The origin the bundled UI is served from: Tauri's asset protocol (http on Windows and Android).
pub fn app_origin() -> &'static str {
    if cfg!(any(windows, target_os = "android")) {
        "http://tauri.localhost"
    } else {
        "tauri://localhost"
    }
}

/// What a server's `GET /public/client-config` returns, the fields the app uses.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerConfig {
    pub api_url: String,
    pub oidc_authority: String,
    pub desktop_client_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min_desktop_app_version: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Server {
    pub name: String,
    pub address: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config: Option<ServerConfig>,
}

/// What the app keeps between launches: the server in use and the ones the user added.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct Saved {
    #[serde(default)]
    pub current: Option<Server>,
    #[serde(default)]
    pub custom: Vec<Server>,
}

/// The servers this build offers (see build.rs).
pub fn presets() -> Vec<Server> {
    serde_json::from_str(include_str!(concat!(env!("OUT_DIR"), "/presets.json")))
        .expect("presets.json is a list of servers")
}

impl Saved {
    /// The server in use: the saved one, or else the first preset.
    pub fn current_or(&self, presets: &[Server]) -> Server {
        self.current
            .clone()
            .filter(|s| s.config.is_some())
            .unwrap_or_else(|| presets[0].clone())
    }

    /// Makes `server` current; one the presets do not list is kept as a custom server.
    pub fn choose(&mut self, server: Server, presets: &[Server]) {
        let key = normalize_address(&server.address);
        let is_preset = presets.iter().any(|p| normalize_address(&p.address) == key);
        self.custom.retain(|s| normalize_address(&s.address) != key);
        if !is_preset {
            self.custom.push(server.clone());
        }
        self.current = Some(server);
    }

    /// Forgets a custom server; when it was in use, the first preset is used again.
    pub fn remove(&mut self, address: &str) {
        let key = normalize_address(address);
        self.custom.retain(|s| normalize_address(&s.address) != key);
        if self.current.as_ref().is_some_and(|c| normalize_address(&c.address) == key) {
            self.current = None;
        }
    }
}

/// Trim whitespace and any trailing slash from a server address.
pub fn normalize_address(address: &str) -> String {
    address.trim().trim_end_matches('/').to_string()
}

pub fn validate_address(address: &str) -> Result<Url, String> {
    validate_address_with_policy(address, REQUIRE_HTTPS)
}

fn validate_address_with_policy(address: &str, require_https: bool) -> Result<Url, String> {
    let url = Url::parse(&normalize_address(address)).map_err(|_| "Not a valid address".to_string())?;
    let local = matches!(url.host_str(), Some("localhost") | Some("127.0.0.1") | Some("[::1]"))
        || url.host_str().is_some_and(|h| h.ends_with(".localhost"))
        // The Android emulator reaches the developer's computer as 10.0.2.2. Debug builds only.
        || (cfg!(all(target_os = "android", debug_assertions)) && url.host_str() == Some("10.0.2.2"));
    match url.scheme() {
        "https" => Ok(url),
        "http" if require_https => Err("Use https for the server address".into()),
        "http" if local => Ok(url),
        "http" => Err("Use https; plain http is allowed only for this computer".into()),
        _ => Err("The address must start with https://".into()),
    }
}

/// Where a server publishes its client configuration. The address is the server's web
/// address or its API address (`…/gendox/api/v1`).
pub fn client_config_url(address: &str) -> Result<String, String> {
    let url = validate_address(address)?;
    let base = url.as_str().trim_end_matches('/').to_string();
    let api = if base.ends_with("/gendox/api/v1") { base } else { format!("{base}/gendox/api/v1") };
    Ok(format!("{api}/public/client-config"))
}

/// Whether this app is new enough for a server that accepts `minimum` and newer.
pub fn version_accepted(app: &str, minimum: Option<&str>) -> bool {
    fn parts(v: &str) -> Vec<u64> {
        v.split(['.', '-']).take(3).map(|p| p.parse().unwrap_or(0)).collect()
    }
    minimum.is_none_or(|m| parts(app) >= parts(m))
}

/// The values the v2 frontend reads at runtime, and the desktop's own under `GENDOX_DESKTOP`.
pub fn runtime_env(current: &Server, presets: &[Server], saved: &Saved, origin: &str) -> Value {
    let config = current.config.as_ref().expect("the server in use has a configuration");
    let list = |servers: &[Server], custom: bool| -> Vec<Value> {
        servers
            .iter()
            .map(|s| json!({ "name": s.name, "address": s.address, "custom": custom }))
            .collect()
    };
    let mut servers = list(presets, false);
    servers.extend(list(&saved.custom, true));
    json!({
        "NEXT_PUBLIC_GENDOX_URL": config.api_url,
        "NEXT_PUBLIC_OIDC_AUTHORITY": config.oidc_authority,
        "NEXT_PUBLIC_OIDC_CLIENT_ID": config.desktop_client_id,
        "NEXT_PUBLIC_OIDC_REDIRECT_URI": format!("{origin}/oidc-callback/"),
        "NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI": format!("{origin}/login"),
        "NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI": format!("{origin}/silent-renew"),
        // The desktop client keeps the user signed in for days with a refresh token (offline_access, #593)
        "NEXT_PUBLIC_OIDC_SCOPE": "openid profile email offline_access",
        "GENDOX_DESKTOP": {
            "mobile": cfg!(mobile),
            "version": env!("CARGO_PKG_VERSION"),
            "current": { "name": current.name, "address": current.address },
            "servers": servers,
        },
    })
}

/// Script run before any page script. The bundle's `/env-config.js` assigns an empty
/// object to `window.__GENDOX_ENV__`; a getter with a no-op setter keeps the app's values.
pub fn init_script(env: &Value) -> String {
    let origin = serde_json::to_string(app_origin()).expect("the app origin is a string");
    format!(
        "(function () {{ if (window.top !== window || location.protocol + '//' + location.host !== {origin}) return; \
         var env = Object.freeze({env}); \
         Object.defineProperty(window, '__GENDOX_ENV__', \
         {{ get: function () {{ return env; }}, set: function () {{}}, configurable: false }}); }})();"
    )
}

/// The public frontend settings also belong in bundled iframes. On macOS the native
/// initialization script runs only in the main frame, so serve their usual env-config.js.
pub fn bundled_config_script(request_uri: &str, env: &Value) -> Option<String> {
    let request = Url::parse(request_uri).ok()?;
    let origin = crate::links::origin_of(request_uri)?;
    // Tauri normalizes asset-protocol requests to tauri://localhost on Windows too.
    let bundled = origin == app_origin() || origin == "tauri://localhost";
    if !bundled || request.path() != "/env-config.js" {
        return None;
    }
    let frontend: serde_json::Map<String, Value> = env.as_object()?.iter()
        .filter(|(key, _)| key.starts_with("NEXT_PUBLIC_"))
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect();
    let origin = serde_json::to_string(app_origin()).expect("the app origin is a string");
    Some(include_str!("runtime-config.js")
        .replace("__GENDOX_RUNTIME_ORIGIN__", &origin)
        .replace("__GENDOX_RUNTIME_ENV__", &Value::Object(frontend).to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn server(name: &str, address: &str) -> Server {
        Server {
            name: name.into(),
            address: address.into(),
            config: Some(ServerConfig {
                api_url: format!("{address}/gendox/api/v1/"),
                oidc_authority: format!("{address}/idp/realms/r"),
                desktop_client_id: "gendox-pkce-public-client-desktop".into(),
                min_desktop_app_version: None,
            }),
        }
    }

    #[test]
    fn bundled_frames_receive_only_public_frontend_configuration() {
        let env = json!({
            "NEXT_PUBLIC_GENDOX_URL": "https://api.example/gendox/api/v1/",
            "NEXT_PUBLIC_OIDC_CLIENT_ID": "gendox-pkce-public-client-desktop",
            "GENDOX_DESKTOP": { "servers": [{ "name": "Custom server" }] },
            "UNRELATED_SETTING": "not frontend configuration",
        });
        let script = bundled_config_script("tauri://localhost/env-config.js", &env).unwrap();
        assert!(script.contains("https://api.example/gendox/api/v1/"));
        assert!(script.contains("gendox-pkce-public-client-desktop"));
        assert!(!script.contains("Custom server"));
        assert!(!script.contains("UNRELATED_SETTING"));
        assert!(!script.contains("__GENDOX_RUNTIME_"));
    }

    #[test]
    fn configuration_response_is_limited_to_the_exact_bundled_asset() {
        let env = json!({ "NEXT_PUBLIC_GENDOX_URL": "https://api.example/" });
        assert!(bundled_config_script("tauri://localhost/env-config.js?v=1", &env).is_some());
        assert!(bundled_config_script("https://auth.example/env-config.js", &env).is_none());
        assert!(bundled_config_script("tauri://other/env-config.js", &env).is_none());
        assert!(bundled_config_script("tauri://localhost/nested/env-config.js", &env).is_none());
        assert!(bundled_config_script("tauri://localhost/env-config.js/extra", &env).is_none());
    }

    #[test]
    fn the_built_in_presets_have_a_configuration() {
        let presets = presets();
        assert!(!presets.is_empty());
        assert!(presets[0].config.is_some());
    }

    #[test]
    fn the_first_preset_is_used_until_another_is_chosen() {
        let presets = vec![server("Prod", "https://a.example")];
        let mut saved = Saved::default();
        assert_eq!(saved.current_or(&presets).address, "https://a.example");
        saved.choose(server("Mine", "https://b.example"), &presets);
        assert_eq!(saved.current_or(&presets).address, "https://b.example");
        assert_eq!(saved.custom.len(), 1);
    }

    #[test]
    fn choosing_a_preset_adds_no_custom_server_and_removing_falls_back() {
        let presets = vec![server("Prod", "https://a.example")];
        let mut saved = Saved::default();
        saved.choose(server("Prod", "https://a.example/"), &presets);
        assert!(saved.custom.is_empty());
        saved.choose(server("Mine", "https://b.example"), &presets);
        saved.choose(server("Mine again", "https://b.example/"), &presets);
        assert_eq!(saved.custom.len(), 1);
        saved.remove("https://b.example");
        assert!(saved.custom.is_empty());
        assert_eq!(saved.current_or(&presets).address, "https://a.example");
    }

    #[test]
    fn addresses_need_https_except_on_this_computer() {
        assert!(validate_address("https://gendox.example.com").is_ok());
        assert!(validate_address("http://localhost:8107").is_ok());
        assert!(validate_address("http://gendox.localhost").is_ok());
        assert!(validate_address("http://gendox.example.com").is_err());
        assert!(validate_address("file:///etc").is_err());
        assert!(validate_address("not a url").is_err());
    }

    #[test]
    fn android_release_requires_https_even_for_local_addresses() {
        for address in ["http://localhost:8107", "http://10.0.2.2:8107", "http://gendox.example.com"] {
            assert!(validate_address_with_policy(address, true).is_err());
        }
        assert!(validate_address_with_policy("https://gendox.example.com", true).is_ok());
    }

    #[test]
    fn client_config_is_found_from_the_web_or_the_api_address() {
        assert_eq!(client_config_url("https://g.example/").unwrap(), "https://g.example/gendox/api/v1/public/client-config");
        assert_eq!(client_config_url("http://localhost:8107/gendox/api/v1/").unwrap(), "http://localhost:8107/gendox/api/v1/public/client-config");
    }

    #[test]
    fn older_apps_are_refused_by_servers_that_need_newer_ones() {
        assert!(version_accepted("0.1.0", None));
        assert!(version_accepted("0.2.0", Some("0.1.0")));
        assert!(version_accepted("0.1.0", Some("0.1.0")));
        assert!(!version_accepted("0.1.0", Some("0.10.0")));
    }

    #[test]
    fn the_runtime_configuration_lists_the_servers_and_returns_to_the_app() {
        let presets = vec![server("Prod", "https://a.example")];
        let mut saved = Saved::default();
        saved.choose(server("Mine", "https://b.example"), &presets);
        let current = saved.current_or(&presets);
        let env = runtime_env(&current, &presets, &saved, "tauri://localhost");
        assert_eq!(env["NEXT_PUBLIC_GENDOX_URL"], "https://b.example/gendox/api/v1/");
        assert_eq!(env["NEXT_PUBLIC_OIDC_REDIRECT_URI"], "tauri://localhost/oidc-callback/");
        assert_eq!(env["GENDOX_DESKTOP"]["current"]["address"], "https://b.example");
        assert_eq!(env["GENDOX_DESKTOP"]["servers"][1]["custom"], true);
    }

    #[test]
    fn init_script_ignores_later_assignments() {
        let presets = presets();
        let env = runtime_env(&presets[0], &presets, &Saved::default(), "tauri://localhost");
        let script = init_script(&env);
        assert!(script.contains("\"NEXT_PUBLIC_GENDOX_URL\":\"https://app.gendox.dev/gendox/api/v1/\""));
        assert!(script.contains("set: function () {}"));
    }
}
