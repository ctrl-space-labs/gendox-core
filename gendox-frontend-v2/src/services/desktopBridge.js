// The desktop app's native operations, for the bundled UI.
//
// The desktop app installs a host in the main window before the page loads
// (gendox-desktop/src-tauri/src/client-tool-host.js). This module talks to it with
// window.postMessage; child frames never get it. In a browser, isDesktopApp() is false
// and every operation rejects.

const REQUEST = 'gendox.events.native.request'
const RESPONSE = 'gendox.events.native.response'

const pending = new Map()
let listening = false

export const isDesktopApp = () =>
  typeof window !== 'undefined' && window.top === window && Boolean(window.__GENDOX_CLIENT_TOOL_HOST__)

const ownOrigin = () => `${location.protocol}//${location.host}`

function listen() {
  if (listening) return
  listening = true
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== ownOrigin() || !event.isTrusted) return
    if (event.data?.type !== RESPONSE) return
    const response = event.data.payload
    const task = pending.get(response?.id)
    if (!task) return
    pending.delete(response.id)
    if (response.error) {
      task.reject(new Error(response.error))
    } else {
      task.resolve(response.result)
    }
  })
}

const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')

function call(method, ...args) {
  if (!isDesktopApp()) return Promise.reject(new Error('This needs the Gendox desktop app.'))
  listen()
  return new Promise((resolve, reject) => {
    const id = newId()
    pending.set(id, { resolve, reject })
    window.postMessage({ type: REQUEST, payload: { id, method, args } }, ownOrigin())
  })
}

// Folders the commands may write in
const getFolders = () => call('folders')
const chooseFolder = () => call('chooseFolder')
const removeFolder = path => call('removeFolder', path)
const setWorkingDirectory = path => call('setWorkingDirectory', path)

// Commands
const runCommand = (request, executionId) => call('runCommand', request, executionId)
const commandStatus = (request, executionId, replayed) => call('commandStatus', request, executionId, replayed)
const stopCommand = () => call('stop')
const setActivity = running => call('activity', running)

// Notifications, badge, links and launch at login
const notificationPermission = () => call('notificationPermission')
const requestNotificationPermission = () => call('requestNotificationPermission')
const notify = notice => call('notify', notice)
const setBadge = count => call('badge', count)
const pendingDeepLinks = () => call('deepLinks')
const autostartEnabled = () => call('autostartEnabled')
const setAutostart = enabled => call('setAutostart', enabled)

/**
 * Events the desktop app sends: { type: 'notification', action } when a notification is clicked,
 * { type: 'deep-link', urls } when a gendox:// link opens the app,
 * { type: 'command-output', executionId, stream, text } while a command runs. Returns a function that stops listening.
 */
const onNativeEvent = handler => {
  const listener = event => handler(event.detail || {})
  window.addEventListener('gendox.native', listener)

  return () => window.removeEventListener('gendox.native', listener)
}

const desktopBridge = {
  onNativeEvent,
  getFolders,
  chooseFolder,
  removeFolder,
  setWorkingDirectory,
  runCommand,
  commandStatus,
  stopCommand,
  setActivity,
  notificationPermission,
  requestNotificationPermission,
  notify,
  setBadge,
  pendingDeepLinks,
  autostartEnabled,
  setAutostart
}

export default desktopBridge
