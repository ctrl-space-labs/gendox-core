import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { Play } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import documentService from 'src/gendox-sdk/documentService'
import projectService from 'src/gendox-sdk/projectService'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent, { getToken, useRefreshProfile } from 'src/components/agent/useAgent'
import AgentScope from 'src/components/agent/AgentScope'
import AppLayout from 'src/layouts/AppLayout'
import Dialog from 'src/components/ui/Dialog'
import Spinner from 'src/components/ui/Spinner'
import Switch from 'src/components/ui/Switch'

// Delete asks for the agent's name, since it removes its knowledge and conversations
const DeleteAgentDialog = ({ open, onClose, name, onDelete }) => {
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  return (
    <Dialog
      busy={isDeleting}
      open={open}
      onClose={onClose}
      title={`Delete ${name}?`}
      size='s'
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button aria-busy={isDeleting}
            className='btn danger-solid'
            disabled={typed !== name || isDeleting}
            onClick={async () => {
              setIsDeleting(true)
              await onDelete()
              setIsDeleting(false)
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete agent'}
          </button>
        </>
      }
    >
      <p className='muted' style={{ lineHeight: 1.6 }}>
        This deletes its documents, conversations and tasks. Members lose access and the widget stops answering. This
        can’t be undone.
      </p>
      <div className='field' style={{ marginTop: 16 }}>
        <label>
          Type <b>{name}</b> to confirm
        </label>
        <input className='input' value={typed} onChange={e => setTyped(e.target.value)} />
      </div>
    </Dialog>
  )
}

/**
 * An agent's general settings: PUT organizations/{o}/projects/{p} with name, description and autoTraining,
 * projectAgent.agentName kept equal to the name, and projectAgent.autoDigitization.
 * Process now: GET …/splitting/training?jobName=SPLITTER_AND_TRAINING. Delete: PUT …/projects/{p}/deactivate.
 */
const AgentSettingsPage = () => {
  const router = useRouter()
  const { project, organization, organizationId, projectId, href, save } = useAgent()
  const refreshProfile = useRefreshProfile()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_PROJECT'] })
  const canDelete = useHasOrgRole({ organizationId, roles: ['OP_DELETE_PROJECT'] })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!project) return
    setName(project.name || '')
    setDescription(project.description || '')
  }, [project?.id, project?.name, project?.description])

  if (!project) {
    return (
      <main className='content'>
        <div className='center' style={{ padding: 80 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  const dirty = name.trim() !== (project.name || '') || description !== (project.description || '')

  const saveGeneral = async () => {
    if (!name.trim()) return toast.error('Give the agent a name.')
    setIsSaving(true)
    try {
      await save({ project: { name: name.trim(), description }, agent: { agentName: name.trim() } })
      await refreshProfile()
      toast.success('Saved')
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const toggle = async changes => {
    try {
      await save(changes)
      toast.success('Saved')
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    }
  }

  const processNow = async () => {
    setIsProcessing(true)
    try {
      await documentService.triggerJobs(organizationId, projectId, getToken(), 'SPLITTER_AND_TRAINING', projectId)
      toast.success('Processing started. Documents will be ready in a few minutes.')
    } catch (error) {
      toast.error(`Couldn’t start processing. ${getErrorMessage(error)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const deleteAgent = async () => {
    try {
      await projectService.deactivateProjectById(organizationId, projectId, getToken())
      toast.success(`${project.name} deleted`)
      // leave the page first: with the agent gone from the profile, the guard would send this URL to 404
      const next = organization?.projects?.find(p => p.id !== projectId)
      await router.push(
        next
          ? href('/gendox/agents', { projectId: next.id })
          : `/gendox/create-project/?organizationId=${organizationId}`
      )
      await refreshProfile()
    } catch (error) {
      toast.error(`Couldn’t delete the agent. ${getErrorMessage(error)}`)
    }
  }

  return (
    <main className='content'>
      <AgentScope project={project} tab='general' />
      <div>
        <section className='sect' style={{ paddingTop: 8 }}>
          <header>
            <h2>General</h2>
            <p>The name people see when they chat, and what the agent is for.</p>
          </header>
          <fieldset className='lock' disabled={isSaving}>
          <div className='card card-b form'>
            <div className='field'>
              <label htmlFor='agent-name'>Name</label>
              <input
                id='agent-name'
                className='input'
                value={name}
                disabled={!canEdit}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className='field'>
              <label htmlFor='agent-description'>Description</label>
              <textarea
                id='agent-description'
                className='input'
                rows={3}
                value={description}
                disabled={!canEdit}
                onChange={e => setDescription(e.target.value)}
              />
              <span className='help'>Shown under the name in the website widget.</span>
            </div>
            {canEdit && (
              <div className='row'>
                <span className='sp' />
                <button aria-busy={isSaving} className='btn primary' onClick={saveGeneral} disabled={!dirty || isSaving}>
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
          </fieldset>
        </section>

        <section className='sect'>
          <header>
            <h2>Processing documents</h2>
            <p>New documents are read and split into sections before the agent can cite them.</p>
          </header>
          <div className='card card-b'>
            <div className='toggle-row'>
              <div>
                <b>Process new documents automatically</b>
                <p>
                  Documents are ready soon after you add them. Processing uses AI credits, so you may prefer to run it
                  yourself on large uploads.
                </p>
              </div>
              <Switch
                label='Process new documents automatically'
                checked={project.autoTraining}
                disabled={!canEdit}
                onChange={value => toggle({ project: { autoTraining: value } })}
              />
            </div>
            <div className='toggle-row'>
              <div>
                <b>Process waiting documents now</b>
                <p>Reads every document that hasn’t been processed yet.</p>
              </div>
              <button aria-busy={isProcessing} className='btn s' onClick={processNow} disabled={isProcessing}>
                <Play className='lucide' />
                {isProcessing ? 'Starting…' : 'Process now'}
              </button>
            </div>
            <div className='toggle-row'>
              <div>
                <b>Read scanned pages with AI</b>
                <p>
                  Each page is read by a vision model while processing. Slower and uses more tokens, but reads scans,
                  tables and images.
                </p>
              </div>
              <Switch
                label='Read scanned pages with AI'
                checked={project.projectAgent?.autoDigitization}
                disabled={!canEdit}
                onChange={value => toggle({ agent: { autoDigitization: value } })}
              />
            </div>
          </div>
        </section>

        {canDelete && (
          <section className='sect'>
            <header>
              <h2>Danger zone</h2>
            </header>
            <div className='card danger-zone'>
              <div className='item'>
                <div style={{ flex: 1 }}>
                  <b>Delete this agent</b>
                  <div className='muted sm'>
                    Its knowledge, conversations and tasks are removed, and members lose access. The widget stops
                    working.
                  </div>
                </div>
                <button className='btn danger' onClick={() => setDeleteOpen(true)}>
                  Delete agent
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <DeleteAgentDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        name={project.name}
        onDelete={deleteAgent}
      />
    </main>
  )
}

AgentSettingsPage.getLayout = page => (
  <AppLayout page='agents' title='General' crumb='Agents'>
    {page}
  </AppLayout>
)

AgentSettingsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentSettingsPage
