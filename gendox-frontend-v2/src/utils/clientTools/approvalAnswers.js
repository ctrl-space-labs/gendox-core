// The user's answers the app waits for, by approval id. The requests themselves are in the
// toolApprovals slice; a promise's resolver is not state, so it waits here, outside Redux.

const waiting = new Map()

/** Resolves to true (allowed) or false. A second request with the same id answers the first with no. */
export function waitForAnswer(id) {
  return new Promise(resolve => {
    waiting.get(id)?.(false)
    waiting.set(id, resolve)
  })
}

export function answer(id, allowed) {
  waiting.get(id)?.(allowed)
  waiting.delete(id)
}

export function answerAll(allowed) {
  waiting.forEach(resolve => resolve(allowed))
  waiting.clear()
}

export const isWaiting = id => waiting.has(id)

// "nextSteps", "next_steps" -> "Next steps"
const humanize = key => {
  const text = String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase()

  return text.charAt(0).toUpperCase() + text.slice(1)
}

const isEntry = item => item && typeof item === 'object' && 'key' in item && 'value' in item

const plainValue = value => {
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  // A list of { key, value } pairs (e.g. filters) reads as "Key: value" lines
  if (Array.isArray(value) && value.every(isEntry)) return value.map(item => `${humanize(item.key)}: ${item.value}`).join('\n')
  if (Array.isArray(value) && value.every(item => item === null || typeof item !== 'object')) return value.join(', ')

  return JSON.stringify(value, null, 2)
}

/** A tool call's arguments as rows a person reads: [{ label, value }], empty ones left out. */
export function argumentFields(args) {
  let value = args
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return value.trim() ? [{ label: 'Input', value }] : []
    }
  }
  if (value == null) return []
  if (typeof value !== 'object' || Array.isArray(value)) return [{ label: 'Input', value: plainValue(value) }]

  return Object.entries(value)
    .filter(([, item]) => item != null && item !== '' && !(Array.isArray(item) && !item.length))
    .map(([key, item]) => ({ label: humanize(key), value: plainValue(item) }))
}

/** "crm_save_note" -> "Crm save note" */
export const toolTitle = name => humanize(name || 'tool')
