import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'
import desktopBridge, { isDesktopApp } from 'src/services/desktopBridge'
import { readPreferences, savePreferences, DEFAULT_PREFERENCES } from 'src/utils/clientTools/preferences'
import { browserNotificationAdapter } from 'src/utils/clientTools/notificationRules'
import { getErrorMessage } from 'src/utils/errorHandler'

// This device's settings: notifications in the browser and the desktop app, and in the desktop
// app also the approval mode, the folders commands may write in, and launch at login.

const failed = (error, thunkAPI, what) => {
  toast.error(getErrorMessage(error))
  console.error(`Failed to ${what}`, error)
  return thunkAPI.rejectWithValue(error.message)
}

// What the chat needs on every page: the preferences and, in the desktop app, the folders.
export const initializeClientDevice = createAsyncThunk('clientDevice/initialize', async (_, thunkAPI) => {
  try {
    const preferences = readPreferences(window.localStorage)
    const folders = isDesktopApp() ? await desktopBridge.getFolders() : null

    return { preferences, folders }
  } catch (error) {
    return failed(error, thunkAPI, 'load the desktop settings')
  }
})

// What only the settings page shows: notification permission and, in the desktop app, launch at login.
export const loadDeviceSettings = createAsyncThunk('clientDevice/loadDeviceSettings', async (_, thunkAPI) => {
  try {
    if (!isDesktopApp()) {
      return { autostart: false, notificationPermission: browserNotificationAdapter(window).permission() }
    }
    const [autostart, notificationPermission] = await Promise.all([
      desktopBridge.autostartEnabled(),
      desktopBridge.notificationPermission()
    ])

    return { autostart: Boolean(autostart), notificationPermission: notificationPermission || 'unsupported' }
  } catch (error) {
    return failed(error, thunkAPI, 'load the device settings')
  }
})

export const saveClientPreferences = createAsyncThunk('clientDevice/savePreferences', async (patch, thunkAPI) => {
  try {
    const current = thunkAPI.getState().clientDevice.preferences
    const preferences = savePreferences(window.localStorage, { ...current, ...patch })
    // Plan stops a command that is already running.
    if (patch.mode === 'plan' && isDesktopApp()) await desktopBridge.stopCommand()
    return preferences
  } catch (error) {
    return failed(error, thunkAPI, 'save the settings')
  }
})

export const enableNotifications = createAsyncThunk('clientDevice/enableNotifications', async (_, thunkAPI) => {
  try {
    const permission = isDesktopApp()
      ? await desktopBridge.requestNotificationPermission()
      : await browserNotificationAdapter(window).requestPermission()
    if (permission !== 'granted') {
      toast.error('Notifications are blocked. Enable them in your browser or operating system settings.')
      return { permission, preferences: thunkAPI.getState().clientDevice.preferences }
    }
    const current = thunkAPI.getState().clientDevice.preferences
    return { permission, preferences: savePreferences(window.localStorage, { ...current, notifications: true }) }
  } catch (error) {
    return failed(error, thunkAPI, 'enable notifications')
  }
})

export const chooseFolder = createAsyncThunk('clientDevice/chooseFolder', async (_, thunkAPI) => {
  try {
    return await desktopBridge.chooseFolder()
  } catch (error) {
    return failed(error, thunkAPI, 'allow a folder')
  }
})

export const removeFolder = createAsyncThunk('clientDevice/removeFolder', async (path, thunkAPI) => {
  try {
    return await desktopBridge.removeFolder(path)
  } catch (error) {
    return failed(error, thunkAPI, 'remove the folder')
  }
})

export const setWorkingDirectory = createAsyncThunk('clientDevice/setWorkingDirectory', async (path, thunkAPI) => {
  try {
    return await desktopBridge.setWorkingDirectory(path)
  } catch (error) {
    return failed(error, thunkAPI, 'change the working folder')
  }
})

export const setAutostart = createAsyncThunk('clientDevice/setAutostart', async (enabled, thunkAPI) => {
  try {
    await desktopBridge.setAutostart(enabled)
    return enabled
  } catch (error) {
    return failed(error, thunkAPI, 'change launch at login')
  }
})

// How much of a running command's output the chat shows; the tool result carries its own.
const LIVE_OUTPUT_LIMIT = 16 * 1024

const clientDeviceSlice = createSlice({
  name: 'clientDevice',
  initialState: {
    ready: false,
    preferences: DEFAULT_PREFERENCES,
    notificationPermission: 'default',
    // Desktop app only; null in a browser.
    folders: null,
    foldersUpdating: false,
    autostart: false,
    commandRunning: false,
    // Desktop app only: the commands running now, with the end of their output so far.
    // { executionId, threadId, command, startedAt, output }
    commands: [],
    // Threads currently on screen, so their answers and approvals need no notification.
    visibleThreadIds: []
  },
  reducers: {
    foldersChanged: (state, action) => {
      state.folders = action.payload
    },
    commandRunningChanged: (state, action) => {
      state.commandRunning = action.payload
    },
    commandStarted: (state, action) => {
      state.commands = state.commands.filter(command => command.executionId !== action.payload.executionId)
      state.commands.push({ ...action.payload, output: '' })
    },
    commandOutput: (state, action) => {
      const command = state.commands.find(item => item.executionId === action.payload.executionId)
      if (command) command.output = (command.output + action.payload.text).slice(-LIVE_OUTPUT_LIMIT)
    },
    commandFinished: (state, action) => {
      state.commands = state.commands.filter(command => command.executionId !== action.payload)
    },
    threadShown: (state, action) => {
      state.visibleThreadIds.push(action.payload)
    },
    threadHidden: (state, action) => {
      const index = state.visibleThreadIds.indexOf(action.payload)
      if (index !== -1) state.visibleThreadIds.splice(index, 1)
    }
  },
  extraReducers: builder => {
    builder
      .addCase(initializeClientDevice.fulfilled, (state, action) => {
        Object.assign(state, action.payload, { ready: true })
      })
      .addCase(initializeClientDevice.rejected, state => {
        state.ready = true
      })
      .addCase(loadDeviceSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload)
      })
      .addCase(saveClientPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload
      })
      .addCase(enableNotifications.fulfilled, (state, action) => {
        state.notificationPermission = action.payload.permission
        state.preferences = action.payload.preferences
      })
      .addCase(setAutostart.fulfilled, (state, action) => {
        state.autostart = action.payload
      })

    for (const thunk of [chooseFolder, removeFolder, setWorkingDirectory]) {
      builder
        .addCase(thunk.pending, state => {
          state.foldersUpdating = true
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.foldersUpdating = false
          state.folders = action.payload
        })
        .addCase(thunk.rejected, state => {
          state.foldersUpdating = false
        })
    }
  }
})

export const {
  foldersChanged,
  commandRunningChanged,
  commandStarted,
  commandOutput,
  commandFinished,
  threadShown,
  threadHidden
} = clientDeviceSlice.actions

export default clientDeviceSlice.reducer
