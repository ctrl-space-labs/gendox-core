import {
  getEOGeometriesThunk,
  createEOGeometryThunk,
  updateEOGeometryThunk,
  deleteEOGeometryThunk,
  deleteEOGeometriesThunk
} from './earthObservation.thunks'

export const geometriesInitialState = {
  eoGeometries: [],
  eoGeometriesLoading: false,
  eoGeometriesError: null,
  createEOGeometryLoading: false,
  createEOGeometryError: null,
  updateEOGeometryLoading: false,
  updateEOGeometryError: null,
  deleteEOGeometryLoading: false,
  deleteEOGeometryError: null
}

export const geometriesReducers = {
  toggleGeometryVisibility: (state, action) => {
    const geom = state.geometries.eoGeometries.find(g => g.id === action.payload)
    if (geom) geom.isVisible = !geom.isVisible
  }
}

export function addGeometriesExtraReducers(builder) {
  builder
    .addCase(getEOGeometriesThunk.pending, state => {
      state.geometries.eoGeometriesLoading = true
      state.geometries.eoGeometriesError = null
    })
    .addCase(getEOGeometriesThunk.fulfilled, (state, action) => {
      state.geometries.eoGeometriesLoading = false
      state.geometries.eoGeometries = action.payload.map(g => ({ ...g, isVisible: true }))
    })
    .addCase(getEOGeometriesThunk.rejected, (state, action) => {
      state.geometries.eoGeometriesLoading = false
      state.geometries.eoGeometriesError = action.payload || 'Failed to fetch EO geometries'
    })

    .addCase(createEOGeometryThunk.pending, state => {
      state.geometries.createEOGeometryLoading = true
      state.geometries.createEOGeometryError = null
    })
    .addCase(createEOGeometryThunk.fulfilled, (state, action) => {
      state.geometries.createEOGeometryLoading = false
      state.geometries.eoGeometries.push({ ...action.payload, isVisible: true })
    })
    .addCase(createEOGeometryThunk.rejected, (state, action) => {
      state.geometries.createEOGeometryLoading = false
      state.geometries.createEOGeometryError = action.payload || 'Failed to create EO geometry'
    })

    .addCase(updateEOGeometryThunk.pending, state => {
      state.geometries.updateEOGeometryLoading = true
      state.geometries.updateEOGeometryError = null
    })
    .addCase(updateEOGeometryThunk.fulfilled, (state, action) => {
      state.geometries.updateEOGeometryLoading = false
      const updated = action.payload
      const index = state.geometries.eoGeometries.findIndex(g => g.id === updated.id)
      if (index !== -1) {
        const prev = state.geometries.eoGeometries[index]
        state.geometries.eoGeometries[index] = { ...updated, isVisible: prev.isVisible ?? true }
      }
    })
    .addCase(updateEOGeometryThunk.rejected, (state, action) => {
      state.geometries.updateEOGeometryLoading = false
      state.geometries.updateEOGeometryError = action.payload || 'Failed to update EO geometry'
    })

    .addCase(deleteEOGeometryThunk.pending, state => {
      state.geometries.deleteEOGeometryLoading = true
      state.geometries.deleteEOGeometryError = null
    })
    .addCase(deleteEOGeometryThunk.fulfilled, (state, action) => {
      state.geometries.deleteEOGeometryLoading = false
      const deletedId = action.meta.arg.geometryId
      state.geometries.eoGeometries = state.geometries.eoGeometries.filter(g => g.id !== deletedId)
    })
    .addCase(deleteEOGeometryThunk.rejected, (state, action) => {
      state.geometries.deleteEOGeometryLoading = false
      state.geometries.deleteEOGeometryError = action.payload || 'Failed to delete EO geometry'
    })

    .addCase(deleteEOGeometriesThunk.pending, state => {
      state.geometries.deleteEOGeometryLoading = true
      state.geometries.deleteEOGeometryError = null
    })
    .addCase(deleteEOGeometriesThunk.fulfilled, state => {
      state.geometries.deleteEOGeometryLoading = false
      state.geometries.eoGeometries = []
    })
    .addCase(deleteEOGeometriesThunk.rejected, (state, action) => {
      state.geometries.deleteEOGeometryLoading = false
      state.geometries.deleteEOGeometryError = action.payload || 'Failed to delete EO geometries'
    })
}
