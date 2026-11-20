//! Which addresses the window may show. The bundled UI and the sign-in server stay in the
//! window; every other link opens in the system browser.

use url::Url;

/// Whether the window may navigate to `url`. `allowed` holds origins such as
/// `tauri://localhost` or `https://auth.gendox.dev`.
pub fn stays_in_app(url: &Url, allowed: &[String]) -> bool {
    if url.scheme() == "about" {
        return true;
    }
    let origin = origin_key(url);
    allowed.iter().any(|a| a.trim_end_matches('/') == origin)
}

/// The origin of an address, or `None` if it has none (e.g. a malformed setting).
pub fn origin_of(address: &str) -> Option<String> {
    Url::parse(address).ok().filter(|u| u.has_host()).map(|u| origin_key(&u))
}

/// `scheme://host[:port]`. `Url::origin` is opaque for custom schemes such as `tauri:`,
/// so the key is built by hand; a default port is left out, as browsers do.
fn origin_key(url: &Url) -> String {
    let host = url.host_str().unwrap_or("");
    match url.port() {
        Some(port) => format!("{}://{}:{}", url.scheme(), host, port),
        None => format!("{}://{}", url.scheme(), host),
    }
}

/// Whether a link the window will not show may go to the system browser.
pub fn opens_externally(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https" | "mailto")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn allowed() -> Vec<String> {
        vec!["tauri://localhost".into(), origin_of("https://auth.gendox.dev/idp/realms/x").unwrap()]
    }

    fn url(s: &str) -> Url {
        Url::parse(s).unwrap()
    }

    #[test]
    fn the_bundle_and_the_sign_in_server_stay_in_the_window() {
        assert!(stays_in_app(&url("tauri://localhost/gendox/home/"), &allowed()));
        assert!(stays_in_app(&url("https://auth.gendox.dev/idp/realms/x/protocol/openid-connect/auth?a=b"), &allowed()));
        assert!(stays_in_app(&url("about:blank"), &allowed()));
    }

    #[test]
    fn other_sites_leave_the_window() {
        assert!(!stays_in_app(&url("https://gendox.dev/contact/"), &allowed()));
        assert!(!stays_in_app(&url("http://auth.gendox.dev/"), &allowed()));
        assert!(!stays_in_app(&url("https://auth.gendox.dev.example.com/"), &allowed()));
    }

    #[test]
    fn only_web_and_mail_links_go_to_the_system() {
        assert!(opens_externally(&url("https://docs.gendox.dev")));
        assert!(opens_externally(&url("mailto:someone@example.com")));
        assert!(!opens_externally(&url("file:///etc/passwd")));
        assert!(!opens_externally(&url("javascript:alert(1)")));
    }
}
