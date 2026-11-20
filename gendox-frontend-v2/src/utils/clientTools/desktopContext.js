// Client capability metadata only: no local paths, commands or saved note contents.
export const DESKTOP_CONTEXT_TYPE = 'GENDOX_DESKTOP'

export function desktopMessageContext(desktopApp, device) {
  if (!desktopApp) return null
  const mode = ['ask', 'auto', 'plan'].includes(device?.preferences?.mode) ? device.preferences.mode : 'ask'
  const localCommandsAvailable = device?.folders?.enforcement_available === true
  return {
    contextType: DESKTOP_CONTEXT_TYPE,
    value: JSON.stringify({
      source: 'gendox-desktop',
      approvalMode: mode,
      localCommandsAvailable,
      // The system tools this app runs; the server offers the model only these (only run_command for now).
      // None in Plan, or where commands cannot run here: the agent is then never offered them.
      clientTools: localCommandsAvailable && mode !== 'plan' ? ['run_command'] : []
    })
  }
}
