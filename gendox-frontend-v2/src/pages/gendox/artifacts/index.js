import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Layers, MessageSquareText, Search, SearchX } from 'lucide-react'
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

/**
 * The artifacts of the user's own conversations with this agent (gendox-core#523), the last changed first.
 * A row opens the artifact here; its conversation opens in the agent home. Never another user's: a conversation is
 * personal.
 */
const ArtifactsPage = () => {
  const router = useRouter()
  const { organizationId, projectId, project, href } = useActiveScope()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('')
  const [open, setOpen] = useState(null) // the summary of the artifact on screen
  const { artifacts, total, failed } = useProjectArtifacts({ organizationId, projectId, search: query, kind })

  const chatHref = artifact => `${href('/gendox/agent-home')}#/chat/${artifact.threadId}`
  const isFiltering = Boolean(query.trim() || kind)

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Artifacts</h1>
          <p>
            The pages, diagrams, documents and code {project?.name ?? 'the agent'} made in your conversations, the last
            changed first.
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
        {artifacts === null ? (
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
        ) : artifacts.length === 0 ? (
          failed ? (
            <Empty icon={<SearchX className='lucide' />} title='The artifacts couldn’t be loaded' text='Try again in a moment.' />
          ) : isFiltering ? (
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
                {artifacts.map(artifact => {
                  const { label, icon: Icon, hue } = kindInfo(kindOf(artifact))

                  return (
                    <tr
                      key={artifact.id}
                      style={{ cursor: 'pointer' }}
                      onClick={e => {
                        if (e.target.closest('button, a')) return
                        setOpen(artifact)
                      }}
                    >
                      <td>
                        <div className='row' style={{ gap: 12, maxWidth: 520 }}>
                          <span className='ftype' style={{ '--h': hue }}>
                            <Icon className='lucide' />
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className='trunc' style={{ fontWeight: 500 }}>
                              {artifact.title}
                            </div>
                            <div className='faint sm trunc'>
                              v{artifact.latestVersion} · in {artifact.threadName || 'a conversation'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='hide-sm'>
                        <span className='badge'>{label}</span>
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
                  )
                })}
              </tbody>
            </table>
            {total > artifacts.length && (
              <div className='faint sm' style={{ padding: '10px 16px' }}>
                Showing the {artifacts.length} last changed of {total}. Search to find the others.
              </div>
            )}
          </div>
        )}
      </div>

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
