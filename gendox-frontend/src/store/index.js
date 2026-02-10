import { configureStore } from '@reduxjs/toolkit'
import logger from 'redux-logger'

import userData from 'src/store/userData/userData'
import activeOrganization from 'src/store/activeOrganization/activeOrganization'
import activeProject from 'src/store/activeProject/activeProject'
import activeDocument from 'src/store/activeDocument/activeDocument'
import gendoxChat from 'src/store/chat/gendoxChat'
import activeProjectAgent from 'src/store/activeProjectAgent/activeProjectAgent.js'
import globalSearch from 'src/store/globalSearch/globalSearch'
import activeTask from 'src/store/activeTask/activeTask'
import activeTaskNode from 'src/store/activeTaskNode/activeTaskNode'
import activeTaskEdge from 'src/store/activeTaskEdge/activeTaskEdge'
import earthObservation from 'src/store/earthObservation/earthObservation'
import chatAttachments from 'src/store/chatAttachments/chatAttachments'

const reducer = {
  userData,
  activeProject,
  activeOrganization,
  activeDocument,
  gendoxChat,
  activeProjectAgent,
  globalSearch,
  activeTask,
  activeTaskNode,
  activeTaskEdge,
  earthObservation,
  chatAttachments
}

export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'chatAttachments/enqueueFiles',
          'chatAttachments/uploadQueuedAttachments/pending',
          'chatAttachments/uploadQueuedAttachments/fulfilled',
          'chatAttachments/uploadQueuedAttachments/rejected'
        ],
        ignoredPaths: [
          'chatAttachments.items',
          'chatAttachments.items.*.file',
          'chatAttachments.items.*.previewUrl'
        ]
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})
