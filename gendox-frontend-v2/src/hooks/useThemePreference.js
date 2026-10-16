import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gx-theme'
const PREFERENCES = ['light', 'dark', 'system']

const readPreference = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    return PREFERENCES.includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

const applyPreference = preference => {
  const osLight = window.matchMedia('(prefers-color-scheme: light)').matches
  document.documentElement.dataset.theme = preference === 'system' ? (osLight ? 'light' : 'dark') : preference
}

/**
 * The colour mode the user chose: 'light' | 'dark' | 'system'.
 * The first paint is handled by the script in _document.js; this keeps it in sync afterwards.
 */
const useThemePreference = () => {
  const [preference, setPreferenceState] = useState('system')

  useEffect(() => {
    setPreferenceState(readPreference())
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onOsChange = () => applyPreference(readPreference())
    media.addEventListener('change', onOsChange)

    return () => media.removeEventListener('change', onOsChange)
  }, [])

  const setPreference = useCallback(next => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    setPreferenceState(next)
    applyPreference(next)
  }, [])

  return [preference, setPreference]
}

export default useThemePreference
