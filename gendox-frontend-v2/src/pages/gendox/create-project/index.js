import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowRight } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import projectService from 'src/gendox-sdk/projectService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken, useRefreshProfile } from 'src/components/agent/useAgent'
import AppLayout from 'src/layouts/AppLayout'

/**
 * Create an agent: POST organizations/{o}/projects { name, description, autoTraining }.
 * The backend names the agent "<name> Agent"; it is renamed to the project's name, so people only ever see one name.
 * Then the agent home opens on a new chat.
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
      // the new agent opens on a new chat; its Knowledge window sits beside it
      await router.push(href('/gendox/agent-home', { projectId: project.id }) + '#/chat/new')
    } catch (error) {
      toast.error(`Couldn’t create the agent. ${getErrorMessage(error)}`)
    } finally {
      setIsCreating(false)
    }
  }

  const cancelHref = projects.length > 0 ? href('/gendox/agents') : href('/gendox/agent-home')

  return (
    <main className='content'>
      <div className='wiz'>
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
