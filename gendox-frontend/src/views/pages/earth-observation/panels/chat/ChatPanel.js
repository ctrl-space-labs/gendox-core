import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import { selectEoGeometries } from 'src/store/earthObservation'
import { editorCodeRef, keepAllRef } from 'src/views/pages/earth-observation/panels/shared/panelState'
import {
  geomLabel,
  geomSummary,
  geometrySlug,
  normalizeGeometries
} from 'src/views/pages/earth-observation/panels/map/utils/geometryHelpers'

const SCRIPT_ID = 'gendox-chat-script'
const CONTAINER_ID = 'gendox-chat-container-id'
const IFRAME_ID = 'gendox-chat-iframe-id'

export default function ChatPanel() {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const containerRef = useRef(null)
  const printMessages = useSelector(state => state.earthObservation.map.printMessages)
  const printMessagesRef = useRef(printMessages)
  useEffect(() => { printMessagesRef.current = printMessages }, [printMessages])

  const eoGeometries = useSelector(selectEoGeometries)
  const eoGeometriesRef = useRef(eoGeometries)
  useEffect(() => { eoGeometriesRef.current = eoGeometries }, [eoGeometries])

  const mapResultScreenshot = useSelector(state => state.earthObservation.map.mapResultScreenshot)
  const mapResultScreenshotRef = useRef(mapResultScreenshot)
  useEffect(() => { mapResultScreenshotRef.current = mapResultScreenshot }, [mapResultScreenshot])

  useEffect(() => {
    if (!organizationId || !projectId) return

    // Create container div in the Box before script loads
    if (containerRef.current && !document.getElementById(CONTAINER_ID)) {
      const container = document.createElement('div')
      container.id = CONTAINER_ID
      container.className = 'gendox-custom-chat-container-position'
      container.style.position = 'relative' // Override fixed positioning
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.bottom = 'auto'
      container.style.right = 'auto'
      containerRef.current.appendChild(container)
    }

    document.getElementById(SCRIPT_ID)?.remove()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.setAttribute('data-gendox-src', window.location.origin)
    script.setAttribute('data-organization-id', organizationId)
    script.setAttribute('data-project-id', projectId)
    script.setAttribute('data-gendox-container-id', CONTAINER_ID)
    script.setAttribute('data-gendox-iframe-id', IFRAME_ID)
    script.setAttribute('data-gendox-chat-initial-state', 'open')
    script.setAttribute('data-gendox-local-context-max-responses', '4')
    script.setAttribute('data-gendox-local-context-max-wait-ms', '1000')
    script.src = `${window.location.origin}/gendox-sdk/gendox-widget-plugin.js`
    script.onload = () => {
      window.gendox.widget.addLocalContextRequestCallback('GEE_SCRIPT_FILE', function () {
        // Auto-accept any pending AI edits so the script the AI receives
        // matches what the user sees, and the patch line-number counter resets.
        keepAllRef.current?.()
        const raw = editorCodeRef.current || ''
        const withLineNumbers = raw
          .split('\n')
          .map((line, i) => {
            const num = String(i + 1).padStart(4)
            return `${num} | ${line}`
          })
          .join('\n')
        return {
          contextType: 'GEE_SCRIPT_FILE',
          value: withLineNumbers
        }
      })

      window.gendox.widget.addLocalContextRequestCallback('GEE_SCRIPT_LOG_MESSAGES', function () {
        const messages = printMessagesRef.current || []
        if (messages.length === 0) return
        return {
          contextType: 'GEE_SCRIPT_LOG_MESSAGES',
          value: messages.map((msg, i) => `[${i + 1}] ${msg}`).join('\n')
        }
      })

      window.gendox.widget.addLocalContextRequestCallback('GEE_SCRIPT_GEOMETRIES', function () {
        const raw = eoGeometriesRef.current || []
        if (raw.length === 0) return
        const normalized = normalizeGeometries(raw)
        const intro =
          'GEE “Run Code” `geometries` are available in the script (`ee.Geometry` values). Access them by `index`, `geometries["Exact Title"]`, or `geometries.slug`. Example: `var aoi = geometries["Exact Title"]`.'
        const rows = normalized.map((g, i) => {
          const label = geomLabel(g, i)
          const slug = geometrySlug(label)
          const summary = geomSummary(g, i)
          const keyLiteral = JSON.stringify(label)
          const slugPart = slug ? ` | geometries.${slug}` : ''
          return `[${i}] ${summary} → geometries[${i}] | geometries[${keyLiteral}]${slugPart}`
        })
        return {
          contextType: 'GEE_SCRIPT_GEOMETRIES',
          value: [intro, '', ...rows].join('\n')
        }
      })

      // TODO: Enable this when local context image is supported in the backend
      // window.gendox.widget.addLocalContextRequestCallback('GEE_SCRIPT_MAP_RESULT_SCREENSHOT', function () {
      //   return {
      //     contextType: 'GEE_SCRIPT_MAP_RESULT_SCREENSHOT',
      //     value: mapResultScreenshotRef.current || ''
      //   }
      // })
    }
    document.head.appendChild(script)

    return () => {
      window.gendox?.widget?.removeLocalContextRequestCallback?.('GEE_SCRIPT_FILE')
      window.gendox?.widget?.removeLocalContextRequestCallback?.('GEE_SCRIPT_LOG_MESSAGES')
      window.gendox?.widget?.removeLocalContextRequestCallback?.('GEE_SCRIPT_GEOMETRIES')
      // window.gendox?.widget?.removeLocalContextRequestCallback?.('GEE_SCRIPT_MAP_RESULT_SCREENSHOT')
      document.getElementById(SCRIPT_ID)?.remove()
      document.getElementById(CONTAINER_ID)?.remove()
    }
  }, [organizationId, projectId])

  return <Box ref={containerRef} sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} />
}
