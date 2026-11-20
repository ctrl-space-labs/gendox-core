use std::{ffi::OsStr, path::Path};

use process_wrap::tokio::{CommandWrap, KillOnDrop, ProcessGroup};
use tokio::process::Command;

pub(super) fn command(script: &str, directory: &Path) -> CommandWrap {
    let shell = std::env::var_os("SHELL")
        .filter(|value| !value.is_empty() && Path::new(value).is_absolute())
        .unwrap_or_else(|| {
            if cfg!(target_os = "macos") {
                "/bin/zsh".into()
            } else {
                "/bin/sh".into()
            }
        });
    login_command(&shell, script, directory)
}

fn login_command(shell: &OsStr, script: &str, directory: &Path) -> CommandWrap {
    let mut command = Command::new(shell);
    command.args(["-l", "-c", script]).current_dir(directory);
    let mut wrapped = CommandWrap::from(command);
    wrapped.wrap(KillOnDrop).wrap(ProcessGroup::leader());
    wrapped
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shell_receives_the_exact_script_after_login_flags() {
        let script = "printf '%s' \"quoted 'value'\"";
        let command = login_command(OsStr::new("/bin/sh"), script, Path::new("."));
        assert_eq!(
            command.command().as_std().get_args().collect::<Vec<_>>(),
            ["-l", "-c", script]
        );
        assert_eq!(
            command.command().as_std().get_current_dir(),
            Some(Path::new("."))
        );
    }
}
