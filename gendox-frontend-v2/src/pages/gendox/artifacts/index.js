import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Layers, MessageSquareText, Search, SearchX, Share2 } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import { getToken } from 'src/components/agent/useAgent'
import { formatDateTime, timeAgo } from 'src/components/knowledge/documentUtils'
import { KINDS, kindInfo, kindOf } from 'src/components/artifacts/artifactUtils'
import useProjectArtifacts from 'src/components/artifacts/useProjectArtifacts'
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
 * A row opens the artifact here, where its owner shares it; its conversation opens in the agent home.
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
          <ArtifactView artifactId={open.id} token={getToken()} agentName={project?.name} />
        )}
      </Dialog>
    </>
  )
}

/**
 * The others' artifacts with this agent the user has a role on (gendox-core#570): shared with every member of the
 * agent, or with them by name. A row opens it here, by its id; never the conversation it was made in. An Editor
 * changes it in a chat of their own.
 */
const SharedWithYou = ({ organizationId, projectId, project, query, kind }) => {
  const [open, setOpen] = useState(null) // the summary of the artifact on screen
  const { artifacts, total, failed } = useProjectArtifacts({
    organizationId,
    projectId,
    search: query,
    kind,
    sharedWithMe: true
  })

  if (artifacts === null) return <Loading />

  return (
    <>
      {artifacts.length === 0 ? (
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
            text={`When someone shares an artifact of ${project?.name ?? 'this agent'} with you, it shows up here.`}
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
              </tr>
            </thead>
            <tbody>
              {artifacts.map(artifact => (
                <tr key={artifact.id} style={{ cursor: 'pointer' }} onClick={() => setOpen(artifact)}>
                  <td>
                    <ArtifactName
                      artifact={artifact}
                      line={`v${artifact.latestVersion} · by ${artifact.ownerName || 'someone'}`}
                    />
                  </td>
                  <td className='hide-sm'>
                    <span className='badge'>{kindInfo(kindOf(artifact)).label}</span>
                  </td>
                  <td className='hide-sm muted sm num' title={formatDateTime(artifact.updatedAt)}>
                    {timeAgo(artifact.updatedAt)}
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
        subtitle={open && `By ${open.ownerName || 'someone'}`}
      >
        {open && <ArtifactView artifactId={open.id} token={getToken()} agentName={project?.name} />}
      </Dialog>
    </>
  )
}

/** The artifacts of the user's conversations with this agent, and those others shared with them. */
const ArtifactsPage = () => {
  const { organizationId, projectId, project, href } = useActiveScope()
  const [view, setView] = useState('yours')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('')
  const scope = { organizationId, projectId, project, href, query, kind }

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Artifacts</h1>
          <p>
            {view === 'yours'
              ? `The pages, diagrams, documents and code ${project?.name ?? 'the agent'} made in your conversations, the last changed first.`
              : `What others made with ${project?.name ?? 'the agent'} and shared with you, the last changed first. You see the artifacts, not the conversations they came from.`}
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
