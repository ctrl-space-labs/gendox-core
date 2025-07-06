// src/hooks/useJobStatusPoller.js
import { useCallback } from 'react'
import taskService from 'src/gendox-sdk/taskService'

export const useJobStatusPoller = ({ organizationId, projectId, token }) => {
  const pollJobStatus = useCallback(
    async (jobExecutionId, interval = 3000, timeout = 180000) => {
      const startTime = Date.now()

      while (true) {
        if (Date.now() - startTime > timeout) {
          throw new Error('Job polling timeout')
        }

        const response = await taskService.getJobStatus(organizationId, projectId, jobExecutionId, token)

        let status = response.data
        if (typeof status === 'string') {
          status = status.trim().toUpperCase()
        }

        if (status === 'COMPLETED') {
          return status
        }
        if (['FAILED', 'STOPPED', 'ABANDONED'].includes(status)) {
          throw new Error(`Job ended with status: ${status}`)
        }

        await new Promise(res => setTimeout(res, interval))
      }
    },
    [organizationId, projectId, token]
  )

  return { pollJobStatus }
}
