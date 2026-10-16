import { Check, ChevronDown } from 'lucide-react'
import Menu from 'src/components/ui/Menu'
import { fmtRelative } from '../utils/editorDateUtils'

/** Each save of a script is a version; open an earlier one */
export default function VersionSelectorMenu({ currentScriptVersions, currentVersion, currentVersionId, onSelectVersion }) {
  if (!currentScriptVersions.length) return null
  const index = currentScriptVersions.findIndex(v => v.id === currentVersionId)

  return (
    <>
      <span className='sep'>›</span>
      <Menu
        width={260}
        trigger={({ onClick }) => (
          <button className='btn ghost s' title='Version history' onClick={onClick} style={{ maxWidth: 220 }}>
            <span className='trunc'>
              {currentVersion?.description || (index >= 0 ? `Version ${currentScriptVersions.length - index}` : 'Latest')}
              {currentVersion?.createdAt ? ` · ${fmtRelative(currentVersion.createdAt)}` : ''}
            </span>
            <ChevronDown className='lucide' />
          </button>
        )}
      >
        <div className='h'>Each save is a version</div>
        {currentScriptVersions.map((version, i) => (
          <button key={version.id} className='mi' data-close-menu onClick={() => onSelectVersion(version)}>
            <span className='trunc' style={{ flex: 1 }}>
              {version.description || `Version ${currentScriptVersions.length - i}`}
            </span>
            <span className='faint sm'>{fmtRelative(version.createdAt)}</span>
            {version.id === currentVersionId && <Check className='lucide' />}
          </button>
        ))}
      </Menu>
    </>
  )
}
