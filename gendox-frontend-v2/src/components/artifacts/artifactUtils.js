import { AppWindow, Code, FileText, Shapes } from 'lucide-react'

export const CREATE_ARTIFACT = 'create_artifact'
export const UPDATE_ARTIFACT = 'update_artifact'
const WRITES_ARTIFACT = [CREATE_ARTIFACT, UPDATE_ARTIFACT]

// the backend speaks of types (HTML…), the tools of kinds (html…); the UI uses the kind
export const kindOf = artifact => String(artifact?.kind || artifact?.artifactType?.name || '').toLowerCase()

export const KINDS = {
  html: { label: 'Page', icon: AppWindow, ext: 'html', mime: 'text/html' },
  svg: { label: 'Diagram', icon: Shapes, ext: 'svg', mime: 'image/svg+xml' },
  markdown: { label: 'Document', icon: FileText, ext: 'md', mime: 'text/markdown' },
  code: { label: 'Code', icon: Code, ext: 'txt', mime: 'text/plain' }
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
