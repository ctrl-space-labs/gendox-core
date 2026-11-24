import { AppWindow, Code, FileText, Shapes } from 'lucide-react'

export const CREATE_ARTIFACT = 'create_artifact'
export const UPDATE_ARTIFACT = 'update_artifact'
const WRITES_ARTIFACT = [CREATE_ARTIFACT, UPDATE_ARTIFACT]

// the backend speaks of types (HTML…), the tools of kinds (html…); the UI uses the kind
export const kindOf = artifact => String(artifact?.kind || artifact?.artifactType?.name || '').toLowerCase()

export const KINDS = {
  html: { label: 'Page', icon: AppWindow, hue: 160, ext: 'html', mime: 'text/html' },
  svg: { label: 'Diagram', icon: Shapes, hue: 280, ext: 'svg', mime: 'image/svg+xml' },
  markdown: { label: 'Document', icon: FileText, hue: 205, ext: 'md', mime: 'text/markdown' },
  code: { label: 'Code', icon: Code, hue: 25, ext: 'txt', mime: 'text/plain' }
}

export const kindInfo = kind => KINDS[kind] || KINDS.code

// html and svg can carry script, so they only ever render in the sealed frame
export const runsInFrame = kind => kind === 'html' || kind === 'svg'

const CODE_EXTENSIONS = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  java: 'java',
  sql: 'sql',
  json: 'json',
  yaml: 'yaml',
  bash: 'sh',
  shell: 'sh',
  css: 'css',
  html: 'html'
}

export const fileNameOf = (title, kind, codeLanguage) => {
  const base = String(title || 'artifact').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'artifact'
  const ext = kind === 'code' ? CODE_EXTENSIONS[String(codeLanguage || '').toLowerCase()] || 'txt' : kindInfo(kind).ext

  return `${base}.${ext}`
}

// The source as a fenced block for the chat's Markdown, which highlights it; the fence is longer than any run of
// backticks inside, so code that shows a fence stays intact
export const fencedCode = (content, language) => {
  const longest = Math.max(2, ...(String(content).match(/`+/g) || []).map(run => run.length))
  const fence = '`'.repeat(longest + 1)

  return `${fence}${language || ''}\n${content}\n${fence}`
}

const parse = value => {
  if (value == null) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}

export const isArtifactCall = call => WRITES_ARTIFACT.includes(call?.function?.name)

/**
 * What one create_artifact / update_artifact call did, from the call and its result in the thread — no request.
 * @returns {{ id, name, args, result, error, pending }} `pending` until the result arrives; `error` from the tool
 */
export const artifactCallOf = (call, responses) => {
  const response = responses.find(r => r.toolCallId === call.id)
  const result = parse(response?.message)

  return {
    id: call.id,
    name: call.function?.name,
    args: parse(call.function?.arguments) || {},
    result: result && result.artifactId ? result : null,
    error: result && result.errorCode ? { code: result.errorCode, message: result.errorMessage } : null,
    pending: !response
  }
}

/**
 * The failed artifact calls of a turn that a later call in the same turn made good: an update of the same artifact,
 * or, for a failed create, a create, that succeeded. Their warning would only confuse; they show with the other tools.
 * @param items - a turn's items, from buildTurns
 * @returns {Set<string>} the ids of those calls
 */
export const recoveredFailuresOf = (items = []) => {
  const calls = items
    .filter(item => item.type === 'tools')
    .flatMap(item => (item.header.toolCalls || []).filter(isArtifactCall).map(call => artifactCallOf(call, item.responses)))
  const recovered = new Set()
  calls.forEach((call, index) => {
    if (!call.error) return
    const madeGood = calls
      .slice(index + 1)
      .some(next =>
        next.result && (call.name === CREATE_ARTIFACT ? next.name === CREATE_ARTIFACT : next.result.artifactId === call.args.artifact_id)
      )
    if (madeGood) recovered.add(call.id)
  })

  return recovered
}

/** The latest version of each artifact the thread's messages know of: { [artifactId]: version } */
export const latestVersionsOf = (messages = []) => {
  const callNames = {}
  messages.forEach(message =>
    (message.toolCalls || []).forEach(call => {
      if (isArtifactCall(call)) callNames[call.id] = true
    })
  )
  const versions = {}
  messages.forEach(message => {
    if (message.role !== 'tool' || !callNames[message.toolCallId]) return
    const result = parse(message.message)
    if (result?.artifactId && Number.isInteger(result.version)) {
      versions[result.artifactId] = Math.max(versions[result.artifactId] || 0, result.version)
    }
  })

  return versions
}

/**
 * How each artifact the thread's messages know of shows, from its latest create or update result — no request:
 * { [artifactId]: 'card' | 'inline' } (gendox-core#570). A result from before displays existed is a card.
 */
export const latestDisplaysOf = (messages = []) => {
  const callNames = {}
  messages.forEach(message =>
    (message.toolCalls || []).forEach(call => {
      if (isArtifactCall(call)) callNames[call.id] = true
    })
  )
  const displays = {}
  const versions = {}
  messages.forEach(message => {
    if (message.role !== 'tool' || !callNames[message.toolCallId]) return
    const result = parse(message.message)
    if (!result?.artifactId) return
    // the result of the latest version wins; a change of display alone keeps the version, so it wins on a tie
    if ((result.version || 0) >= (versions[result.artifactId] || 0)) {
      versions[result.artifactId] = result.version || 0
      displays[result.artifactId] = result.display === 'inline' ? 'inline' : 'card'
    }
  })

  return displays
}

/**
 * The artifacts a thread's messages made, from their tool calls and results — no request — the last changed first.
 * @returns {{ artifactId, title, kind, version }[]}
 */
export const artifactsOf = (messages = []) => {
  const calls = {}
  messages.forEach(message =>
    (message.toolCalls || []).forEach(call => {
      if (isArtifactCall(call)) calls[call.id] = parse(call.function?.arguments) || {}
    })
  )
  const byId = new Map()
  messages.forEach(message => {
    const args = message.role === 'tool' ? calls[message.toolCallId] : null
    const result = args && parse(message.message)
    if (!result?.artifactId) return
    const known = byId.get(result.artifactId)
    byId.delete(result.artifactId) // put back last: the order is the order of the last change
    byId.set(result.artifactId, {
      artifactId: result.artifactId,
      title: result.title || args.title || known?.title || 'Artifact',
      kind: String(result.kind || args.kind || known?.kind || '').toLowerCase(),
      version: Math.max(known?.version || 0, result.version || 0)
    })
  })

  return [...byId.values()].reverse()
}

/** What Try to fix puts in the composer; the user reads it and sends it, or not */
export const fixRequestOf = (title, error) =>
  `Fix “${title || 'the artifact'}”: it shows an error${error.line ? ` at line ${error.line}` : ''}: ${error.message}`

/**
 * The roles a user can have on an artifact (gendox-core#570), lowest first, as Claude's artifacts have them: Viewer
 * sees it, Contributor also uses it (what they do inside it is kept), Editor also changes it with the agent. The owner
 * is its maker, and alone shares it.
 */
export const ROLES = {
  VIEW: { label: 'Viewer', text: 'can view' },
  INTERACT: { label: 'Contributor', text: 'can use' },
  EDIT: { label: 'Editor', text: 'can edit' },
  OWNER: { label: 'Owner', text: 'owns it' }
}
export const SHARED_ROLES = ['VIEW', 'INTERACT', 'EDIT']

const RANK = { VIEW: 1, INTERACT: 2, EDIT: 3, OWNER: 4 }

/** Whether a role is at least the one needed */
export const roleAtLeast = (role, needed) => (RANK[role] || 0) >= RANK[needed]

// a person changed how an artifact shows (gendox-core#570): every chat on the page shows it the new way at once
export const ARTIFACT_DISPLAY_CHANGED = 'gendox:artifact-display-changed'

/** 'card' or 'inline', from an artifact's display type (null is a card) */
export const displayOf = artifact => (String(artifact?.display?.name || '').toUpperCase() === 'INLINE' ? 'inline' : 'card')

// what Change it in a chat leaves for the agent home: the artifact to show beside the new chat, and the request it
// starts with; read once, by the agent home that opens the chat
const CHAT_ON_ARTIFACT = 'gx-chat-on-artifact'

/** Remember that the chat about to open was opened on an artifact (Change it in a chat, gendox-core#570) */
export const rememberChatOnArtifact = (threadId, artifactId, title) => {
  try {
    sessionStorage.setItem(CHAT_ON_ARTIFACT, JSON.stringify({ threadId, artifactId, prefill: `Change “${title}”: ` }))
  } catch (_) {
    // without storage the chat still opens, without the artifact beside it
  }
}

/**
 * The artifact a chat was just opened on, and the request it starts with, once: null for any other chat.
 * @returns {{ artifactId, prefill } | null}
 */
export const takeChatOnArtifact = threadId => {
  try {
    const remembered = JSON.parse(sessionStorage.getItem(CHAT_ON_ARTIFACT) || 'null')
    if (remembered?.threadId !== threadId) return null
    sessionStorage.removeItem(CHAT_ON_ARTIFACT)

    return remembered
  } catch (_) {
    return null
  }
}

/** Save an artifact's content as a file */
export const downloadFile = (name, mime, content) => {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** The language an artifact's source is highlighted as, in its Code tab */
export const sourceLanguageOf = (kind, codeLanguage) =>
  kind === 'code' ? codeLanguage : { html: 'html', svg: 'xml', markdown: 'markdown' }[kind]
