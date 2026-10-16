import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import documentService from 'src/gendox-sdk/documentService'

export const uploadQueuedAttachments = createAsyncThunk(
  'chatAttachments/uploadQueuedAttachments',
  async ({ items, threadId, organizationId, projectId, token }, { rejectWithValue }) => {
    try {
      const results = await Promise.all(
        items.map(async item => {
          const res = await documentService.uploadSingleDocument(organizationId, projectId, item.file, token, true)
          const doc = res.data

          let previewUrl = null
          const name = (doc.title || '').toLowerCase()
          const ft = (doc.fileType?.name || '').toLowerCase()
          const isImage =
            ft.includes('image') ||
            name.endsWith('.png') ||
            name.endsWith('.jpg') ||
            name.endsWith('.jpeg') ||
            name.endsWith('.gif') ||
            name.endsWith('.webp')

          if (isImage && threadId) {
            try {
              const blobRes = await documentService.viewDocumentContent(threadId, doc.id, token)
              previewUrl = URL.createObjectURL(blobRes.data)
            } catch (e) {
              console.error('preview fetch failed', e)
            }
          }

          return {
            id: item.id,
            uploadedDoc: {
              documentId: doc.id,
              title: doc.title,
              remoteUrl: doc.remoteUrl,
              externalUrl: doc.externalUrl,
              fileSizeBytes: doc.fileSizeBytes,
              fileType: doc.fileType,
              previewUrl,
              previewStatus: previewUrl ? 'ready' : 'idle'
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

// The files waiting to be sent with the next message, per chat on screen (see MAIN_CHAT in gendoxChat)
const MAIN_CHAT = 'main'
const EMPTY = Object.freeze({ items: [], isUploading: false, isDeleting: false })

export const selectChatAttachments = (state, chatKey = MAIN_CHAT) => state.chatAttachments.byKey[chatKey] ?? EMPTY

const keyOf = action => action.meta?.arg?.chatKey ?? action.payload?.chatKey ?? MAIN_CHAT

const listOf = (state, chatKey) => {
  if (!state.byKey[chatKey]) state.byKey[chatKey] = { items: [], isUploading: false, isDeleting: false }

  return state.byKey[chatKey]
}

const chatAttachmentsSlice = createSlice({
  name: 'chatAttachments',
  initialState: {
    byKey: {}
  },
  reducers: {
    // payload: { chatKey, items: Array<AttachmentItem> }
    enqueueFiles: (state, action) => {
      listOf(state, keyOf(action)).items.push(...action.payload.items)
    },
    // payload: { chatKey, id }
    removeLocalOnly: (state, action) => {
      const list = listOf(state, keyOf(action))
      const item = list.items.find(x => x.id === action.payload.id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      list.items = list.items.filter(x => x.id !== action.payload.id)
    },
    // payload: chatKey
    clearAll: (state, action) => {
      const chatKey = action.payload ?? MAIN_CHAT
      const list = state.byKey[chatKey]
      if (!list) return
      list.items.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
      delete state.byKey[chatKey]
    }
  },
  extraReducers: builder => {
    builder
      .addCase(uploadQueuedAttachments.pending, (state, action) => {
        const list = listOf(state, keyOf(action))
        list.isUploading = true
        list.items.forEach(i => {
          if (i.status === 'queued') i.status = 'uploading'
        })
      })
      .addCase(uploadQueuedAttachments.fulfilled, (state, action) => {
        const list = listOf(state, keyOf(action))
        action.payload.forEach(r => {
          const item = list.items.find(x => x.id === r.id)
          if (item) {
            item.status = 'uploaded'
            item.uploadedDoc = r.uploadedDoc
          }
        })
        list.isUploading = list.items.some(i => i.status === 'uploading')
      })
      .addCase(uploadQueuedAttachments.rejected, (state, action) => {
        const list = listOf(state, keyOf(action))
        list.isUploading = false
        list.items.forEach(i => {
          if (i.status === 'uploading' || i.status === 'queued') {
            i.status = 'failed'
            i.error = action.payload || 'Upload failed'
          }
        })
      })
      .addCase(deleteUploadedAttachment.pending, (state, action) => {
        const list = listOf(state, keyOf(action))
        list.isDeleting = true
        const item = list.items.find(x => x.id === action.meta.arg.attachmentId)
        if (item) item.status = 'deleting'
      })
      .addCase(deleteUploadedAttachment.fulfilled, (state, action) => {
        const list = listOf(state, keyOf(action))
        const { attachmentId } = action.payload
        const item = list.items.find(x => x.id === attachmentId)
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
        list.items = list.items.filter(x => x.id !== attachmentId)
        list.isDeleting = list.items.some(i => i.status === 'deleting')
      })
      .addCase(deleteUploadedAttachment.rejected, (state, action) => {
        const list = listOf(state, keyOf(action))
        const { attachmentId, error } = action.payload || {}
        const item = list.items.find(x => x.id === attachmentId)
        if (item) {
          item.status = 'uploaded'
          item.error = error || 'Delete failed'
        }
        list.isDeleting = list.items.some(i => i.status === 'deleting')
      })
  }
})

export const { enqueueFiles, removeLocalOnly, clearAll } = chatAttachmentsSlice.actions
export default chatAttachmentsSlice.reducer
