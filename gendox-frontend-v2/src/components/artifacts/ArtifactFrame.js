import { useEffect, useRef, useState } from 'react'
import useAppTheme from 'src/hooks/useAppTheme'

const SHELL = '/artifact-sandbox/index.html'
const PROTOCOL_VERSION = '2026-01-26'

// what the artifacts skill tells the agent to style with, from the app's own tokens
const VARIABLES = {
  '--color-background-primary': '--surface',
  '--color-background-secondary': '--surface-2',
  '--color-text-primary': '--text',
  '--color-text-secondary': '--text-2',
  '--color-border-primary': '--border-2',
  '--color-accent': '--accent-text',
  '--font-sans': '--font',
  '--font-mono': '--font-mono'
}

// read where the frame is, so a widget's own colours and theme reach the artifact too
const hostContextOf = element => {
  const style = getComputedStyle(element)
  const variables = {}
  Object.entries(VARIABLES).forEach(([name, token]) => {
    const value = style.getPropertyValue(token).trim()
    if (value) variables[name] = value
  })

  return { theme: style.getPropertyValue('--scheme').trim() === 'light' ? 'light' : 'dark', styles: { variables } }
}

const openLink = url => {
  let target
  try {
    target = new URL(url)
  } catch (_) {
    return
  }
  if (!['http:', 'https:', 'mailto:'].includes(target.protocol)) return
  if (window.confirm(`The artifact wants to open a link:\n\n${target.href}\n\nOpen it in a new tab?`)) {
    window.open(target.href, '_blank', 'noopener,noreferrer')
  }
}

/**
 * An html or svg artifact, rendered sealed (gendox-core#523): a frame sandboxed to scripts only loads the static
 * shell in public/artifact-sandbox/, whose policy allows no network, and the shell renders the artifact inside it.
 * The frame is sent the artifact, the theme and nothing else; it can only report its height, report an error it did
 * not handle, and ask for a link, which opens after the user agrees.
 *
 * @param fit - grow with the content up to maxHeight (the card); otherwise fill the parent (the panel)
 * @param onError({ message, line }) - the artifact's first unhandled error; null again when other content is shown
 */
const ArtifactFrame = ({ kind, content, title = 'Artifact', fit = false, minHeight = 120, maxHeight = 250, onError }) => {
  const frameRef = useRef(null)
  const ready = useRef(false)
  const input = useRef({ kind, content })
  const appTheme = useAppTheme()
  // read by the listener, which is added once
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const failed = useRef(false)
  const [height, setHeight] = useState(null)

  const post = message => frameRef.current?.contentWindow?.postMessage({ jsonrpc: '2.0', ...message }, '*')
  const sendInput = () => post({ method: 'ui/notifications/tool-input', params: { arguments: input.current } })

  useEffect(() => {
    const onMessage = event => {
      const frame = frameRef.current
      // only the frame this component made, and only the methods listed here
      if (!frame || event.source !== frame.contentWindow) return
      const message = event.data
      if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return

      switch (message.method) {
        case 'ui/initialize':
          post({ id: message.id, result: { protocolVersion: PROTOCOL_VERSION, hostContext: hostContextOf(frame) } })
          break
        case 'ui/notifications/initialized':
          ready.current = true
          sendInput()
          break
        case 'ui/notifications/size-changed': {
          const reported = Number(message.params?.height)
          if (Number.isFinite(reported)) setHeight(reported)
          break
        }
        // MCP's log message; only an error, and only the first one, is shown
        case 'notifications/message':
          if (message.params?.level === 'error' && !failed.current) {
            failed.current = true
            onErrorRef.current?.({
              message: String(message.params.data?.message || 'Unknown error'),
              line: Number(message.params.data?.line) || 0
            })
          }
          break
        case 'ui/open-link':
          openLink(String(message.params?.url || ''))
          post({ id: message.id, result: {} })
          break
        default:
          break
      }
    }
    window.addEventListener('message', onMessage)

    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // another version, or another artifact in the same place
  useEffect(() => {
    input.current = { kind, content }
    if (failed.current) onErrorRef.current?.(null)
    failed.current = false
    if (ready.current) sendInput()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, content])

  // a theme switch while it is open
  useEffect(() => {
    if (ready.current && frameRef.current) post({ method: 'ui/notifications/host-context-changed', params: hostContextOf(frameRef.current) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appTheme])

  const style = fit ? { height: Math.min(Math.max(height ?? minHeight, minHeight), maxHeight) } : undefined

  return (
    <iframe
      ref={frameRef}
      src={SHELL}
      title={title}
      sandbox='allow-scripts'
      referrerPolicy='no-referrer'
      style={style}
    />
  )
}

export default ArtifactFrame
