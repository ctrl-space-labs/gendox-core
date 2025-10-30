// src/hooks/useJobStatusPoller.js
import { useCallback } from 'react'
import taskService from 'src/gendox-sdk/taskService'
import { useState } from 'react'

export const useJobStatusPoller = ({ organizationId, projectId, token }) => {
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)

  const pollJobStatus = useCallback(
    // 10 seconds interval, 4 hours timeout
    async (jobExecutionId, interval = 10000, timeout = 14400000) => {
      const startTime = Date.now()

      while (true) {
        if (Date.now() - startTime > timeout) {
          setShowTimeoutDialog(true)
        }

        const elapsed = Date.now() - startTime
        let currentInterval
        if (elapsed < 60000) {
          // first minute - poll every 2 seconds
          currentInterval = 2000
        } else if (elapsed < 600000) {
          // first 10 minutes - poll every 5 seconds
          currentInterval = 5000
        } else {
          // after 10 minutes - poll every 10 seconds
          currentInterval = 10000
        }

        await new Promise(res => setTimeout(res, currentInterval))

        const criteria = {
          jobExecutionIdsIn: [jobExecutionId]
        }

        const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)

        let status = response.data?.content[0]?.status
        if (typeof status === 'string') {
          status = status.trim().toUpperCase()
        }

        if (status === 'COMPLETED') {
          setShowTimeoutDialog(false)
          return status
        }
        if (['FAILED', 'STOPPED', 'ABANDONED'].includes(status)) {
          throw new Error(`Job ended with status: ${status}`)
        }

        await new Promise(res => setTimeout(res, currentInterval))
      }
    },
    [organizationId, projectId, token]
  )



  return { pollJobStatus, showTimeoutDialog, }
}
