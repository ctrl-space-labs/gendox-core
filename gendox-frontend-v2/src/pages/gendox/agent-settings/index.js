import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { Check, Copy, FileDown, Play } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import documentService from 'src/gendox-sdk/documentService'
import projectService from 'src/gendox-sdk/projectService'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent, { getToken, useRefreshProfile } from 'src/components/agent/useAgent'
import AgentScope from 'src/components/agent/AgentScope'
import AgentPageSkeleton from 'src/components/agent/AgentPageSkeleton'
import AppLayout from 'src/layouts/AppLayout'
import Dialog from 'src/components/ui/Dialog'
import Switch from 'src/components/ui/Switch'
import { findDocuments } from 'src/components/tasks/DocumentPicker'
import { plural } from 'src/components/knowledge/documentUtils'
import { downloadBlobForCSV } from 'src/utils/tasks/downloadBlobForCSV'
import { copyToClipboard } from 'src/utils/copyToClipboard'

/**
 * The agent's definition file, shown before it is downloaded: GET …/definition as YAML or JSON, each loaded the first
 * time it is shown, while the details are open
 */
const DefinitionPreview = ({ organizationId, projectId }) => {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState('yaml')
  const [files, setFiles] = useState({}) // format -> text, or an Error when it couldn't be loaded
  const [copied, setCopied] = useState(false)
  const file = files[format]

  useEffect(() => {
    if (!open || files[format] !== undefined) return
    projectService
      .getAgentDefinition(organizationId, projectId, format, getToken())
      .then(response => response.data.text())
      .then(text => setFiles(f => ({ ...f, [format]: format === 'json' ? JSON.stringify(JSON.parse(text), null, 2) : text })))
      .catch(error => setFiles(f => ({ ...f, [format]: error })))
  }, [open, format, files, organizationId, projectId])

  const copy = async () => {
    await copyToClipboard(file)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <details className='card-f' onToggle={e => setOpen(e.currentTarget.open)}>
      <summary className='muted sm' style={{ cursor: 'pointer' }}>
        Preview the file
      </summary>
      <div className='row' style={{ margin: '12px 0 8px' }}>
        <div className='pill-tabs'>
          {['yaml', 'json'].map(f => (
            <button key={f} className={f === format ? 'on' : ''} onClick={() => setFormat(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <span className='sp' />
        <button className='btn ghost s' onClick={copy} disabled={typeof file !== 'string'}>
          {copied ? <Check className='lucide' /> : <Copy className='lucide' />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {file instanceof Error ? (
        <p className='muted sm'>Couldn’t load the file. {getErrorMessage(file)}</p>
      ) : (
        <pre className='code' style={{ maxHeight: 360, overflow: 'auto' }}>
          {file ?? 'Loading…'}
        </pre>
      )}
    </details>
  )
}

// Delete asks for the agent's name, since it removes its knowledge and conversations; it says how much is lost
const DeleteAgentDialog = ({ open, onClose, name, organizationId, projectId, onDelete }) => {
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [counts, setCounts] = useState(null) // { documents, members }, either null when unknown

  useEffect(() => {
    if (!open) return
    setTyped('')
    setCounts(null)
    Promise.allSettled([
      findDocuments(organizationId, projectId, { size: 1 }),
      projectService.getProjectMembers(organizationId, projectId, getToken())
    ]).then(([docs, members]) =>
      setCounts({
        documents: docs.status === 'fulfilled' ? docs.value?.totalElements ?? null : null,
        members:
          members.status === 'fulfilled'
            ? (members.value.data ?? []).filter(m => m.user?.userType?.name !== 'GENDOX_AGENT').length
            : null
      })
    )
  }, [open, organizationId, projectId])

  const documents = counts?.documents != null ? `its ${plural(counts.documents, 'document')}` : 'its documents'
  const members =
    counts?.members != null ? `${plural(counts.members, 'member')} ${counts.members === 1 ? 'loses' : 'lose'}` : 'Members lose'

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
        {counts === null ? (
          <>
            <span className='skel' style={{ display: 'block', width: '95%' }} />
            <span className='skel' style={{ display: 'block', width: '70%', marginTop: 8 }} />
          </>
        ) : (
          `This deletes ${documents}, conversations and tasks. ${members} access and the widget stops answering. This can’t be undone.`
        )}
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
  const [exporting, setExporting] = useState(null) // 'json' | 'yaml' while that file is prepared
  const [toggling, setToggling] = useState(null) // { key, value } while a switch's change is saved
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!project) return
    setName(project.name || '')
    setDescription(project.description || '')
  }, [project?.id, project?.name, project?.description])

  if (!project) return <AgentPageSkeleton tab='general' />

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

  const toggle = async (key, value, changes) => {
    setToggling({ key, value })
    try {
      await save(changes)
      toast.success('Saved')
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    } finally {
      setToggling(null)
    }
  }
  const switchState = (key, saved) => ({
    checked: toggling?.key === key ? toggling.value : saved,
    busy: toggling?.key === key
  })

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

  // the agent's setup as a file, named after it: support-bot.agent.json
  const exportAgent = async format => {
    setExporting(format)
    try {
      const response = await projectService.getAgentDefinition(organizationId, projectId, format, getToken())
      const slug = (project.name || 'agent').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'agent'
      downloadBlobForCSV(response.data, `${slug}.agent.${format}`)
    } catch (error) {
      toast.error(`Couldn’t export the agent. ${getErrorMessage(error)}`)
    } finally {
      setExporting(null)
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
                {...switchState('autoTraining', project.autoTraining)}
                disabled={!canEdit || Boolean(toggling)}
                onChange={value => toggle('autoTraining', value, { project: { autoTraining: value } })}
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
                {...switchState('autoDigitization', project.projectAgent?.autoDigitization)}
                disabled={!canEdit || Boolean(toggling)}
                onChange={value => toggle('autoDigitization', value, { agent: { autoDigitization: value } })}
              />
            </div>
          </div>
        </section>

        <section className='sect'>
          <header>
            <h2>Export</h2>
            <p>
              The agent’s setup as a file: instructions, models, settings, chat look, tools and skills. Its documents,
              conversations and members are not included.
            </p>
          </header>
          <div className='card'>
            <div className='item' style={{ flexWrap: 'wrap' }}>
              <span className='ftype' style={{ '--h': 270 }}>
                <FileDown className='lucide' />
              </span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <b style={{ fontWeight: 500 }}>Download settings</b>
                <div className='faint sm'>YAML is easier to read and edit; JSON is what the API takes.</div>
              </div>
              {['yaml', 'json'].map(format => (
                <button
                  key={format}
                  aria-busy={exporting === format}
                  className='btn s'
                  onClick={() => exportAgent(format)}
                  disabled={Boolean(exporting)}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            <DefinitionPreview organizationId={organizationId} projectId={projectId} />
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
        organizationId={organizationId}
        projectId={projectId}
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
