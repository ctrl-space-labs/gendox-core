import { useState } from 'react'
import { ArrowUpRight, ChevronDown, ChevronUp, CircleCheck, CircleSlash, CircleX, Download, LoaderCircle, Square } from 'lucide-react'

import { useDispatch } from 'react-redux'

import { cancelGeeExport } from 'src/store/earthObservation'

function getFirstDestinationHref(uris) {
  if (!Array.isArray(uris)) return null
  const u = uris.find(x => typeof x === 'string' && /^https?:\/\//i.test(x))
  return u || null
}

function getExportRowStatus(exp) {
  const u = String(exp.state || '').toUpperCase()
  if (u === 'CANCELLED' || u === 'CANCELED') return 'cancelled'
  if (exp.error || u === 'FAILED') return 'failed'
  if (u === 'SUCCEEDED' || u === 'COMPLETED' || exp.done === true) return 'completed'
  return 'running'
}

function formatProgressPercent(progress) {
  if (progress == null || Number.isNaN(Number(progress))) return null
  const n = Number(progress)
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n)
  return Math.min(100, Math.max(0, pct))
}

function exportDisplayName(exp) {
  return exp.description?.trim() || 'Export'
}

function isCancellingState(exp) {
  const u = String(exp.state || '').toUpperCase()
  return u === 'CANCELLING' || u === 'CANCELING'
}

/** Earth Engine exports started by the script (Export.image.*), with progress, cancel and where each one went */
export default function ExportsPanel({ geeExports }) {
  const dispatch = useDispatch()
  const [listOpen, setListOpen] = useState(true)

  if (!geeExports.length) return null

  return (
    <div className='float'>
      <button className='h' onClick={() => setListOpen(o => !o)}>
        <Download className='lucide' />
        Exports <span className='faint num'>{geeExports.length}</span>
        {listOpen ? <ChevronUp className='lucide' /> : <ChevronDown className='lucide' />}
      </button>
      {listOpen && (
        <div className='b'>
          {geeExports.map(exp => {
            const status = getExportRowStatus(exp)
            const cancelling = isCancellingState(exp)
            const pct = formatProgressPercent(exp.progress)
            const href = status === 'completed' ? getFirstDestinationHref(exp.destinationUris) : null
            const Icon = { running: LoaderCircle, completed: CircleCheck, failed: CircleX, cancelled: CircleSlash }[status]

            return (
              <div key={exp.id} className='eo-row' style={{ alignItems: 'flex-start' }}>
                <Icon
                  className={`lucide ${status === 'running' ? 'turning' : ''}`}
                  style={{
                    width: 15,
                    marginTop: 2,
                    color: status === 'failed' ? 'var(--err)' : status === 'completed' ? 'var(--ok)' : 'var(--text-3)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className='trunc' title={exportDisplayName(exp)}>
                    {exportDisplayName(exp)}
                  </div>
                  {status === 'running' ? (
                    pct != null && (
                      <div className='progress' style={{ height: 4, marginTop: 6 }}>
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    )
                  ) : (
                    <div className='sm' style={{ color: status === 'failed' ? 'var(--err)' : 'var(--text-3)' }}>
                      {status === 'failed' ? exp.error || 'Export failed' : status === 'cancelled' ? 'Cancelled' : 'Done'}
                    </div>
                  )}
                </div>
                {status === 'running' && (
                  <>
                    {pct != null && <span className='faint sm num'>{pct}%</span>}
                    <button
                      className='btn ghost s icon'
                      title={cancelling ? 'Cancelling…' : 'Cancel export'}
                      disabled={cancelling}
                      onClick={() => dispatch(cancelGeeExport(exp.taskId || exp.id))}
                    >
                      <Square className='lucide' />
                    </button>
                  </>
                )}
                {href && (
                  <a className='btn ghost s icon' href={href} target='_blank' rel='noopener noreferrer' title='Open destination'>
                    <ArrowUpRight className='lucide' />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
