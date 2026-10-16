import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { CircleAlert, CircleHelp, CircleUser, Cloud, Code, Map as MapIcon, MessageSquareText, PanelsTopLeft, RotateCcw } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import commonConfig from 'src/configs/common.config'
import taskService from 'src/gendox-sdk/taskService'
import { CONNECTOR_TYPES } from 'src/gendox-sdk/organizationConnectorService'
import { getToken } from 'src/components/agent/useAgent'
import { useTopbarTitle } from 'src/layouts/AppLayout'
import TopbarSlot from 'src/layouts/components/TopbarSlot'
import Dock from 'src/components/dock/Dock'
import Menu from 'src/components/ui/Menu'
import GeeAuthGuard from 'src/components/earth-observation/gee/GeeAuthGuard'
import GeeSessionBanner from 'src/components/earth-observation/gee/GeeAuthGuard/GeeSessionBanner'
import MapPanel from 'src/components/earth-observation/panels/map/MapPanel'
import EditorPanel from 'src/components/earth-observation/panels/editor/EditorPanel'
import ChatPanel from 'src/components/earth-observation/panels/chat/ChatPanel'

const GEE_SETUP_DOC_URL = `${commonConfig.gendoxDocsUrl}/earth-observation/gee-project-setup`

// as in the old workspace: the map on the left, the editor above the chat on the right. The windows can't be closed.
const LAYOUT = {
  type: 'split',
  dir: 'row',
  sizes: [1.4, 1],
  children: [
    { type: 'group', tabs: ['/map'], active: '/map' },
    {
      type: 'split',
      dir: 'col',
      sizes: [1.2, 1],
      children: [
        { type: 'group', tabs: ['/editor'], active: '/editor' },
        { type: 'group', tabs: ['/chat'], active: '/chat' }
      ]
    }
  ]
}

const VIEWS = {
  '/map': { title: 'Map', icon: MapIcon, closable: false, element: <MapPanel /> },
  '/editor': { title: 'Editor', icon: Code, closable: false, element: <EditorPanel /> },
  '/chat': { title: 'Chat', icon: MessageSquareText, closable: false, element: <ChatPanel /> }
}

/** Which Google account runs the scripts, and which Cloud project pays for them — or a warning without one */
const GeeAccountChips = () => {
  const { href } = useActiveScope()
  const connectors = useSelector(state => state.activeOrganization.organizationConnectors)
  const geeUserEmail = useSelector(state => state.earthObservation.map.geeUserEmail)
  const fallback = useSelector(state => state.earthObservation.map.geeProjectFallbackActive)
  const projectId =
    (connectors || []).find(c => c.connectorType === CONNECTOR_TYPES.GOOGLE_EARTH_ENGINE)?.config?.projectId || null

  return (
    <>
      <span className='eo-chip hide-sm' title='Google account connected to Earth Engine. Separate from your Gendox sign-in.'>
        <CircleUser className='lucide' />
        {geeUserEmail || 'Resolving Google account…'}
      </span>
      {projectId && !fallback ? (
        <Link className='eo-chip hide-sm' href={href('/gendox/connectors')} title='Earth Engine usage is billed to this Google Cloud project'>
          <Cloud className='lucide' />
          <span className='mono trunc'>{projectId}</span>
        </Link>
      ) : (
        <>
          <Link
            className='eo-chip warn hide-sm'
            href={href('/gendox/connectors')}
            title={
              fallback
                ? `Earth Engine rejected the project “${projectId}”: the API may be off, the id wrong, or you have no access. Map tiles use the shared, rate-limited pool and can fail. Fix it in Connected services.`
                : 'No Google Cloud project is set for Earth Engine. Map tiles use the shared, rate-limited pool and can fail. Set one in Connected services.'
            }
          >
            <CircleAlert className='lucide' />
            {fallback ? `${projectId} · rate limited` : 'No project · rate limited'}
          </Link>
          <a className='btn ghost icon hide-sm' href={GEE_SETUP_DOC_URL} target='_blank' rel='noopener noreferrer' title='Open the setup guide'>
            <CircleHelp className='lucide' />
          </a>
        </>
      )}
    </>
  )
}

/**
 * Earth observation: a Google Earth Engine workspace with the Map, Editor and Chat windows in the same dock as the
 * agent home. Run executes the script in a sandbox iframe; the chat sees the script, its output and the shapes.
 */
const EarthObservationWorkspace = () => {
  const router = useRouter()
  const { organizationId, projectId } = useActiveScope()
  const { taskId } = router.query
  const dockRef = useRef(null)
  const reconnectRef = useRef(null)
  const [title, setTitle] = useState('Earth observation')
  useTopbarTitle(title)

  useEffect(() => {
    if (!organizationId || !projectId || !taskId) return
    taskService
      .getTaskById(organizationId, projectId, taskId, getToken())
      .then(response => setTitle(response.data?.title || 'Earth observation'))
      .catch(() => {})
  }, [organizationId, projectId, taskId])

  const route = useCallback(url => VIEWS[url] ?? null, [])

  return (
    <>
      <TopbarSlot at='end'>
        <GeeAccountChips />
        <Menu
          align='right'
          width={260}
          trigger={({ onClick }) => (
            <button className='btn ghost icon' title='Windows' onClick={onClick}>
              <PanelsTopLeft className='lucide' />
            </button>
          )}
        >
          <div className='h'>Windows</div>
          <div className='faint sm' style={{ padding: '2px 10px 6px' }}>
            Drag a tab onto another window to group them, or to an edge to split. Minimize and maximize from a window’s
            header.
          </div>
          <hr />
          <button className='mi' data-close-menu onClick={() => dockRef.current?.reset()}>
            <RotateCcw className='lucide' />
            Reset layout
          </button>
        </Menu>
      </TopbarSlot>
      <GeeSessionBanner onReconnect={() => reconnectRef.current?.()} />
      <GeeAuthGuard reconnectRef={reconnectRef}>
        <Dock ref={dockRef} storageKey='gx-dock-eo-v1' layout={LAYOUT} route={route} blankUrl={() => '/map'} />
      </GeeAuthGuard>
    </>
  )
}

export default EarthObservationWorkspace
