import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowRight, FilePenLine, Globe, Upload } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import projectService from 'src/gendox-sdk/projectService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken, useRefreshProfile } from 'src/components/agent/useAgent'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import WordPressIcon from 'src/components/ui/WordPressIcon'

// where the new agent's first knowledge comes from
const FIRST_KNOWLEDGE = [
  { id: 'upload', icon: Upload, title: 'Upload files', text: 'PDF, Word, Excel, CSV, text or Markdown.', path: '/gendox/knowledge', hash: '#upload' },
  { id: 'website', icon: Globe, title: 'Read a website', text: 'Gendox finds the pages; you pick which to read.', path: '/gendox/integrations', hash: '#add-website' },
  { id: 'wordpress', icon: WordPressIcon, title: 'Connect WordPress', text: 'Your posts and pages stay in sync.', path: '/gendox/wordpress' },
  { id: 'write', icon: FilePenLine, title: 'Write it', text: 'Type or paste a document in Gendox.', path: '/gendox/create-document' }
]

/**
 * Create an agent: POST organizations/{o}/projects { name, description, autoTraining }.
 * The backend names the agent "<name> Agent"; it is renamed to the project's name, so people only ever see one name.
 * Then a second step points to adding knowledge.
 */
const CreateProjectPage = () => {
  const router = useRouter()
  const { organization, organizationId, projects, href } = useActiveScope()
  const refreshProfile = useRefreshProfile()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [autoTraining, setAutoTraining] = useState(true)
  const [nameError, setNameError] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [created, setCreated] = useState(null)
  const [firstKnowledge, setFirstKnowledge] = useState('upload')

  const create = async () => {
    if (!name.trim()) return setNameError(true)
    setIsCreating(true)
    try {
      const token = getToken()
      const response = await projectService.createProject(
        organizationId,
        { organizationId, name: name.trim(), description, autoTraining },
        token
      )
      const project = response.data
      // one name: the agent takes the project's name
      if (project?.projectAgent && project.projectAgent.agentName !== project.name) {
        await projectService
          .updateProject(
            organizationId,
            project.id,
            { ...project, projectAgent: { ...project.projectAgent, agentName: project.name } },
            token
          )
          .catch(() => {})
      }
      await refreshProfile()
      setCreated(project)
    } catch (error) {
      toast.error(`Couldn’t create the agent. ${getErrorMessage(error)}`)
    } finally {
      setIsCreating(false)
    }
  }

  const next = FIRST_KNOWLEDGE.find(k => k.id === firstKnowledge)
  const cancelHref = projects.length > 0 ? href('/gendox/agents') : href('/gendox/agent-home')

  return (
    <main className='content'>
      <div className='wiz'>
        <div className='wiz-steps'>
          <span className='on' />
          <span className={created ? 'on' : ''} />
        </div>

        {!created ? (
          <>
            <h1>Create an agent</h1>
            <p className='muted' style={{ margin: '8px 0 24px' }}>
              An agent answers questions from the knowledge you give it, and shows where each answer comes from.
              {organization ? ` It belongs to ${organization.name}.` : ''}
            </p>
            <div className='card card-b form'>
              <fieldset className='lock' disabled={isCreating}>
              <div className='field'>
                <label htmlFor='agent-name'>Name</label>
                <input
                  id='agent-name'
                  className='input'
                  autoFocus
                  placeholder='e.g. Support Assistant'
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setNameError(false)
                  }}
                  onKeyDown={e => e.key === 'Enter' && create()}
                />
                <span className='help'>Shown to the people who chat with it.</span>
                {nameError && <span className='err'>Give your agent a name.</span>}
              </div>
              <div className='field'>
                <label htmlFor='agent-description'>What is it for?</label>
                <textarea
                  id='agent-description'
                  className='input'
                  rows={3}
                  placeholder='Answers customer questions about orders, returns and warranties.'
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <span className='help'>Optional. Helps your team, and visitors see it in the widget.</span>
              </div>
              <label className='check'>
                <input type='checkbox' checked={autoTraining} onChange={e => setAutoTraining(e.target.checked)} />
                <div>
                  <b>Process new documents automatically</b>
                  <span>
                    Recommended. Documents are read and ready to cite soon after you add them. Turn it off to choose
                    when processing runs.
                  </span>
                </div>
              </label>
              </fieldset>
            </div>
            <div className='row' style={{ marginTop: 20 }}>
              <Link className='btn ghost' href={cancelHref}>
                Cancel
              </Link>
              <span className='sp' />
              <button aria-busy={isCreating} className='btn primary' onClick={create} disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create agent'}
                <ArrowRight className='lucide' />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className='row' style={{ gap: 14, marginBottom: 8 }}>
              <Avatar name={created.name} seed={created.id} size='l' />
              <div>
                <h1>{created.name} is ready</h1>
                <p className='muted'>Now give it something to answer from.</p>
              </div>
            </div>
            <div className='choice' style={{ marginTop: 20 }}>
              {FIRST_KNOWLEDGE.map(({ id, icon: Icon, title, text }) => (
                <label key={id}>
                  <input
                    type='radio'
                    name='first-knowledge'
                    checked={firstKnowledge === id}
                    onChange={() => setFirstKnowledge(id)}
                  />
                  <Icon className='lucide' />
                  <b>{title}</b>
                  <span>{text}</span>
                </label>
              ))}
            </div>
            <div className='row' style={{ marginTop: 20 }}>
              <Link className='btn ghost' href={href('/gendox/agent-home', { projectId: created.id })}>
                Skip for now
              </Link>
              <span className='sp' />
              <button
                className='btn primary'
                onClick={() => router.push(href(next.path, { projectId: created.id }) + (next.hash || ''))}
              >
                Continue
                <ArrowRight className='lucide' />
              </button>
            </div>
            <div className='card card-b' style={{ marginTop: 28 }}>
              <div className='label'>Then</div>
              <ol className='steps-v'>
                <li className='done'>
                  <div>
                    <b>Create the agent</b>
                  </div>
                </li>
                <li>
                  <div>
                    <b>Add knowledge</b>
                    <p>The more it has, the more it can answer.</p>
                  </div>
                </li>
                <li>
                  <div>
                    <b>Set its behavior</b>
                    <p>Tone, rules and what it must never say.</p>
                  </div>
                </li>
                <li>
                  <div>
                    <b>Put it on your website</b>
                    <p>A widget, WordPress, or your own app through the API.</p>
                  </div>
                </li>
              </ol>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

CreateProjectPage.getLayout = page => (
  <AppLayout page='agents' title='New agent' crumb='Agents'>
    {page}
  </AppLayout>
)

export default CreateProjectPage
