(function () {
  if (window.top !== window || location.protocol + '//' + location.host !== __GENDOX_TOOL_ORIGIN__) return;
  // Capture the native function before page scripts run. Only this closure owns the proof.
  const invoke = window.__TAURI__.core.invoke;
  const call = (command, args = {}) => invoke(command, { ...args, sessionToken: __GENDOX_TOOL_SESSION__ });
  __GENDOX_TOOL_INSTALLER__
  installClientToolHost({
    runCommand: (request, executionId) => call('run_command', { request, executionId, approved: true }),
    commandStatus: (request, executionId, replayed) => call('command_status', { request, executionId, replayed: Boolean(replayed) }),
    folders: () => call('get_folders'),
    chooseFolder: () => call('choose_folder'),
    removeFolder: path => call('remove_folder', { path }),
    setWorkingDirectory: path => call('set_working_directory', { path }),
    stop: () => call('stop_command'),
    notificationPermission: () => call('notification_permission'),
    requestNotificationPermission: () => call('request_notification_permission'),
    notify: notice => call('notify', { notice }),
    badge: count => call('badge', { count }),
    activity: running => call('activity', { running }),
    autostartEnabled: () => call('autostart_enabled'),
    setAutostart: enabled => call('set_autostart', { enabled }),
    deepLinks: () => call('deep_links'),
    prepareSignIn: () => call('prepare_sign_in'),
    openSignIn: url => call('open_sign_in', { url }),
    cancelSignIn: () => call('cancel_sign_in')
  }, __GENDOX_TOOL_ORIGIN__);
})();
