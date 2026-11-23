import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MODES } from 'src/utils/clientTools/preferences'
import {
  chooseFolder,
  enableNotifications,
  loadDeviceSettings,
  removeFolder,
  saveClientPreferences,
  setAutostart,
  setWorkingDirectory
} from 'src/store/clientDevice/clientDevice'

/** This device's settings on the profile page: notifications, and in the desktop app its own section. */
const ClientSettings = () => {
  const dispatch = useDispatch()
  const { ready, preferences, notificationPermission, folders, foldersUpdating, autostart } = useSelector(
    state => state.clientDevice
  )

  useEffect(() => {
    if (ready) dispatch(loadDeviceSettings())
  }, [ready, dispatch])

  if (!ready) return null

  const save = patch => dispatch(saveClientPreferences(patch))

  const toggleNotifications = enabled => {
    if (enabled) {
      dispatch(enableNotifications())
    } else {
      save({ notifications: false })
    }
  }

  return (
    <>
      <section className='sect'>
        <header>
          <h2>Notifications</h2>
          <p>On this device, while Gendox is open. Message and command contents stay out of notifications.</p>
        </header>
        <div className='card card-b form'>
          <label className='row'>
            <input
              type='checkbox'
              checked={preferences.notifications && notificationPermission === 'granted'}
              onChange={event => toggleNotifications(event.target.checked)}
            />{' '}
            Enable notifications
          </label>
          <label className='row'>
            <input
              type='checkbox'
              checked={preferences.answerNotifications}
              onChange={event => save({ answerNotifications: event.target.checked })}
            />{' '}
            An answer is ready in the background
          </label>
          <label className='row'>
            <input
              type='checkbox'
              checked={preferences.approvalNotifications}
              onChange={event => save({ approvalNotifications: event.target.checked })}
            />{' '}
            An action needs my approval
          </label>
        </div>
      </section>

      {folders && (
        <section className='sect'>
          <header>
            <h2>Desktop</h2>
            <p>Local commands and folder access on this computer.</p>
          </header>
          <div className='card card-b form'>
            <div className='field'>
              <label htmlFor='client-approval-mode'>Approval mode</label>
              <select
                id='client-approval-mode'
                className='input'
                value={preferences.mode}
                onChange={event => save({ mode: event.target.value })}
              >
                {Object.entries(MODES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span className='help'>
                Auto-approval never adds folder permissions. Plan does not run local commands. Folder limits stop
                accidental writes, not a command written to get around them: approve only commands you trust.
              </span>
            </div>

            {!folders.enforcement_available && (
              <p role='alert'>Folder write protection is unavailable on this platform. Local commands are disabled.</p>
            )}

            <div className='field'>
              <label htmlFor='client-working-folder'>Working folder</label>
              <select
                id='client-working-folder'
                className='input'
                value={folders.working_directory}
                disabled={foldersUpdating}
                onChange={event => dispatch(setWorkingDirectory(event.target.value))}
              >
                {folders.folders.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>

            <div className='field'>
              <label>Allowed write folders</label>
              {folders.folders.map(folder => (
                <div className='row' key={folder}>
                  <code className='client-path'>{folder}</code>
                  <button
                    className='btn s'
                    disabled={foldersUpdating || folder === folders.working_directory}
                    onClick={() => dispatch(removeFolder(folder))}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button className='btn' disabled={foldersUpdating} onClick={() => dispatch(chooseFolder())}>
                Allow another folder…
              </button>
              <span className='help'>
                A command needs your approval to add write access elsewhere. Reads and network access are separate.
              </span>
            </div>

            <label className='row'>
              <input
                type='checkbox'
                checked={autostart}
                onChange={event => dispatch(setAutostart(event.target.checked))}
              />{' '}
              Launch Gendox at login
            </label>

            <p className='help'>Updates are not configured in this build.</p>
          </div>
        </section>
      )}
    </>
  )
}

export default ClientSettings
