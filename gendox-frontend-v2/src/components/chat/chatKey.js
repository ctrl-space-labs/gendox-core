import { createContext, useContext } from 'react'
import { MAIN_CHAT } from 'src/store/chat/gendoxChat'

// Which chat in the store a component belongs to: several can be on screen at once (the agent home's windows)
export const ChatKeyContext = createContext(MAIN_CHAT)

export const useChatKey = () => useContext(ChatKeyContext)
