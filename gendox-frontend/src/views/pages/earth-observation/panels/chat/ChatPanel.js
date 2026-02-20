
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'

const SCRIPT_ID = 'gendox-chat-script'
const CONTAINER_ID = 'gendox-chat-container-id'
const IFRAME_ID = 'gendox-chat-iframe-id'

export default function ChatPanel() {
  const router = useRouter()
  const { organizationId, projectId } = router.query

  useEffect(() => {
    if (!organizationId || !projectId) return

    document.getElementById(SCRIPT_ID)?.remove()
    document.getElementById(CONTAINER_ID)?.remove()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.setAttribute('data-gendox-src', window.location.origin)
    script.setAttribute('data-organization-id', organizationId)
    script.setAttribute('data-project-id', projectId)
    script.setAttribute('data-gendox-container-id', CONTAINER_ID)
    script.setAttribute('data-gendox-iframe-id', IFRAME_ID)
    script.src = `${window.location.origin}/gendox-sdk/gendox-widget-plugin.js`
    document.head.appendChild(script)

    return () => {
      document.getElementById(SCRIPT_ID)?.remove()
      document.getElementById(CONTAINER_ID)?.remove()
    }
  }, [organizationId, projectId])

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} />
  )
}
