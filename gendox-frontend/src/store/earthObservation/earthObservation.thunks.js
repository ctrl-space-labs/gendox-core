import { createAsyncThunk } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'
import earthObservationService from 'src/gendox-sdk/earthObservationService'
import { geeIframeRef } from 'src/views/pages/earth-observation/panels/shared/panelState'
import { getErrorMessage } from 'src/utils/errorHandler'

export const fetchEOScriptsThunk = createAsyncThunk(
  'earthObservation/fetchEOScripts',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.getEOScripts(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      if (err?.response?.status === 404) return []
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch EOScripts')
    }
  }
)

export const fetchLatestEOScriptThunk = createAsyncThunk(
  'earthObservation/fetchLatestEOScript',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.getLatestEOScript(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      if (err?.response?.status === 404) return null
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch latest EOScript')
    }
  }
)

export const createEOScriptThunk = createAsyncThunk(
  'earthObservation/createEOScript',
  async ({ organizationId, projectId, taskId, eoScriptPayload, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.createEOScript(
        organizationId,
        projectId,
        taskId,
        eoScriptPayload,
        token
      )
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to create EOScript')
    }
  }
)

export const getEOGeometriesThunk = createAsyncThunk(
  'earthObservation/getEOGeometries',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.getEOGeometries(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch EO geometries')
    }
  }
)

export const createEOGeometryThunk = createAsyncThunk(
  'earthObservation/createEOGeometry',
  async ({ organizationId, projectId, taskId, geometryPayload, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.createEOGeometry(
        organizationId,
        projectId,
        taskId,
        geometryPayload,
        token
      )
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to create EO geometry')
    }
  }
)

export const updateEOGeometryThunk = createAsyncThunk(
  'earthObservation/updateEOGeometry',
  async ({ organizationId, projectId, taskId, geometryId, geometryPayload, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.updateEOGeometry(
        organizationId,
        projectId,
        taskId,
        geometryId,
        geometryPayload,
        token
      )
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to update EO geometry')
    }
  }
)

export const deleteEOGeometryThunk = createAsyncThunk(
  'earthObservation/deleteEOGeometry',
  async ({ organizationId, projectId, taskId, geometryId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.deleteEOGeometry(organizationId, projectId, taskId, geometryId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to delete EO geometry')
    }
  }
)

export const deleteEOGeometriesThunk = createAsyncThunk(
  'earthObservation/deleteEOGeometries',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.deleteEOGeometries(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to delete EO geometries')
    }
  }
)

/** Redux-side cancel: only the GEE iframe can run ee.data.cancelOperation (see gee-sandbox.html). */
export const cancelGeeExport = taskId => () => {
  const win = geeIframeRef.current?.contentWindow
  if (!win || !taskId) return
  win.postMessage({ type: 'CANCEL_EXPORT', taskId }, '*')
}
