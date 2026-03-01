import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/router"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"
import { localStorageConstants } from "src/utils/generalConstants"
import themeConfig from "src/configs/themeConfig"
import { useAuth } from "src/authentication/useAuth"
import ChatConversationHeader from "src/views/pages/chat/conversation-components/ChatConversationHeader"
import AiResponseLoader from "src/views/pages/chat/conversation-components/AiResponseLoader"
import ChatConversationInputSection from "src/views/pages/chat/conversation-components/ChatConversationInputSection"
import ChatConversationThreadMessagesArea from "src/views/pages/chat/conversation-components/ChatConversationThreadMessagesArea"

interface ChatConversationProps {
  theme?: any
  hidden?: boolean
  handleDrawerToggle: () => void
  openInsightsToggle: () => void
  handleInsightsToggle: () => void
  embedMode?: boolean
  chatInsightView?: boolean
}

const ChatConversation = (props: ChatConversationProps) => {
  const dispatch = useDispatch()
  const auth = useAuth()
  const router = useRouter()
  const { organizationId } = router.query
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  )
  const { currentThread, isSendingMessage, isLoadingMessages } =
    useSelector((state: any) => state.gendoxChat)

  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const check = () => setHidden(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <ResponsiveCardContent className="bg-accent/50 p-0 w-full">
      <main className="flex flex-col h-full w-full">
        <ChatConversationHeader
          hidden={hidden}
          handleDrawerToggle={props.handleDrawerToggle}
          currentThread={currentThread}
          themeConfig={themeConfig}
          handleInsightsToggle={props.handleInsightsToggle}
          isLoadingMessages={isLoadingMessages}
        />

        <div className="flex-1 overflow-auto">
          <ChatConversationThreadMessagesArea
            hidden={hidden}
            auth={auth}
            currentThread={currentThread}
            dispatch={dispatch}
            token={token}
            openInfoToggle={props.openInsightsToggle}
            isLoadingMessages={isLoadingMessages}
            embedMode={props.embedMode}
            chatInsightView={props.chatInsightView}
          />
        </div>

        <AiResponseLoader isSending={isSendingMessage} />

        <div className="p-2">
          <ChatConversationInputSection
            auth={auth}
            token={token}
            dispatch={dispatch}
            currentThread={currentThread}
            organizationId={organizationId as string}
            isSending={isSendingMessage}
            isLoadingMessages={isLoadingMessages}
          />
        </div>
      </main>
    </ResponsiveCardContent>
  )
}

export default ChatConversation
