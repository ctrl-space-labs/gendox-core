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
