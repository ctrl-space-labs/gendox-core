// This is public frontend configuration, not the main frame's native integration.
(function () {
  if (location.protocol + '//' + location.host !== __GENDOX_RUNTIME_ORIGIN__) return;
  // The main frame's initialization script has a protected getter and a no-op setter:
  // this assignment preserves its complete environment, including the server picker.
  window.__GENDOX_ENV__ = Object.freeze(__GENDOX_RUNTIME_ENV__);
})();
