//! Sign-in and sign-out in the system browser (OAuth 2.0 for Native Apps, RFC 8252).
//!
//! The app holds no OIDC logic: oidc-client-ts in the bundled UI builds the request (authorization code
//! with PKCE), checks the state and exchanges the code. This module only opens the sign-in server's page
//! in the user's browser and hands back the address the browser was sent to: a loopback redirect,
//! `http://127.0.0.1:<port>/callback`, received once by a listener that lives for one sign-in. The browser
//! keeps the passwords, single sign-on and Google or Microsoft accounts; the app window never shows
//! the sign-in pages. Codes, tokens and addresses never enter diagnostic logs.

use std::time::Duration;

use tauri::{AppHandle, Manager, State, WebviewWindow};
use tauri_plugin_opener::OpenerExt;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
    sync::{Mutex, Notify},
    time::timeout,
};
use url::Url;

use crate::terminal::{self, TerminalState};

/// How long the app waits for the browser to come back.
const SIGN_IN_TIMEOUT: Duration = Duration::from_secs(10 * 60);
const CALLBACK_PATH: &str = "/callback";

/// Browsers let a page close its own tab only when the tab holds no other page: here, when the
/// sign-in server redirected straight back (the user was already signed in). Otherwise the page stays,
/// in the look of the v2 app; it loads nothing from the network.
const DONE_PAGE: &str = include_str!("pages/signed-in.html");

pub struct AuthState {
    /// The origin of the sign-in server in use: the only pages this module opens.
    oidc_origin: String,
    listener: Mutex<Option<(TcpListener, u16)>>,
    cancel: Notify,
}

impl AuthState {
    pub fn new(oidc_origin: String) -> Self {
        Self {
            oidc_origin,
            listener: Mutex::new(None),
            cancel: Notify::new(),
        }
    }
}

/// Starts listening for one browser redirect and returns its address, the `redirect_uri` of the request.
#[tauri::command]
pub async fn prepare_sign_in(
    webview: WebviewWindow,
    terminal_state: State<'_, TerminalState>,
    state: State<'_, AuthState>,
    session_token: String,
) -> Result<String, String> {
    terminal::authorize(&webview, &session_token, terminal_state.session_token())?;
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .await
        .map_err(|_| "Cannot prepare the sign-in")?;
    let port = listener
        .local_addr()
        .map_err(|_| "Cannot prepare the sign-in")?
        .port();
    *state.listener.lock().await = Some((listener, port));
    Ok(redirect_uri(port))
}

/// Opens `url`, a page of the sign-in server, in the system browser and waits for the browser to be sent
/// back to the prepared address. Returns that address with its query, for oidc-client-ts to process.
#[tauri::command]
pub async fn open_sign_in(
    app: AppHandle,
    webview: WebviewWindow,
    terminal_state: State<'_, TerminalState>,
    state: State<'_, AuthState>,
    session_token: String,
    url: String,
) -> Result<String, String> {
    terminal::authorize(&webview, &session_token, terminal_state.session_token())?;
    let page = Url::parse(&url).map_err(|_| "Not a sign-in address")?;
    if crate::links::origin_of(page.as_str()).as_deref() != Some(state.oidc_origin.as_str()) {
        return Err("Only the sign-in server's pages open from here".into());
    }
    let (listener, port) = state
        .listener
        .lock()
        .await
        .take()
        .ok_or("Sign-in was not prepared")?;
    app.opener()
        .open_url(page.as_str(), None::<&str>)
        .map_err(|_| "Cannot open the browser")?;
    let callback = tokio::select! {
        result = timeout(SIGN_IN_TIMEOUT, wait_for_callback(&listener)) => {
            result.map_err(|_| "Sign-in timed out. Try again.".to_string())?
        }
        () = state.cancel.notified() => return Err("Sign-in cancelled".into()),
    }?;
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(format!("{}{}", origin(port), callback))
}

/// Stops waiting for the browser; the pending `open_sign_in` answers "Sign-in cancelled".
#[tauri::command]
pub async fn cancel_sign_in(
    webview: WebviewWindow,
    terminal_state: State<'_, TerminalState>,
    state: State<'_, AuthState>,
    session_token: String,
) -> Result<(), String> {
    terminal::authorize(&webview, &session_token, terminal_state.session_token())?;
    state.listener.lock().await.take();
    state.cancel.notify_waiters();
    Ok(())
}

fn origin(port: u16) -> String {
    format!("http://127.0.0.1:{port}")
}

fn redirect_uri(port: u16) -> String {
    format!("{}{CALLBACK_PATH}", origin(port))
}

/// Answers requests until one comes to the callback path; returns its path and query.
async fn wait_for_callback(listener: &TcpListener) -> Result<String, String> {
    loop {
        let (mut stream, _) = listener
            .accept()
            .await
            .map_err(|_| "Cannot receive the sign-in answer")?;
        let mut request = vec![0_u8; 8192];
        let mut read = 0;
        // The request line is enough: the answer is in its query.
        while read < request.len() && !request[..read].windows(2).any(|w| w == b"\r\n") {
            match timeout(Duration::from_secs(5), stream.read(&mut request[read..])).await {
                Ok(Ok(0)) | Err(_) | Ok(Err(_)) => break,
                Ok(Ok(count)) => read += count,
            }
        }
        match callback_target(&request[..read]) {
            Some(target) => {
                let _ = respond(&mut stream, "200 OK", DONE_PAGE).await;
                return Ok(target);
            }
            None => {
                let _ = respond(&mut stream, "404 Not Found", "").await;
            }
        }
    }
}

/// The path and query of a `GET /callback?...` request line, else None (a favicon, a probe).
fn callback_target(request: &[u8]) -> Option<String> {
    let line = std::str::from_utf8(request).ok()?.lines().next()?;
    let mut parts = line.split(' ');
    let (method, target) = (parts.next()?, parts.next()?);
    let path = target.split('?').next()?;
    (method == "GET" && path == CALLBACK_PATH && target.len() <= 8192).then(|| target.to_string())
}

async fn respond(stream: &mut tokio::net::TcpStream, status: &str, body: &str) -> std::io::Result<()> {
    let response = format!(
        "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\
Cache-Control: no-store\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    stream.write_all(response.as_bytes()).await?;
    stream.shutdown().await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_a_get_to_the_callback_path_is_the_answer() {
        assert_eq!(
            callback_target(b"GET /callback?code=abc&state=xyz HTTP/1.1\r\nHost: x\r\n\r\n"),
            Some("/callback?code=abc&state=xyz".into())
        );
        assert_eq!(callback_target(b"GET /favicon.ico HTTP/1.1\r\n"), None);
        assert_eq!(callback_target(b"POST /callback?code=abc HTTP/1.1\r\n"), None);
        assert_eq!(callback_target(b"GET /callbackx?code=abc HTTP/1.1\r\n"), None);
        assert_eq!(callback_target(&[255, 0, 1]), None);
    }

    #[tokio::test]
    async fn the_listener_returns_the_callback_after_ignoring_other_requests() {
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let browser = tokio::spawn(async move {
            let mut answer = String::new();
            for target in ["/favicon.ico", "/callback?code=c0de&state=s1"] {
                let mut stream = tokio::net::TcpStream::connect(("127.0.0.1", port)).await.unwrap();
                stream
                    .write_all(format!("GET {target} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n").as_bytes())
                    .await
                    .unwrap();
                answer.clear();
                stream.read_to_string(&mut answer).await.unwrap();
            }
            answer
        });
        let target = timeout(Duration::from_secs(5), wait_for_callback(&listener))
            .await
            .unwrap()
            .unwrap();
        assert_eq!(target, "/callback?code=c0de&state=s1");
        let last_answer = browser.await.unwrap();
        assert!(last_answer.starts_with("HTTP/1.1 200 OK"));
        assert!(last_answer.contains("You can return to Gendox"));
        assert!(last_answer.contains("You can close this tab and continue in the app."));
        assert_eq!(redirect_uri(port), format!("http://127.0.0.1:{port}/callback"));
    }
}
