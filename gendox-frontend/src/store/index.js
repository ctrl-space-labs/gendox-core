import { configureStore } from '@reduxjs/toolkit'
import logger from 'redux-logger';


import userData from 'src/store/userData/userData'
import activeOrganization from 'src/store/activeOrganization/activeOrganization'
import activeProject from 'src/store/activeProject/activeProject'
import activeDocument from 'src/store/activeDocument/activeDocument'
import gendoxChat from 'src/store/chat/gendoxChat'
import activeProjectAgent from "src/store/activeProjectAgent/activeProjectAgent.js";
import globalSearch from 'src/store/globalSearch/globalSearch'

const reducer = {
  userData,
  activeProject,
  activeOrganization,
  activeDocument,
  gendoxChat,
  activeProjectAgent,
  globalSearch
}


export const store = configureStore({
  reducer ,
  //  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  devTools: process.env.NODE_ENV !== 'production'
})
