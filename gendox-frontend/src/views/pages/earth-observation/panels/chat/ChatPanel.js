
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import { editorCodeRef } from 'src/views/pages/earth-observation/editorState'

const SCRIPT_ID = 'gendox-chat-script'
const CONTAINER_ID = 'gendox-chat-container-id'
const IFRAME_ID = 'gendox-chat-iframe-id'

export default function ChatPanel() {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const containerRef = useRef(null)

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
    script.setAttribute('data-gendox-local-context-max-responses', '2')
    script.setAttribute('data-gendox-local-context-max-wait-ms', '1000')
    script.src = `${window.location.origin}/gendox-sdk/gendox-widget-plugin.js`
    document.head.appendChild(script)

    // TODO think if it's not needed to pass every time the code, and use a tool for the agent to ask to retrieve the script
    setTimeout(() => {
      window.gendox.widget.addLocalContextRequestCallback('GEE_SCRIPT_FILE', function () {
        console.log('GEE_SCRIPT_FILE:' + editorCodeRef.current)
        return {
          contextType: 'GEE_SCRIPT_FILE',
          value: editorCodeRef.current
        }
      })
    }, 1000)

    return () => {
      document.getElementById(SCRIPT_ID)?.remove()
      document.getElementById(CONTAINER_ID)?.remove()
    }
  }, [organizationId, projectId])

  return (
    <Box
      ref={containerRef}
      sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
    />
  )
}
