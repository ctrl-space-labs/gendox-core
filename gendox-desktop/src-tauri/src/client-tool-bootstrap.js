(function () {
  if (window.top !== window || location.protocol + '//' + location.host !== __GENDOX_TOOL_ORIGIN__) return;
  // Capture the native function before page scripts run. Only this closure owns the proof.
  const invoke = window.__TAURI__.core.invoke;
  (__GENDOX_TOOL_INSTALLER__)((request, executionId) => invoke('run_command', {
    request, executionId, sessionToken: __GENDOX_TOOL_SESSION__
  }), __GENDOX_TOOL_ORIGIN__);
})();
