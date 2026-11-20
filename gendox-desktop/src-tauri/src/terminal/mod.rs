//! First-version client terminal: explicit native confirmation, one command at a time.
//! Commands, output, session proofs and working folders never enter diagnostic logs.

#[cfg(unix)]
mod unix;
#[cfg(windows)]
mod windows;

use std::{
    collections::{HashSet, VecDeque},
    future::Future,
    io,
    path::{Path, PathBuf},
    process::Stdio,
    sync::Arc,
    time::{Duration, Instant},
};

use process_wrap::tokio::ChildWrapper;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State, WebviewWindow};
use tokio::{
    io::{AsyncRead, AsyncReadExt},
    sync::{oneshot, Mutex},
    time::timeout,
};
use url::Url;

const OUTPUT_LIMIT: usize = 64 * 1024;
const RESULT_LIMIT: usize = 64;
const COMMAND_TIMEOUT: Duration = Duration::from_secs(60);
const TIMEOUT_NOTE: &[u8] = b"\nCommand timed out and its process tree was stopped.";

/// Install only in the bundled main document. The native proof stays in a closure,
/// separate from public runtime configuration and the exposed tool registry.
pub fn init_script(session_token: &str) -> String {
    include_str!("../client-tool-bootstrap.js")
        .replace(
            "__GENDOX_TOOL_INSTALLER__",
            include_str!("../client-tools.js"),
        )
        .replace(
            "__GENDOX_TOOL_ORIGIN__",
            &serde_json::to_string(crate::server::app_origin()).unwrap(),
        )
        .replace(
            "__GENDOX_TOOL_SESSION__",
            &serde_json::to_string(session_token).unwrap(),
        )
}

#[derive(Clone, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct RunRequest {
    pub command: String,
    pub description: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(untagged)]
pub enum RunResult {
    Declined {
        declined: bool,
    },
    Completed {
        exit_code: i32,
        stdout: String,
        stderr: String,
        duration_ms: u64,
    },
}

type Outcome = Result<RunResult, String>;

/// Managed once per native app session. The proof is installed only in the main-frame
/// bridge's private closure; it is never part of the public frontend configuration.
pub struct TerminalState {
    session_token: String,
    runner: Arc<Runner>,
}

impl TerminalState {
    pub fn new() -> Result<Self, &'static str> {
        let mut bytes = [0_u8; 32];
        getrandom::fill(&mut bytes).map_err(|_| "Cannot initialize the terminal session")?;
        let session_token = bytes.iter().map(|byte| format!("{byte:02x}")).collect();
        Ok(Self {
            session_token,
            runner: Arc::new(Runner::default()),
        })
    }

    pub fn session_token(&self) -> &str {
        &self.session_token
    }
}

#[derive(Default)]
struct Runner {
    memory: Mutex<Memory>,
}

#[derive(Default)]
struct Memory {
    // Keeping small identifiers after result eviction prevents any old call from rerunning.
    seen: HashSet<String>,
    completed: VecDeque<(String, RunRequest, Outcome)>,
}

impl Runner {
    async fn run<F, Fut>(
        &self,
        execution_id: String,
        request: RunRequest,
        directory: PathBuf,
        deadline: Duration,
        confirm: F,
    ) -> Outcome
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<bool, String>>,
    {
        validate_request(&execution_id, &request)?;
        // The gate includes the dialog, process, output drain and replay lookup.
        let mut memory = self.memory.lock().await;
        if let Some((_, previous, result)) = memory
            .completed
            .iter()
            .find(|(id, _, _)| id == &execution_id)
        {
            return if previous == &request {
                result.clone()
            } else {
                Err("This execution ID belongs to a different command".into())
            };
        }
        if !memory.seen.insert(execution_id.clone()) {
            return Err("This command result has expired. Start a new tool call.".into());
        }
        let result = match confirm().await {
            Ok(false) => Ok(RunResult::Declined { declined: true }),
            Ok(true) => execute(&request.command, &directory, deadline).await,
            Err(error) => Err(error),
        };
        if memory.completed.len() == RESULT_LIMIT {
            memory.completed.pop_front();
        }
        memory
            .completed
            .push_back((execution_id, request, result.clone()));
        result
    }
}

fn validate_request(execution_id: &str, request: &RunRequest) -> Result<(), String> {
    if execution_id.is_empty() || execution_id.len() > 1024 {
        return Err("A valid execution ID is required".into());
    }
    if request.command.trim().is_empty()
        || request.command.len() > 16 * 1024
        || request.command.contains('\0')
    {
        return Err(
            "The command must contain between 1 and 16384 bytes without null characters".into(),
        );
    }
    if request.description.trim().is_empty()
        || request.description.len() > 4096
        || request.description.contains('\0')
    {
        return Err("A description of at most 4096 bytes is required".into());
    }
    Ok(())
}

fn authorized(label: &str, url: &Url, supplied: &str, expected: &str) -> bool {
    label == "main"
        && crate::links::origin_of(url.as_str()).as_deref() == Some(crate::server::app_origin())
        && supplied.len() == expected.len()
        && supplied
            .bytes()
            .zip(expected.bytes())
            .fold(0, |difference, (a, b)| difference | (a ^ b))
            == 0
}

fn authorize(window: &WebviewWindow, supplied: &str, expected: &str) -> Result<(), String> {
    let valid = window
        .url()
        .is_ok_and(|url| authorized(window.label(), &url, supplied, expected));
    if valid {
        Ok(())
    } else {
        Err("The terminal is available only in the main desktop app".into())
    }
}

async fn confirm(
    app: AppHandle,
    window: WebviewWindow,
    request: RunRequest,
) -> Result<bool, String> {
    let (send, receive) = oneshot::channel();
    app.run_on_main_thread(move || {
        if send.is_closed() {
            return;
        }
        let choice = rfd::MessageDialog::new()
            .set_title("Run command on this computer?")
            .set_description(format!("{}\n\n{}", request.description, request.command))
            .set_level(rfd::MessageLevel::Warning)
            .set_parent(&window)
            .set_buttons(rfd::MessageButtons::OkCancelCustom(
                "Run".into(),
                "Cancel".into(),
            ))
            .show();
        let _ = send.send(choice == rfd::MessageDialogResult::Custom("Run".into()));
    })
    .map_err(|_| "Cannot show the command confirmation".to_string())?;
    receive
        .await
        .map_err(|_| "The command confirmation was interrupted".to_string())
}

/// The browser bridge passes only request/IDs/proof. The OS chooses the home folder and shell.
#[tauri::command]
pub async fn run_command(
    app: AppHandle,
    webview: WebviewWindow,
    state: State<'_, TerminalState>,
    request: RunRequest,
    execution_id: String,
    session_token: String,
) -> Outcome {
    authorize(&webview, &session_token, state.session_token())?;
    validate_request(&execution_id, &request)?;
    let directory = app
        .path()
        .home_dir()
        .map_err(|_| "The home folder is unavailable".to_string())?
        .join("Gendox");
    let runner = state.runner.clone();
    let expected = state.session_token().to_string();
    let dialog_request = request.clone();
    // Detach execution from the IPC reply's lifetime: reload/retries keep the gate and cache.
    tauri::async_runtime::spawn(async move {
        runner
            .run(
                execution_id,
                request,
                directory,
                COMMAND_TIMEOUT,
                || async {
                    authorize(&webview, &session_token, &expected)?;
                    let accepted = confirm(app, webview.clone(), dialog_request).await?;
                    authorize(&webview, &session_token, &expected)?;
                    Ok(accepted)
                },
            )
            .await
    })
    .await
    .map_err(|_| "The command was interrupted".to_string())?
}

#[derive(Default)]
struct Tail(VecDeque<u8>);

impl Tail {
    fn append(&mut self, bytes: &[u8]) {
        if bytes.len() >= OUTPUT_LIMIT {
            self.0.clear();
            self.0.extend(&bytes[bytes.len() - OUTPUT_LIMIT..]);
        } else {
            let excess = (self.0.len() + bytes.len()).saturating_sub(OUTPUT_LIMIT);
            self.0.drain(..excess);
            self.0.extend(bytes);
        }
    }

    fn text(self) -> String {
        let bytes: Vec<u8> = self.0.into_iter().collect();
        let text = String::from_utf8_lossy(&bytes);
        let mut start = text.len().saturating_sub(OUTPUT_LIMIT);
        while !text.is_char_boundary(start) {
            start += 1;
        }
        text[start..].to_string()
    }
}

async fn read_tail<R: AsyncRead + Unpin>(mut pipe: R, output: &mut Tail) -> io::Result<()> {
    let mut bytes = [0_u8; 8192];
    loop {
        let count = pipe.read(&mut bytes).await?;
        if count == 0 {
            return Ok(());
        }
        output.append(&bytes[..count]);
    }
}

struct ProcessTree(Box<dyn ChildWrapper>);

impl Drop for ProcessTree {
    fn drop(&mut self) {
        // KillOnDrop alone kills only the Unix shell, so explicitly signal its group too.
        let _ = self.0.start_kill();
    }
}

async fn execute(script: &str, directory: &Path, deadline: Duration) -> Outcome {
    let start = Instant::now();
    std::fs::create_dir_all(directory)
        .map_err(|_| "Cannot create the Gendox working folder".to_string())?;
    #[cfg(unix)]
    let mut command = unix::command(script, directory);
    #[cfg(windows)]
    let mut command = windows::command(script, directory);
    command
        .command_mut()
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut process = ProcessTree(
        command
            .spawn()
            .map_err(|_| "Cannot start the command shell".to_string())?,
    );
    let stdout = process
        .0
        .stdout()
        .take()
        .ok_or("Cannot capture command output")?;
    let stderr = process
        .0
        .stderr()
        .take()
        .ok_or("Cannot capture command output")?;
    let mut out = Tail::default();
    let mut err = Tail::default();
    // The deadline includes inherited pipes: a background descendant must not hang the IPC call.
    let completion = timeout(deadline, async {
        tokio::try_join!(
            process.0.wait(),
            read_tail(stdout, &mut out),
            read_tail(stderr, &mut err)
        )
    })
    .await;
    let _ = process.0.start_kill();
    let _ = timeout(Duration::from_secs(2), process.0.wait()).await;
    let exit_code = match completion {
        Ok(Ok((status, _, _))) => status.code().unwrap_or(-1),
        Ok(Err(_)) => return Err("Cannot read the command result".into()),
        Err(_) => {
            err.append(TIMEOUT_NOTE);
            124
        }
    };
    Ok(RunResult::Completed {
        exit_code,
        stdout: out.text(),
        stderr: err.text(),
        duration_ms: start.elapsed().as_millis().try_into().unwrap_or(u64::MAX),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};

    static NEXT: AtomicU64 = AtomicU64::new(0);

    struct Scratch(PathBuf);
    impl Scratch {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "gendox-terminal-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir_all(&path).unwrap();
            Self(path)
        }
    }
    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn request(command: &str) -> RunRequest {
        RunRequest {
            command: command.into(),
            description: "Test command".into(),
        }
    }
    fn output(result: RunResult) -> (i32, String, String) {
        match result {
            RunResult::Completed {
                exit_code,
                stdout,
                stderr,
                ..
            } => (exit_code, stdout, stderr),
            _ => panic!("expected command output"),
        }
    }

    #[test]
    fn proof_and_window_origin_must_all_match() {
        let state = TerminalState::new().unwrap();
        assert_eq!(state.session_token().len(), 64);
        assert_ne!(
            state.session_token(),
            TerminalState::new().unwrap().session_token()
        );
        let url = Url::parse(&format!(
            "{}/gendox/agent-home/",
            crate::server::app_origin()
        ))
        .unwrap();
        assert!(authorized(
            "main",
            &url,
            state.session_token(),
            state.session_token()
        ));
        assert!(!authorized(
            "child",
            &url,
            state.session_token(),
            state.session_token()
        ));
        assert!(!authorized("main", &url, "wrong", state.session_token()));
        assert!(!authorized(
            "main",
            &Url::parse("https://auth.example/").unwrap(),
            state.session_token(),
            state.session_token()
        ));
    }

    #[test]
    fn output_tail_is_bounded_and_valid_utf8_even_for_binary_or_split_characters() {
        let mut tail = Tail::default();
        tail.append("🦀".repeat(OUTPUT_LIMIT).as_bytes());
        tail.append(b"LAST");
        let text = tail.text();
        assert!(text.len() <= OUTPUT_LIMIT);
        assert!(text.ends_with("LAST"));
        let mut tail = Tail::default();
        tail.append(&vec![255; OUTPUT_LIMIT + 100]);
        assert!(tail.text().len() <= OUTPUT_LIMIT);
    }

    #[tokio::test]
    async fn shell_returns_both_streams_and_the_exact_exit_code() {
        let scratch = Scratch::new();
        #[cfg(unix)]
        let script = "printf 'hello \"quoted\"'; printf 'problem' >&2; exit 7";
        #[cfg(windows)]
        let script =
            "[Console]::Out.Write('hello \"quoted\"'); [Console]::Error.Write('problem'); exit 7";
        assert_eq!(
            output(
                execute(script, &scratch.0, Duration::from_secs(10))
                    .await
                    .unwrap()
            ),
            (7, "hello \"quoted\"".into(), "problem".into())
        );
    }

    #[tokio::test]
    async fn shell_uses_the_selected_working_directory() {
        let scratch = Scratch::new();
        #[cfg(unix)]
        let script = "pwd";
        #[cfg(windows)]
        let script = "(Get-Location).Path";
        let (code, stdout, _) = output(
            execute(script, &scratch.0, Duration::from_secs(10))
                .await
                .unwrap(),
        );
        assert_eq!(code, 0);
        assert_eq!(
            Path::new(stdout.trim()).canonicalize().unwrap(),
            scratch.0.canonicalize().unwrap()
        );
    }

    #[tokio::test]
    async fn unicode_output_is_utf8_on_each_shell() {
        let scratch = Scratch::new();
        #[cfg(unix)]
        let script = "printf 'Ελληνικά 🦀'";
        #[cfg(windows)]
        let script = "[Console]::Out.Write('Ελληνικά 🦀')";
        assert_eq!(
            output(
                execute(script, &scratch.0, Duration::from_secs(10))
                    .await
                    .unwrap()
            ),
            (0, "Ελληνικά 🦀".into(), "".into())
        );
    }

    #[tokio::test]
    async fn both_streams_are_drained_without_unbounded_capture() {
        let scratch = Scratch::new();
        #[cfg(unix)] let script = "i=0; while [ $i -lt 70000 ]; do printf x; printf y >&2; i=$((i+1)); done; printf END; printf TAIL >&2";
        #[cfg(windows)]
        let script =
            "[Console]::Out.Write(('x'*70000)+'END'); [Console]::Error.Write(('y'*70000)+'TAIL')";
        let (code, stdout, stderr) = output(
            execute(script, &scratch.0, Duration::from_secs(20))
                .await
                .unwrap(),
        );
        assert_eq!(code, 0);
        assert_eq!(stdout.len(), OUTPUT_LIMIT);
        assert_eq!(stderr.len(), OUTPUT_LIMIT);
        assert!(stdout.ends_with("END"));
        assert!(stderr.ends_with("TAIL"));
    }

    #[tokio::test]
    async fn declining_has_no_working_folder_or_process_side_effects_and_is_replayed() {
        let scratch = Scratch::new();
        let directory = scratch.0.join("Gendox");
        let runner = Runner::default();
        let count = AtomicUsize::new(0);
        for _ in 0..2 {
            let result = runner
                .run(
                    "declined".into(),
                    request("unused"),
                    directory.clone(),
                    COMMAND_TIMEOUT,
                    || async {
                        count.fetch_add(1, Ordering::SeqCst);
                        Ok(false)
                    },
                )
                .await
                .unwrap();
            assert_eq!(result, RunResult::Declined { declined: true });
        }
        assert_eq!(count.load(Ordering::SeqCst), 1);
        assert!(!directory.exists());
    }

    #[tokio::test]
    async fn concurrent_calls_are_serial_and_the_same_execution_runs_only_once() {
        let scratch = Scratch::new();
        let runner = Runner::default();
        let count = AtomicUsize::new(0);
        #[cfg(unix)] let script = "if [ -e running ]; then exit 9; fi; touch running; sleep 0.2; printf 'run\\n' >> count; rm running; printf done";
        #[cfg(windows)] let script = "if(Test-Path running){exit 9}; New-Item running -ItemType File|Out-Null; Start-Sleep -Milliseconds 200; Add-Content count run; Remove-Item running; [Console]::Out.Write('done')";
        let run = |id: &str| {
            runner.run(
                id.to_string(),
                request(script),
                scratch.0.clone(),
                Duration::from_secs(10),
                || async {
                    count.fetch_add(1, Ordering::SeqCst);
                    Ok(true)
                },
            )
        };
        let (one, two, replay) = tokio::join!(run("one"), run("two"), run("one"));
        assert_eq!(one, replay);
        assert_eq!(output(one.unwrap()), (0, "done".into(), "".into()));
        assert_eq!(output(two.unwrap()), (0, "done".into(), "".into()));
        assert_eq!(count.load(Ordering::SeqCst), 2);
        assert_eq!(
            std::fs::read_to_string(scratch.0.join("count"))
                .unwrap()
                .lines()
                .count(),
            2
        );
    }

    #[tokio::test]
    async fn expired_or_changed_execution_ids_never_run_again() {
        let runner = Runner::default();
        let scratch = Scratch::new();
        for id in 0..=RESULT_LIMIT {
            runner
                .run(
                    id.to_string(),
                    request("unused"),
                    scratch.0.clone(),
                    COMMAND_TIMEOUT,
                    || async { Ok(false) },
                )
                .await
                .unwrap();
        }
        let count = AtomicUsize::new(0);
        let expired = runner
            .run(
                "0".into(),
                request("unused"),
                scratch.0.clone(),
                COMMAND_TIMEOUT,
                || async {
                    count.fetch_add(1, Ordering::SeqCst);
                    Ok(false)
                },
            )
            .await;
        let changed = runner
            .run(
                RESULT_LIMIT.to_string(),
                request("different"),
                scratch.0.clone(),
                COMMAND_TIMEOUT,
                || async {
                    count.fetch_add(1, Ordering::SeqCst);
                    Ok(false)
                },
            )
            .await;
        assert!(expired.unwrap_err().contains("expired"));
        assert!(changed.unwrap_err().contains("different command"));
        assert_eq!(count.load(Ordering::SeqCst), 0);
        assert_eq!(runner.memory.lock().await.completed.len(), RESULT_LIMIT);
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn timeout_kills_descendants_before_they_write_a_marker() {
        // Gate the writes on a file created only after execute returns. A slow login
        // shell cannot consume a short sleep and make the descendant check vacuous.
        let script = r#"
            (
                (
                    printf ready > descendant-started
                    while [ ! -e release ]; do sleep 0.02; done
                    printf survived > descendant-marker
                ) &
                printf ready > child-started
                while [ ! -e release ]; do sleep 0.02; done
                printf survived > child-marker
                wait
            ) &
            printf ready
            wait
        "#;
        let ready = |directory: PathBuf| async move {
            timeout(Duration::from_secs(5), async {
                while !directory.join("child-started").exists()
                    || !directory.join("descendant-started").exists()
                {
                    tokio::time::sleep(Duration::from_millis(10)).await;
                }
            })
            .await
            .expect("the child and grandchild must both start");
        };

        // Positive control: both generations really write when released without
        // a timeout, so marker absence below verifies termination of a live tree.
        let control = Scratch::new();
        let (result, ()) = tokio::join!(
            execute(script, &control.0, Duration::from_secs(10)),
            async {
                ready(control.0.clone()).await;
                std::fs::write(control.0.join("release"), "go").unwrap();
            }
        );
        let (control_code, control_stdout, _) = output(result.unwrap());
        assert_eq!(control_code, 0);
        assert_eq!(control_stdout, "ready");
        for marker in ["child-marker", "descendant-marker"] {
            assert_eq!(
                std::fs::read_to_string(control.0.join(marker)).unwrap(),
                "survived"
            );
        }

        let scratch = Scratch::new();
        // Allow login startup under a parallel test run; production still uses
        // COMMAND_TIMEOUT, and the test's marker writes remain explicitly gated.
        let (code, stdout, stderr) = output(
            execute(script, &scratch.0, Duration::from_secs(5))
                .await
                .unwrap(),
        );
        assert_eq!(code, 124);
        assert_eq!(stdout, "ready");
        assert!(stderr.contains("timed out"));
        assert!(scratch.0.join("child-started").exists());
        assert!(scratch.0.join("descendant-started").exists());
        std::fs::write(scratch.0.join("release"), "go").unwrap();
        tokio::time::sleep(Duration::from_secs(1)).await;
        assert!(!scratch.0.join("child-marker").exists());
        assert!(!scratch.0.join("descendant-marker").exists());
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn inherited_background_pipes_cannot_outlive_the_deadline() {
        let scratch = Scratch::new();
        let start = Instant::now();
        let (code, _, _) = output(
            execute("sleep 10 &", &scratch.0, Duration::from_millis(200))
                .await
                .unwrap(),
        );
        assert_eq!(code, 124);
        assert!(start.elapsed() < Duration::from_secs(3));
    }

    #[cfg(windows)]
    #[tokio::test]
    async fn windows_timeout_ends_the_job_and_its_inherited_pipes() {
        let scratch = Scratch::new();
        // A child cmd process retains the standard handles and would write after its parent exits.
        let script = "Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\\cmd.exe') \
            -ArgumentList '/c ping -n 5 127.0.0.1 >nul & echo survived>marker' -NoNewWindow; \
            [Console]::Out.Write('ready'); exit 0";
        let start = Instant::now();
        let (code, stdout, stderr) = output(
            execute(script, &scratch.0, Duration::from_secs(2))
                .await
                .unwrap(),
        );
        assert_eq!(code, 124);
        assert_eq!(stdout, "ready");
        assert!(stderr.contains("timed out"));
        assert!(start.elapsed() < Duration::from_secs(5));
        tokio::time::sleep(Duration::from_secs(3)).await;
        assert!(!scratch.0.join("marker").exists());
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn cancellation_drops_readers_and_kills_the_process_group() {
        let scratch = Scratch::new();
        let directory = scratch.0.clone();
        let task = tokio::spawn(async move {
            execute(
                "(sleep 1; printf survived > marker) & printf ready > started; wait",
                &directory,
                COMMAND_TIMEOUT,
            )
            .await
        });
        timeout(Duration::from_secs(3), async {
            while !scratch.0.join("started").exists() {
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        })
        .await
        .unwrap();
        task.abort();
        assert!(task.await.unwrap_err().is_cancelled());
        tokio::time::sleep(Duration::from_millis(1100)).await;
        assert!(!scratch.0.join("marker").exists());
    }
}
