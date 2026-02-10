import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import documentService from 'src/gendox-sdk/documentService'

export const uploadQueuedAttachments = createAsyncThunk(
  'chatAttachments/uploadQueuedAttachments',
  async ({ items, organizationId, projectId, token }, { rejectWithValue }) => {
    try {
      const results = await Promise.all(
        items.map(async item => {
          const res = await documentService.uploadSingleDocument(organizationId, projectId, item.file, token, true)
          const doc = res.data

          return {
            id: item.id,
            uploadedDoc: {
              documentId: doc.id,
              title: doc.title,
              remoteUrl: doc.remoteUrl,
              externalUrl: doc.externalUrl,
              fileSizeBytes: doc.fileSizeBytes,
              fileType: doc.fileType
            }
          }
        })
      )

      return results
    } catch (e) {
      return rejectWithValue(e?.message || 'Upload failed')
    }
  }
)

export const deleteUploadedAttachment = createAsyncThunk(
  'chatAttachments/deleteUploadedAttachment',
  async ({ attachmentId, documentId, organizationId, projectId, token }, { rejectWithValue }) => {
    try {
      await documentService.deleteDocument(organizationId, projectId, documentId, token)
      return { attachmentId }
    } catch (e) {
      return rejectWithValue({ attachmentId, error: e?.message || 'Delete failed' })
    }
  }
)

const chatAttachmentsSlice = createSlice({
  name: 'chatAttachments',
  initialState: {
    items: [],
    isUploading: false,
    isDeleting: false
  },
  reducers: {
    enqueueFiles: (state, action) => {
      const newItems = action.payload // Array<AttachmentItem>
      state.items.push(...newItems)
    },
    removeLocalOnly: (state, action) => {
      const id = action.payload
      const item = state.items.find(x => x.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      state.items = state.items.filter(x => x.id !== id)
    },
    clearAll: state => {
      state.items.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
      state.items = []
      state.isUploading = false
      state.isDeleting = false
    }
  },
  extraReducers: builder => {
    builder
      .addCase(uploadQueuedAttachments.pending, state => {
        state.isUploading = true
        state.items.forEach(i => {
          if (i.status === 'queued') i.status = 'uploading'
        })
      })
      .addCase(uploadQueuedAttachments.fulfilled, (state, action) => {
        const results = action.payload // [{id, uploadedDoc}]
        results.forEach(r => {
          const item = state.items.find(x => x.id === r.id)
          if (item) {
            item.status = 'uploaded'
            item.uploadedDoc = r.uploadedDoc
          }
        })
        state.isUploading = state.items.some(i => i.status === 'uploading')
      })
      .addCase(uploadQueuedAttachments.rejected, (state, action) => {
        state.isUploading = false
        state.items.forEach(i => {
          if (i.status === 'uploading' || i.status === 'queued') {
            i.status = 'failed'
            i.error = action.payload || 'Upload failed'
          }
        })
      })
      .addCase(deleteUploadedAttachment.pending, (state, action) => {
        state.isDeleting = true
        const { attachmentId } = action.meta.arg
        const item = state.items.find(x => x.id === attachmentId)
        if (item) item.status = 'deleting'
      })
      .addCase(deleteUploadedAttachment.fulfilled, (state, action) => {
        const { attachmentId } = action.payload
        const item = state.items.find(x => x.id === attachmentId)
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
        state.items = state.items.filter(x => x.id !== attachmentId)
        state.isDeleting = state.items.some(i => i.status === 'deleting')
      })
      .addCase(deleteUploadedAttachment.rejected, (state, action) => {
        const { attachmentId, error } = action.payload || {}
        const item = state.items.find(x => x.id === attachmentId)
        if (item) {
          item.status = 'uploaded'
          item.error = error || 'Delete failed'
        }
        state.isDeleting = state.items.some(i => i.status === 'deleting')
      })
  }
})

export const { enqueueFiles, removeLocalOnly, clearAll } = chatAttachmentsSlice.actions
export default chatAttachmentsSlice.reducer
