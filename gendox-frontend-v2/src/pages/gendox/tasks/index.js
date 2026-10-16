import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowUpRight, Copy, Ellipsis, ListChecks, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import { TASK_TYPES, TaskTile, taskTypeOf, typeOfTask } from 'src/components/tasks/taskUtils'
import { DuplicateTaskDialog, TaskFormDialog } from 'src/components/tasks/TaskDialogs'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import Spinner from 'src/components/ui/Spinner'

/**
 * The agent's tasks: GET …/projects/{p}/tasks?taskNameContains, newest first.
 * Create and edit, duplicate (document insights only, as before) and delete.
 */
const TasksPage = () => {
  const router = useRouter()
  const { organizationId, projectId, project, href } = useActiveScope()

  const [tasks, setTasks] = useState(null)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(null)
  const [editing, setEditing] = useState(null)
  const [duplicating, setDuplicating] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(
    async (name = '') => {
      if (!organizationId || !projectId) return
      try {
        const response = await taskService.getTasks(organizationId, projectId, getToken(), {
          size: 100,
          taskNameContains: name.trim() || undefined
        })
        setTasks(response.data?.content ?? response.data ?? [])
        setTotal(response.data?.totalElements ?? response.data?.length ?? 0)
      } catch (error) {
        toast.error(getErrorMessage(error))
        setTasks([])
      }
    },
    [organizationId, projectId]
  )

  useEffect(() => {
    setTasks(null)
  }, [projectId])

  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 250 : 0)

    return () => clearTimeout(timer)
  }, [load, query])

  useEffect(() => {
    if (router.isReady && window.location.hash === '#new') setCreating('DOCUMENT_INSIGHTS')
  }, [router.isReady])

  const taskHref = task => {
    const path = typeOfTask(task).path

    return path ? href(path, { taskId: task.id }) : null
  }

  const open = task => {
    const to = taskHref(task)
    if (to) router.push(to)
  }

  const remove = async task => {
    try {
      await taskService.deleteTask(organizationId, projectId, task.id, getToken())
      toast.success(`${task.title} deleted`)
      load(query)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1>Tasks</h1>
          <p>Work through many documents at once: the same questions for each one, or every page turned into text.</p>
        </div>
        <div className='actions'>
          <label className='search' style={{ minWidth: 220 }}>
            <Search className='lucide' />
            <input placeholder='Find a task' value={query} onChange={e => setQuery(e.target.value)} />
          </label>
          <button className='btn primary' onClick={() => setCreating('DOCUMENT_INSIGHTS')}>
            <Plus className='lucide' />
            New task
          </button>
        </div>
      </div>

      <div className='grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {Object.entries(TASK_TYPES).map(([key, t]) => (
          <button
            key={key}
            className='card card-b'
            style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
            onClick={() => setCreating(key)}
          >
            <TaskTile type={key} />
            <span>
              <b style={{ fontWeight: 550, display: 'block' }}>{t.title}</b>
              <span className='muted sm'>{t.text}</span>
            </span>
          </button>
        ))}
      </div>

      <div className='card' style={{ minWidth: 0 }}>
        {tasks === null ? (
          <div className='center' style={{ minHeight: 0, padding: 40 }}>
            <Spinner />
          </div>
        ) : tasks.length === 0 ? (
          query ? (
            <Empty icon={<SearchX className='lucide' />} title='No tasks match' text='Try another name.' />
          ) : (
            <Empty
              icon={<ListChecks className='lucide' />}
              title={`${project?.name ?? 'This agent'} has no tasks yet`}
              text='Pick a kind of task above to start one.'
            />
          )
        ) : (
          <div className='scroll'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Task</th>
                  <th className='hide-sm'>Type</th>
                  <th className='hide-sm'>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const t = typeOfTask(task)

                  return (
                    <tr
                      key={task.id}
                      style={{ cursor: t.path ? 'pointer' : 'default' }}
                      onClick={e => {
                        if (e.target.closest('button, a, .pop')) return
                        open(task)
                      }}
                    >
                      <td>
                        <div className='row' style={{ gap: 12, maxWidth: 480 }}>
                          <TaskTile task={task} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className='trunc' style={{ fontWeight: 500 }}>
                              {task.title}
                            </div>
                            <div className='faint sm trunc'>{task.description || t.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className='hide-sm'>
                        <span className='badge'>{t.title}</span>
                      </td>
                      <td className='hide-sm muted sm num'>{formatDate(task.createdAt)}</td>
                      <td style={{ width: '1%' }}>
                        <Menu
                          align='right'
                          width={200}
                          trigger={({ onClick }) => (
                            <button className='btn ghost s icon' title='More' onClick={onClick}>
                              <Ellipsis className='lucide' />
                            </button>
                          )}
                        >
                          {t.path && (
                            <Link className='mi' href={taskHref(task)}>
                              <ArrowUpRight className='lucide' />
                              Open
                            </Link>
                          )}
                          <button className='mi' data-close-menu onClick={() => setEditing(task)}>
                            <Pencil className='lucide' />
                            Edit
                          </button>
                          {taskTypeOf(task) === 'DOCUMENT_INSIGHTS' && (
                            <button className='mi' data-close-menu onClick={() => setDuplicating(task)}>
                              <Copy className='lucide' />
                              Duplicate
                            </button>
                          )}
                          <hr />
                          <button
                            className='mi'
                            data-close-menu
                            style={{ color: 'var(--err)' }}
                            onClick={() => setDeleting(task)}
                          >
                            <Trash2 className='lucide' />
                            Delete
                          </button>
                        </Menu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {total > tasks.length && (
              <div className='card-f faint sm'>
                Showing the newest {tasks.length} of {total}. Find the others by name.
              </div>
            )}
          </div>
        )}
      </div>

      <TaskFormDialog
        open={!!creating || !!editing}
        task={editing}
        type={creating ?? 'DOCUMENT_INSIGHTS'}
        organizationId={organizationId}
        projectId={projectId}
        onClose={() => {
          setCreating(null)
          setEditing(null)
        }}
        onSaved={saved => (editing ? load(query) : saved?.id ? open(saved) : load(query))}
      />
      <DuplicateTaskDialog
        task={duplicating}
        organizationId={organizationId}
        projectId={projectId}
        onClose={() => setDuplicating(null)}
        onDuplicated={() => load(query)}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => remove(deleting)}
        title={`Delete “${deleting?.title ?? ''}”?`}
        text='Its questions and answers are deleted. The documents stay in the knowledge.'
      />
    </main>
  )
}

TasksPage.getLayout = page => (
  <AppLayout page='tasks' title='Tasks'>
    {page}
  </AppLayout>
)

TasksPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default TasksPage
