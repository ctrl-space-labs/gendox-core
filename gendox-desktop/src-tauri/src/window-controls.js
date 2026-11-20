// Windows and Linux: the window has no title bar, so the app draws the window buttons
// (minimize, maximize, close) in the top-right corner of every page of the main window:
// the bundled UI and the app's own connecting and offline pages alike.
// The page's top bar moves the window (data-tauri-drag-region), see the frontend's base.css.
(function () {
  if (window.top !== window) return

  const invoke = command => window.__TAURI_INTERNALS__.invoke('plugin:window|' + command)
  const classes = ['frameless', 'titlebar-controls']
  if (document.documentElement) document.documentElement.classList.add(...classes)

  const icons = {
    minimize: '<path d="M0 5.5h10"/>',
    maximize: '<rect x=".5" y=".5" width="9" height="9"/>',
    restore: '<path d="M2.5 2.5V.5h7v7h-2"/><rect x=".5" y="2.5" width="7" height="7"/>',
    close: '<path d="M.5.5l9 9m0-9l-9 9"/>'
  }

  const style = document.createElement('style')
  style.textContent = `
.gendox-window-controls { position: fixed; top: 0; right: 0; z-index: 2147483000; display: flex; height: 56px; }
.gendox-window-controls button { all: unset; width: 46px; height: 100%; display: grid; place-items: center; color: inherit; opacity: .75; }
.gendox-window-controls button:hover { opacity: 1; background: rgba(128, 128, 128, .18); }
.gendox-window-controls button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.gendox-window-controls button.close:hover { background: #c42b1c; color: #fff; }
.gendox-window-controls svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1; }
`

  const bar = document.createElement('div')
  bar.className = 'gendox-window-controls'

  const button = (name, label, command) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = name
    b.setAttribute('aria-label', label)
    b.title = label
    b.innerHTML = `<svg viewBox="0 0 10 10" aria-hidden="true">${icons[name]}</svg>`
    b.addEventListener('click', () => invoke(command))
    bar.append(b)

    return b
  }

  button('minimize', 'Minimize', 'minimize')
  const maximize = button('maximize', 'Maximize', 'toggle_maximize')
  button('close', 'Close', 'close')

  // the middle button shows restore while the window is maximized
  const syncMaximized = () =>
    invoke('is_maximized').then(maximized => {
      maximize.querySelector('svg').innerHTML = maximized ? icons.restore : icons.maximize
      maximize.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize')
      maximize.title = maximize.getAttribute('aria-label')
    }, () => {})

  const mount = () => {
    document.documentElement.classList.add(...classes)
    document.head.append(style)
    document.body.append(bar)
    syncMaximized()
    window.addEventListener('resize', syncMaximized)
  }

  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount, { once: true })
})()
