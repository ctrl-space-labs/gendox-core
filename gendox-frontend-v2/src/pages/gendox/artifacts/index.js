import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Layers, MessageSquareText, Search, SearchX, Share2 } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import { getToken } from 'src/components/agent/useAgent'
import { formatDateTime, timeAgo } from 'src/components/knowledge/documentUtils'
import { KINDS, kindInfo, kindOf } from 'src/components/artifacts/artifactUtils'
import useProjectArtifacts from 'src/components/artifacts/useProjectArtifacts'
import useSharedWithMe from 'src/components/artifacts/useSharedWithMe'
import ArtifactView from 'src/components/artifacts/ArtifactView'
import AppLayout from 'src/layouts/AppLayout'
import Dialog from 'src/components/ui/Dialog'
import Empty from 'src/components/ui/Empty'
import { SkeletonRows } from 'src/components/ui/Skeleton'

const Loading = () => (
  <div className='scroll'>
    <table className='table' aria-busy='true'>
      <thead>
        <tr>
          <th>Artifact</th>
          <th className='hide-sm'>Kind</th>
          <th className='hide-sm'>Changed</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <SkeletonRows rows={4} columns={[null, 90, 90, null]} />
      </tbody>
    </table>
  </div>
)

/** The artifact's kind as a tinted icon, its title, and a line under it */
const ArtifactName = ({ artifact, line }) => {
  const { icon: Icon, hue } = kindInfo(kindOf(artifact))

  return (
    <div className='row' style={{ gap: 12, maxWidth: 520 }}>
      <span className='ftype' style={{ '--h': hue }}>
        <Icon className='lucide' />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className='trunc' style={{ fontWeight: 500 }}>
          {artifact.title}
        </div>
        <div className='faint sm trunc'>{line}</div>
      </div>
    </div>
  )
}

/**
 * The artifacts of the user's own conversations with this agent (gendox-core#523), the last changed first.
 * A row opens the artifact here, where it can be shared; its conversation opens in the agent home. Never another
 * user's: a conversation is personal.
 */
const YourArtifacts = ({ organizationId, projectId, project, href, query, kind }) => {
  const router = useRouter()
  const [open, setOpen] = useState(null) // the summary of the artifact on screen
  const { artifacts, total, failed } = useProjectArtifacts({ organizationId, projectId, search: query, kind })
  const chatHref = artifact => `${href('/gendox/agent-home')}#/chat/${artifact.threadId}`

  if (artifacts === null) return <Loading />

  return (
    <>
      {artifacts.length === 0 ? (
        failed ? (
          <Empty icon={<SearchX className='lucide' />} title='The artifacts couldn’t be loaded' text='Try again in a moment.' />
        ) : query.trim() || kind ? (
          <Empty icon={<SearchX className='lucide' />} title='No artifacts match' text='Try another title or kind.' />
        ) : (
          <Empty
            icon={<Layers className='lucide' />}
            title='No artifacts yet'
            text={`Ask ${project?.name ?? 'the agent'} for a page, a diagram or a document in a chat, and it shows up here.`}
            action={
              <Link className='btn primary' href={`${href('/gendox/agent-home')}#/chat/new`}>
                New chat
              </Link>
            }
          />
        )
      ) : (
        <div className='scroll'>
          <table className='table'>
            <thead>
              <tr>
                <th>Artifact</th>
                <th className='hide-sm'>Kind</th>
                <th className='hide-sm'>Changed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {artifacts.map(artifact => (
                <tr
                  key={artifact.id}
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    if (e.target.closest('button, a')) return
                    setOpen(artifact)
                  }}
                >
                  <td>
                    <ArtifactName
                      artifact={artifact}
                      line={`v${artifact.latestVersion} · in ${artifact.threadName || 'a conversation'}`}
                    />
                  </td>
                  <td className='hide-sm'>
                    <span className='badge'>{kindInfo(kindOf(artifact)).label}</span>
                  </td>
                  <td className='hide-sm muted sm num' title={formatDateTime(artifact.updatedAt)}>
                    {timeAgo(artifact.updatedAt)}
                  </td>
                  <td style={{ width: '1%' }}>
                    <Link className='btn ghost s icon' title='Open the conversation' href={chatHref(artifact)}>
                      <MessageSquareText className='lucide' />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > artifacts.length && (
            <div className='faint sm' style={{ padding: '10px 16px' }}>
              Showing the {artifacts.length} last changed of {total}. Search to find the others.
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        size='xl'
        className='art-modal'
        title={open?.title}
        subtitle={open && `In ${open.threadName || 'a conversation'}`}
        footer={
          open && (
            <button className='btn' onClick={() => router.push(chatHref(open))}>
              <MessageSquareText className='lucide' />
              Open the conversation
            </button>
          )
        }
      >
        {open && (
          <ArtifactView threadId={open.threadId} artifactId={open.id} token={getToken()} agentName={project?.name} />
        )}
      </Dialog>
    </>
  )
}

/**
 * What others shared with the user (gendox-core#523): with this agent's members, or with them by name. This agent's,
 * or every agent's in the organization, including agents the user is not a member of. A row opens it read only.
 */
const SharedWithYou = ({ organizationId, projectId, projects, href, query, kind }) => {
  const router = useRouter()
  const [everyAgent, setEveryAgent] = useState(false)
  const { shares, total, failed } = useSharedWithMe({
    organizationId,
    projectId: everyAgent ? undefined : projectId,
    search: query,
    kind
  })
  const agentName = id => projects.find(p => p.id === id)?.name

  // who shared it, and with whom: everyone in an agent, or the user by name (from which agent, across every agent)
  const lineOf = share => {
    const by = `By ${share.sharedByName || 'someone'}`
    const agent = agentName(share.projectId)
    if (share.audience === 'PROJECT') return `${by} · with everyone in ${agent ?? 'an agent'}`

    return everyAgent && agent ? `${by} · with you · ${agent}` : `${by} · with you`
  }

  return (
    <>
      <div className='row' style={{ gap: 6, padding: '12px 16px 0' }}>
        <button className={`chip ${everyAgent ? '' : 'on'}`} onClick={() => setEveryAgent(false)}>
          This agent
        </button>
        <button className={`chip ${everyAgent ? 'on' : ''}`} onClick={() => setEveryAgent(true)}>
          Every agent
        </button>
      </div>
      {shares === null ? (
        <Loading />
      ) : shares.length === 0 ? (
        failed ? (
          <Empty
            icon={<SearchX className='lucide' />}
            title='What was shared with you couldn’t be loaded'
            text='Try again in a moment.'
          />
        ) : query.trim() || kind ? (
          <Empty icon={<SearchX className='lucide' />} title='Nothing shared matches' text='Try another title or kind.' />
        ) : (
          <Empty
            icon={<Share2 className='lucide' />}
            title='Nothing shared with you yet'
            text={
              everyAgent
                ? 'When someone in the organization shares an artifact with you, it shows up here.'
                : 'Nothing from this agent. Look in every agent, or wait until someone shares one with you.'
            }
          />
        )
      ) : (
        <div className='scroll'>
          <table className='table'>
            <thead>
              <tr>
                <th>Artifact</th>
                <th className='hide-sm'>Kind</th>
                <th className='hide-sm'>Shared</th>
                <th className='hide-sm'>Version</th>
              </tr>
            </thead>
            <tbody>
              {shares.map(share => (
                <tr
                  key={share.shareId}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(href('/gendox/shared-artifact', { shareId: share.shareId }))}
                >
                  <td>
                    <ArtifactName artifact={share} line={lineOf(share)} />
                  </td>
                  <td className='hide-sm'>
                    <span className='badge'>{kindInfo(kindOf(share)).label}</span>
                  </td>
                  <td className='hide-sm muted sm num' title={formatDateTime(share.sharedAt)}>
                    {timeAgo(share.sharedAt)}
                  </td>
                  <td className='hide-sm muted sm'>{share.followsLatest ? 'Latest' : `v${share.version}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > shares.length && (
            <div className='faint sm' style={{ padding: '10px 16px' }}>
              Showing the {shares.length} newest of {total}. Search to find the others.
            </div>
          )}
        </div>
      )}
    </>
  )
}

/** The artifacts of the user's conversations with this agent, and those others shared with them. */
const ArtifactsPage = () => {
  const { organizationId, projectId, project, projects, href } = useActiveScope()
  const [view, setView] = useState('yours')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('')
  const scope = { organizationId, projectId, project, projects, href, query, kind }

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Artifacts</h1>
          <p>
            {view === 'yours'
              ? `The pages, diagrams, documents and code ${project?.name ?? 'the agent'} made in your conversations, the last changed first.`
              : 'The artifacts people in your organization shared with you, the newest first. You see them, not the conversations they came from.'}
          </p>
        </div>
        <div className='actions'>
          <label className='search' style={{ minWidth: 220 }}>
            <Search className='lucide' />
            <input placeholder='Find an artifact' value={query} onChange={e => setQuery(e.target.value)} />
          </label>
          <select
            className='input'
            style={{ width: 150, height: 34 }}
            aria-label='Kind'
            value={kind}
            onChange={e => setKind(e.target.value)}
          >
            <option value=''>Every kind</option>
            {Object.entries(KINDS).map(([key, k]) => (
              <option key={key} value={key}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='card' style={{ minWidth: 0 }}>
        <div className='tabs' role='tablist'>
          {[
            ['yours', 'Yours'],
            ['shared', 'Shared with you']
          ].map(([id, label]) => (
            <button
              key={id}
              role='tab'
              aria-selected={view === id}
              className={view === id ? 'on' : ''}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {view === 'yours' ? <YourArtifacts {...scope} /> : <SharedWithYou {...scope} />}
      </div>
    </main>
  )
}

ArtifactsPage.getLayout = page => (
  <AppLayout page='artifacts' title='Artifacts'>
    {page}
  </AppLayout>
)

ArtifactsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ArtifactsPage
