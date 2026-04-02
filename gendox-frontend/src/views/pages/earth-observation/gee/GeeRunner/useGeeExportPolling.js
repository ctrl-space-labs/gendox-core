import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import { selectGeeExports } from 'src/store/earthObservation'
import { isTerminalGeeExportRow } from 'src/store/earthObservation/geeExportPayload'
import { geeIframeRef } from 'src/views/pages/earth-observation/panels/shared/panelState'

const GEE_EXPORT_POLL_MS = 10_000

/**
 * Redux owns timers and terminal logic. The parent window does not load `ee` with the user token, so
 * each tick posts GEE_FETCH_OPERATION to the sandbox; the iframe runs getOperation/getTaskStatus and
 * replies with GEE_OPERATION_RESULT (see gee-sandbox.html).
 */
export function useGeeExportPolling() {
  const geeExports = useSelector(selectGeeExports)
  const intervalByTaskIdRef = useRef(new Map())

  useEffect(() => {
    const activeIds = new Set(
      geeExports.filter(row => !isTerminalGeeExportRow(row)).map(row => row.id).filter(Boolean)
    )

    const map = intervalByTaskIdRef.current

    for (const [taskId, intervalId] of [...map.entries()]) {
      if (!activeIds.has(taskId)) {
        clearInterval(intervalId)
        map.delete(taskId)
      }
    }

    for (const taskId of activeIds) {
      if (map.has(taskId)) continue
      const tick = () => {
        geeIframeRef.current?.contentWindow?.postMessage({ type: 'GEE_FETCH_OPERATION', taskId }, '*')
      }
      tick()
      map.set(taskId, setInterval(tick, GEE_EXPORT_POLL_MS))
    }
  }, [geeExports])

  useEffect(() => {
    return () => {
      for (const intervalId of intervalByTaskIdRef.current.values()) {
        clearInterval(intervalId)
      }
      intervalByTaskIdRef.current.clear()
    }
  }, [])
}
