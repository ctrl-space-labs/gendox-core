import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'

const RUNNING = ['STARTING', 'STARTED', 'STOPPING']
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
// often at first, then less: a long run can take hours
const intervalAfter = ms => (ms < 60000 ? 2000 : ms < 600000 ? 5000 : 10000)
const idOf = job => job?.jobExecutionId ?? job?.id

/** The parameters a job was started with, e.g. documentNodeIds, as values (JSON lists parsed) */
export const jobParam = (job, name) => {
  const value = job?.batchJobExecutionParams?.find(p => p.parameterName === name)?.parameterValue
  try {
    return value && value.startsWith('[') ? JSON.parse(value) : value
  } catch {
    return value
  }
}

/**
 * A task's generation job: POST …/tasks/{t}/execute starts one, GET …/jobs?jobExecutionIdsIn polls it,
 * POST …/jobs/{id}/stop stops it. A job already running when the page opens is picked up again.
 *
 * @param onTick - called on every poll while it runs, to show what is ready so far
 * @param onFinished - (status) once it has ended: COMPLETED, STOPPED or FAILED
 */
const useTaskJob = ({ organizationId, projectId, taskId, onTick, onFinished }) => {
  const [job, setJob] = useState(null) // { id, status, params }
  const runRef = useRef(0)
  const callbacks = useRef({ onTick, onFinished })
  callbacks.current = { onTick, onFinished }

  const follow = useCallback(
    async (id, first) => {
      const run = ++runRef.current
      const startedAt = Date.now()
      setJob({ id, status: first?.status ?? 'STARTED', job: first })
      while (runRef.current === run) {
        await sleep(intervalAfter(Date.now() - startedAt))
        if (runRef.current !== run) return
        let current
        try {
          const response = await taskService.getJobsByCriteria(organizationId, projectId, { jobExecutionIdsIn: [id] }, getToken())
          current = response.data?.content?.[0]
        } catch {
          continue // a missed poll is not the end of the job
        }
        if (runRef.current !== run) return
        const status = current?.status?.toUpperCase()
        if (current && RUNNING.includes(status)) {
          setJob(j => ({ ...j, status, job: current }))
          callbacks.current.onTick?.()
          continue
        }
        runRef.current++
        setJob(null)
        callbacks.current.onFinished?.(status ?? 'COMPLETED')

        return
      }
    },
    [organizationId, projectId]
  )

  // a job started earlier, by this page or anyone else, keeps showing until it ends
  useEffect(() => {
    if (!organizationId || !projectId || !taskId) return
    let cancelled = false
    taskService
      .getJobsByCriteria(
        organizationId,
        projectId,
        {
          status: 'STARTED',
          matchAllParams: [
            { paramName: 'projectId', paramValue: projectId },
            { paramName: 'taskId', paramValue: taskId }
          ]
        },
        getToken()
      )
      .then(response => {
        const running = response.data?.content?.[0]
        if (!cancelled && running && idOf(running) != null) follow(idOf(running), running)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      runRef.current++
    }
  }, [organizationId, projectId, taskId, follow])

  const start = useCallback(
    async criteria => {
      try {
        const response = await taskService.executeTaskByType(organizationId, projectId, taskId, { taskId, ...criteria }, getToken())
        const id = typeof response.data === 'object' ? idOf(response.data) : response.data
        if (id == null) {
          // started without telling us which job: show it as done on the next refresh
          callbacks.current.onFinished?.('COMPLETED')

          return
        }
        follow(id)
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    [organizationId, projectId, taskId, follow]
  )

  const stop = useCallback(async () => {
    if (!job) return
    setJob(j => (j ? { ...j, status: 'STOPPING' } : j))
    try {
      await taskService.stopJob(organizationId, projectId, job.id, getToken())
      toast('Stopping. It can take up to a minute to stop completely.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }, [job, organizationId, projectId])

  return { job, running: !!job, stopping: job?.status === 'STOPPING', start, stop }
}

export default useTaskJob
