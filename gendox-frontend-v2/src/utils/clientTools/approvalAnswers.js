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

/** A tool call's arguments as lines a person reads: `name: value`, or the text as it came. */
export function readableArguments(args) {
  let value = args
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return value
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return JSON.stringify(value, null, 2)

  return Object.entries(value)
    .map(([key, item]) => `${key}: ${typeof item === 'string' ? item : JSON.stringify(item, null, 2)}`)
    .join('\n')
}
