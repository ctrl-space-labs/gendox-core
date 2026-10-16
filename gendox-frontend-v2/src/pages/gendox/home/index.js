import Link from 'next/link'
import { Bot, Check, ChevronRight } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import { sortByField } from 'src/utils/orderUtils'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import Empty from 'src/components/ui/Empty'

const greeting = () => {
  const hour = new Date().getHours()

  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
}

// The organization home. The setup checklist, figures, chat and activity cards arrive with the pages they link to.
const GendoxHome = () => {
  const { user } = useAuth()
  const { organization, projects, projectId, href } = useActiveScope()

  const agents = sortByField([...projects], 'name', projectId)

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>
            Good {greeting()}, {user?.firstName || user?.name}
          </h1>
          {organization && <p>Everything happening in {organization.name}.</p>}
        </div>
      </div>

      <section className='card'>
        <div className='card-h'>
          <h3>Agents</h3>
          <span className='faint sm'>{agents.length}</span>
        </div>
        {agents.length === 0 && (
          <Empty
            icon={<Bot className='lucide' />}
            title='No agents yet'
            text='An agent answers questions from the documents you give it.'
          />
        )}
        {agents.map(agent => (
          <Link key={agent.id} className='item' href={href('/gendox/home', { projectId: agent.id })}>
            <Avatar name={agent.name} seed={agent.id} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className='row'>
                <b style={{ fontWeight: 550 }}>{agent.name}</b>
                {agent.id === projectId && (
                  <span className='badge accent'>
                    <Check className='lucide' />
                    Current
                  </span>
                )}
              </div>
              {agent.description && <div className='muted sm trunc'>{agent.description}</div>}
            </div>
            <ChevronRight className='lucide' />
          </Link>
        ))}
      </section>
    </main>
  )
}

GendoxHome.getLayout = page => (
  <AppLayout page='home' title='Home'>
    {page}
  </AppLayout>
)

GendoxHome.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default GendoxHome
