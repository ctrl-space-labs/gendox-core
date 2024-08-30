// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers

import userData from 'src/store/apps/userData/userData'
import activeOrganization from 'src/store/apps/activeOrganization/activeOrganization'
import activeProject from 'src/store/apps/activeProject/activeProject'
import activeDocument from 'src/store/apps/activeDocument/activeDocument'
import chat from 'src/store/apps/chat'
import autocompleteSearch from 'src/store/apps/autocompleteSearch/autocompleteSearch'

export const store = configureStore({
  reducer: {
    userData,
    activeProject,
    activeOrganization,
    activeDocument,
    chat, 
    autocompleteSearch
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
