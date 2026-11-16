import { ChevronDown, Layers } from 'lucide-react'
import Menu from 'src/components/ui/Menu'
import { kindInfo } from 'src/components/artifacts/artifactUtils'

/**
 * The artifacts of one conversation, in a menu at its top, once there is more than one (gendox-core#523);
 * a single artifact is easy to find at its card.
 *
 * @param artifacts - from artifactsOf, the last changed first
 * @param onOpen({ artifactId }) - open one in the panel or a tab, at its latest version
 */
const ChatArtifacts = ({ artifacts, onOpen }) => {
  if (!onOpen || artifacts.length < 2) return null

  return (
    <Menu
      align='right'
      width={280}
      trigger={({ onClick }) => (
        <button className='btn s gc-arts' title='The artifacts of this conversation' onClick={onClick}>
          <Layers className='lucide' />
          {artifacts.length} artifacts
          <ChevronDown className='lucide' />
        </button>
      )}
    >
      <div className='h'>In this conversation</div>
      {artifacts.map(artifact => {
        const { label, icon: Icon } = kindInfo(artifact.kind)

        return (
          <button
            key={artifact.artifactId}
            className='mi'
            data-close-menu
            onClick={() => onOpen({ artifactId: artifact.artifactId })}
          >
            <Icon className='lucide' />
            <span className='trunc' style={{ flex: 1 }}>
              {artifact.title}
            </span>
            <span className='faint sm'>
              {label} · v{artifact.version}
            </span>
          </button>
        )
      })}
    </Menu>
  )
}

export default ChatArtifacts
