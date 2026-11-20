//! App-owned startup and offline pages. They need no frontend bundle or native JS calls.

pub const CONNECTING: &str = "/__desktop/connecting/";
pub const OFFLINE: &str = "/__desktop/offline/";

pub fn page(path: &str) -> Option<&'static [u8]> {
    match path {
        CONNECTING => Some(include_bytes!("pages/connecting.html")),
        OFFLINE => Some(include_bytes!("pages/offline.html")),
        _ => None,
    }
}
