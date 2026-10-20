import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronRight, Info } from 'lucide-react'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import useModels from 'src/components/agent/useModels'
import { providerLabel } from 'src/components/agent/ModelPicker'
import Dialog from 'src/components/ui/Dialog'
import { TASK_TYPES, TaskTile, taskTypeOf } from 'src/components/tasks/taskUtils'

const formOf = (task, type) => {
  const kind = task ? taskTypeOf(task) : type

  return {
    type: kind,
    title: task?.title ?? '',
    description: task?.description ?? '',
    taskPrompt: task?.taskPrompt ?? '',
    completionModel: task?.completionModel?.name ?? '',
    maxToken: task?.maxToken ?? '',
    temperature: task?.temperature ?? '',
    topP: task?.topP ?? '',
    summarizationEnabled: task?.summarizationEnabled ?? false,
    usePrintedPage: task?.usePrintedPage ?? true,
    usePageText: task?.usePageText ?? false
  }
}

const problemOf = form => {
  if (!form.title.trim()) return 'Give the task a name.'
  if (form.taskPrompt && form.taskPrompt.trim().length < 5) return 'Instructions need at least 5 characters.'
  if (form.maxToken !== '' && Number(form.maxToken) <= 0) return 'The longest answer must be more than 0 tokens.'
  if (form.temperature !== '' && (form.temperature < 0 || form.temperature > 1)) return 'Creativity goes from 0 to 1.'
  if (form.topP !== '' && (form.topP < 0 || form.topP > 1)) return 'Top P goes from 0 to 1.'
  if (form.type === 'DOCUMENT_DIGITIZATION' && !form.usePrintedPage && !form.usePageText)
    return 'Read each page from an image, the text in the file, or both.'

  return null
}

/**
 * Create a task (POST …/tasks) or edit one (PUT …/tasks/{t}). The type is chosen once and can't change.
 * An empty model, length or creativity uses the agent's own.
 */
export const TaskFormDialog = ({ open, task, type = 'DOCUMENT_INSIGHTS', organizationId, projectId, onClose, onSaved }) => {
  const [form, setForm] = useState(() => formOf(task, type))
  const [saving, setSaving] = useState(false)
  const [tried, setTried] = useState(false)
  const models = useModels(open ? organizationId : null, projectId)

  useEffect(() => {
    if (!open) return
    setForm(formOf(task, type))
    setTried(false)
  }, [open, task, type])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const problem = problemOf(form)

  const save = async () => {
    setTried(true)
    if (problem) return
    setSaving(true)
    const number = value => (value === '' || value == null ? null : Number(value))
    const payload = {
      projectId,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      taskPrompt: form.taskPrompt,
      completionModel: form.completionModel ? { name: form.completionModel } : null,
      maxToken: number(form.maxToken),
      temperature: number(form.temperature),
      topP: number(form.topP),
      summarizationEnabled: form.type === 'DOCUMENT_INSIGHTS' ? form.summarizationEnabled : null,
      usePrintedPage: form.type === 'DOCUMENT_DIGITIZATION' ? form.usePrintedPage : null,
      usePageText: form.type === 'DOCUMENT_DIGITIZATION' ? form.usePageText : null
    }
    try {
      const response = task
        ? await taskService.updateTask(organizationId, projectId, task.id, getToken(), payload)
        : await taskService.createTask(organizationId, projectId, payload, getToken())
      toast.success(task ? 'Task saved' : 'Task created')
      onClose()
      onSaved?.(response.data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const kind = TASK_TYPES[form.type]

  return (
    <Dialog
      busy={saving}
      open={open}
      onClose={onClose}
      title={task ? `Edit ${task.title}` : 'New task'}
      size='m'
      footer={
        <>
          {tried && problem && <span className='sm' style={{ color: 'var(--err)', marginRight: 'auto' }}>{problem}</span>}
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' onClick={save} disabled={saving}>
            {task ? 'Save' : 'Create task'}
          </button>
        </>
      }
    >
      <div className='form'>
        {task ? (
          <div className='row muted sm' style={{ gap: 8 }}>
            <TaskTile type={form.type} />
            {kind?.title ?? form.type} · the type can’t be changed
          </div>
        ) : (
          <div className='choice' style={{ gridTemplateColumns: '1fr' }}>
            {Object.entries(TASK_TYPES).map(([key, t]) => (
              <label key={key}>
                <input type='radio' name='task-type' checked={form.type === key} onChange={() => set('type', key)} />
                <t.icon className='lucide' />
                <b>{t.title}</b>
                <span>{t.text}</span>
              </label>
            ))}
          </div>
        )}

        <div className='field'>
          <label htmlFor='task-title'>Name</label>
          <input
            id='task-title'
            className='input'
            value={form.title}
            placeholder='e.g. Contract risk review'
            onChange={e => set('title', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
        </div>
        <div className='field'>
          <label htmlFor='task-description'>Description</label>
          <input
            id='task-description'
            className='input'
            value={form.description}
            placeholder='Optional'
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {form.type === 'DOCUMENT_INSIGHTS' && (
          <label className='check'>
            <input
              type='checkbox'
              checked={form.summarizationEnabled}
              onChange={e => set('summarizationEnabled', e.target.checked)}
            />
            <div>
              <b>Write a summary of each document</b>
              <span>Combines its answers into one short summary.</span>
            </div>
          </label>
        )}
        {form.type === 'DOCUMENT_DIGITIZATION' && (
          <div className='field'>
            <span className='lab'>Read each page from</span>
            <label className='check'>
              <input type='checkbox' checked={form.usePrintedPage} onChange={e => set('usePrintedPage', e.target.checked)} />
              <div>
                <b>An image of the page</b>
                <span>Best for scans, stamps, handwriting and tables.</span>
              </div>
            </label>
            <label className='check'>
              <input type='checkbox' checked={form.usePageText} onChange={e => set('usePageText', e.target.checked)} />
              <div>
                <b>The text in the file</b>
                <span>Faster for digital PDFs. Images and icons are ignored.</span>
              </div>
            </label>
          </div>
        )}
        {form.type === 'EARTH_OBSERVATION' && (
          <p className='muted sm row' style={{ gap: 6 }}>
            <Info className='lucide' style={{ width: 14, height: 14 }} />
            Needs a Google Earth Engine account, set under Connected services.
          </p>
        )}

        <details className='adv'>
          <summary>
            <ChevronRight className='lucide' />
            Instructions and model
          </summary>
          <div className='form'>
            <div className='field'>
              <label htmlFor='task-prompt'>Extra instructions</label>
              <textarea
                id='task-prompt'
                className='input'
                rows={4}
                value={form.taskPrompt}
                placeholder='e.g. Quote the clause your answer comes from.'
                onChange={e => set('taskPrompt', e.target.value)}
              />
              <span className='help'>Given to the AI for every document. Leave empty to use the questions alone.</span>
            </div>
            <div className='field'>
              <label htmlFor='task-model'>Model</label>
              <select
                id='task-model'
                className='input'
                value={form.completionModel}
                onChange={e => set('completionModel', e.target.value)}
              >
                <option value=''>The agent’s model</option>
                {form.completionModel && !models.completion.some(m => m.name === form.completionModel) && (
                  <option value={form.completionModel}>{form.completionModel}</option>
                )}
                {models.completion.map(m => (
                  <option key={m.id ?? m.name} value={m.name}>
                    {m.name} — {providerLabel(m.aiModelProvider?.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className='form-grid'>
              <div className='field'>
                <label htmlFor='task-max'>Longest answer (tokens)</label>
                <input
                  id='task-max'
                  className='input'
                  type='number'
                  min='1'
                  value={form.maxToken}
                  placeholder='The agent’s'
                  onChange={e => set('maxToken', e.target.value)}
                />
              </div>
              <div className='field'>
                <label htmlFor='task-temp'>Creativity</label>
                <input
                  id='task-temp'
                  className='input'
                  type='number'
                  step='0.05'
                  min='0'
                  max='1'
                  value={form.temperature}
                  placeholder='0 to 1'
                  onChange={e => set('temperature', e.target.value)}
                />
              </div>
              <div className='field'>
                <label htmlFor='task-topp'>Top P</label>
                <input
                  id='task-topp'
                  className='input'
                  type='number'
                  step='0.05'
                  min='0'
                  max='1'
                  value={form.topP}
                  placeholder='0 to 1'
                  onChange={e => set('topP', e.target.value)}
                />
              </div>
            </div>
          </div>
        </details>
      </div>
    </Dialog>
  )
}

/** POST …/tasks/duplicate { taskId, newTitle, newDescription, keepQuestions, keepDocuments }. Answers are never copied. */
export const DuplicateTaskDialog = ({ task, organizationId, projectId, onClose, onDuplicated }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [keepQuestions, setKeepQuestions] = useState(true)
  const [keepDocuments, setKeepDocuments] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!task) return
    setTitle(`${task.title} (copy)`)
    setDescription(task.description ?? '')
    setKeepQuestions(true)
    setKeepDocuments(true)
  }, [task])

  const duplicate = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const response = await taskService.duplicateTask(
        organizationId,
        projectId,
        { taskId: task.id, newTitle: title.trim(), newDescription: description.trim(), keepQuestions, keepDocuments },
        getToken()
      )
      toast.success('Task duplicated')
      onClose()
      onDuplicated?.(response.data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      busy={saving}
      open={!!task}
      onClose={onClose}
      title='Duplicate task'
      size='s'
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' onClick={duplicate} disabled={saving || !title.trim()}>
            Duplicate
          </button>
        </>
      }
    >
      <div className='form'>
        <div className='field'>
          <label htmlFor='dup-title'>Name</label>
          <input id='dup-title' className='input' value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className='field'>
          <label htmlFor='dup-description'>Description</label>
          <input
            id='dup-description'
            className='input'
            value={description}
            placeholder='Optional'
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <label className='check'>
          <input type='checkbox' checked={keepQuestions} onChange={e => setKeepQuestions(e.target.checked)} />
          <div>
            <b>Copy the questions</b>
          </div>
        </label>
        <label className='check'>
          <input type='checkbox' checked={keepDocuments} onChange={e => setKeepDocuments(e.target.checked)} />
          <div>
            <b>Copy the documents</b>
            <span>Answers are not copied; generate them again.</span>
          </div>
        </label>
      </div>
    </Dialog>
  )
}
