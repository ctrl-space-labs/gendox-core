/**
 * Maps raw Earth Engine operation/task API shapes to the flattened geeExports row
 * (ported from gee-sandbox.html; keep in sync with sandbox RPC behavior).
 */

function firstEeOperation(raw) {
  if (raw == null) return null
  return Array.isArray(raw) ? raw[0] : raw
}

/**
 * getOperation often returns a Closure-wrapped object ({ h: { name, done, metadata, ... } })
 * or a single-key map ({ "projects/.../operations/ID": inner }). Plain JSON operations pass through.
 */
export function unwrapEeOperation(raw) {
  let op = firstEeOperation(raw)
  if (!op || typeof op !== 'object') return op

  const tryPick = candidate => {
    if (!candidate || typeof candidate !== 'object') return null
    if (candidate.metadata && typeof candidate.metadata === 'object') return candidate
    if (candidate.h && typeof candidate.h === 'object') {
      const inner = candidate.h
      if (inner.metadata && typeof inner.metadata === 'object') return inner
    }
    return null
  }

  let picked = tryPick(op)
  if (picked) return picked

  const keys = Object.keys(op)
  if (keys.length === 1) {
    picked = tryPick(op[keys[0]])
    if (picked) return picked
  }

  return op
}

export function isTerminalEeOperationState(state) {
  if (state == null) return false
  const u = String(state).toUpperCase()
  return (
    u === 'SUCCEEDED' ||
    u === 'COMPLETED' ||
    u === 'FAILED' ||
    u === 'CANCELLED' ||
    u === 'CANCELED'
  )
}

/**
 * Reads workflow state from either Cloud API operations ({ metadata.state }) or legacy flat tasks.
 */
export function readOperationState(op) {
  if (!op) return null
  const md = op.metadata
  if (md && typeof md === 'object') return md.state ?? null
  return op.state ?? op.status ?? null
}

/**
 * Full Redux row payload: top-level shortcuts + complete `operation` (name, metadata, done, response, error).
 */
export function buildExportTaskPayload(meta, phase, eeStatusRaw, error) {
  const id = meta.id ?? meta.taskId ?? null
  const baseMeta = {
    id,
    taskId: id,
    domain: meta.domain,
    target: meta.target,
    description: meta.description ?? null,
    phase
  }

  if (error) {
    return {
      ...baseMeta,
      state: 'ERROR',
      progress: null,
      stages: null,
      taskType: null,
      exportType: null,
      priority: null,
      operationName: null,
      destinationUris: null,
      scriptUri: null,
      createTime: null,
      updateTime: null,
      startTime: null,
      endTime: null,
      attempt: null,
      batchEecuUsageSeconds: null,
      metadataType: null,
      done: null,
      response: null,
      operationError: null,
      operation: null,
      error: String(error.message || error)
    }
  }

  const op = unwrapEeOperation(eeStatusRaw)
  if (!op) {
    return {
      ...baseMeta,
      state: null,
      progress: null,
      stages: null,
      taskType: null,
      exportType: null,
      priority: null,
      operationName: null,
      destinationUris: null,
      scriptUri: null,
      createTime: null,
      updateTime: null,
      startTime: null,
      endTime: null,
      attempt: null,
      batchEecuUsageSeconds: null,
      metadataType: null,
      done: null,
      response: null,
      operationError: null,
      operation: null,
      error: null
    }
  }

  const md = op.metadata && typeof op.metadata === 'object' ? op.metadata : null

  if (md) {
    return {
      ...baseMeta,
      description: meta.description ?? md.description ?? baseMeta.description,
      operationName: op.name ?? null,
      state: md.state ?? null,
      progress: md.progress ?? null,
      stages: md.stages ?? null,
      taskType: md.type ?? null,
      exportType: md.type ?? null,
      priority: md.priority ?? null,
      destinationUris: md.destinationUris ?? null,
      scriptUri: md.scriptUri ?? null,
      createTime: md.createTime ?? null,
      updateTime: md.updateTime ?? null,
      startTime: md.startTime ?? null,
      endTime: md.endTime ?? null,
      attempt: md.attempt ?? null,
      batchEecuUsageSeconds: md.batchEecuUsageSeconds ?? null,
      metadataType: md['@type'] ?? null,
      done: op.done ?? null,
      response: op.response ?? null,
      operationError: op.error ?? null,
      operation: op,
      error: null
    }
  }

  return {
    ...baseMeta,
    description: meta.description ?? op.description ?? baseMeta.description,
    operationName: op.name ?? null,
    state: op.state ?? op.status ?? null,
    progress: op.progress ?? null,
    stages: op.stages ?? null,
    taskType: op.type ?? null,
    exportType: op.type ?? null,
    priority: op.priority ?? null,
    destinationUris: op.destinationUris ?? null,
    scriptUri: op.scriptUri ?? null,
    createTime: op.createTime ?? null,
    updateTime: op.updateTime ?? null,
    startTime: op.startTime ?? null,
    endTime: op.endTime ?? null,
    attempt: op.attempt ?? null,
    batchEecuUsageSeconds: op.batchEecuUsageSeconds ?? null,
    metadataType: op['@type'] ?? null,
    done: op.done ?? null,
    response: op.response ?? null,
    operationError: op.error ?? null,
    operation: op,
    error: null
  }
}

export function buildSubmittedGeeExportPayload(meta) {
  return buildExportTaskPayload(meta, 'submitted', null, null)
}

/** Same stop condition as the former sandbox polling tick. */
export function isTerminalGeeExportRow(row) {
  if (!row) return true
  if (row.done === true) return true
  const op = row.operation
  const state = readOperationState(op) ?? row.state
  return isTerminalEeOperationState(state)
}
