export const MODES = Object.freeze({
  ask: 'Ask before every command',
  auto: 'Auto-approve; writes only in allowed folders',
  plan: 'Plan — no local commands'
})
export const DEFAULT_PREFERENCES = Object.freeze({
  mode: 'ask',
  notifications: false,
  answerNotifications: true,
  approvalNotifications: true
})
const KEY = 'gendox.client.preferences.v1'

export function readPreferences(storage) {
  try {
    const value = JSON.parse(storage?.getItem(KEY) || '{}')
    return {
      mode: Object.hasOwn(MODES, value?.mode) ? value.mode : 'ask',
      ...Object.fromEntries(
        ['notifications', 'answerNotifications', 'approvalNotifications'].map(key => [
          key,
          typeof value?.[key] === 'boolean' ? value[key] : DEFAULT_PREFERENCES[key]
        ])
      )
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(storage, value) {
  const settings = { ...DEFAULT_PREFERENCES, ...value }
  if (!Object.hasOwn(MODES, settings.mode)) throw new Error('Choose a valid approval mode.')
  storage.setItem(KEY, JSON.stringify(settings))
  return settings
}

export function approvalDecision(mode) {
  return mode === 'auto' ? 'allow' : mode === 'plan' ? 'decline' : 'ask'
}
