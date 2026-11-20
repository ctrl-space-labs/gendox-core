use std::path::{Path, PathBuf};

use process_wrap::tokio::{CommandWrap, CreationFlags, JobObject, KillOnDrop};
use tokio::process::Command;
use windows::Win32::System::Threading::CREATE_NO_WINDOW;

pub(super) fn command(script: &str, directory: &Path) -> CommandWrap {
    // Use the built-in shell independently of the app's PATH or files in the working folder.
    let system = std::env::var_os("SystemRoot")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(r"C:\Windows"));
    let shell = system.join(r"System32\WindowsPowerShell\v1.0\powershell.exe");
    let mut command = Command::new(shell);
    command
        .args([
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            &script_with_utf8(script),
        ])
        .current_dir(directory);
    let mut wrapped = CommandWrap::from(command);
    // JobObject suspends the shell until assignment, then resumes it. Descendants cannot
    // race assignment; closing or killing the job terminates the entire tree.
    wrapped
        .wrap(CreationFlags(CREATE_NO_WINDOW))
        .wrap(KillOnDrop)
        .wrap(JobObject);
    wrapped
}

fn script_with_utf8(script: &str) -> String {
    format!(
        "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); \
        $OutputEncoding = [Console]::OutputEncoding; & {{\n{script}\n}}; \
        $__gendoxSucceeded = $?; if ($__gendoxSucceeded) {{ exit 0 }}; \
        if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) {{ exit $LASTEXITCODE }}; exit 1"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn powershell_keeps_the_script_and_sets_utf8_for_redirected_output() {
        let script = "[Console]::Out.Write('quoted \"value\"'); exit 7";
        let command = command(script, Path::new("."));
        let args: Vec<_> = command.command().as_std().get_args().collect();
        assert_eq!(
            &args[..4],
            ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command"]
        );
        assert!(args[4].to_string_lossy().contains(script));
        assert!(args[4].to_string_lossy().contains("UTF8Encoding"));
    }
}
