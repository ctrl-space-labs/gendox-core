// Client capability metadata only: no local paths, commands or saved note contents.
export const DESKTOP_CONTEXT_TYPE = 'GENDOX_DESKTOP'

export function desktopMessageContext(desktopApp, device) {
  if (!desktopApp) return null
  const mode = ['ask', 'auto', 'plan'].includes(device?.preferences?.mode) ? device.preferences.mode : 'ask'
  return {
    contextType: DESKTOP_CONTEXT_TYPE,
    value: JSON.stringify({
      source: 'gendox-desktop',
      approvalMode: mode,
      localCommandsAvailable: device?.folders?.enforcement_available === true
    })
  }
}
