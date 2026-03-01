import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/router"
import { useAuth } from "src/authentication/useAuth"
import {
  fetchThreads,
  loadThread,
  chatActions,
} from "src/store/chat/gendoxChat"
import { localStorageConstants } from "src/utils/generalConstants"
import { isValidOrganization } from "src/utils/validators"
import ChatNavigation from "src/views/pages/chat/ChatNavigation"
import ChatConversation from "src/views/pages/chat/ChatConversation"
import ChatInsight from "src/views/pages/chat/ChatInsight"

interface GendoxChatProps {
  chatUrlPath?: string
  embedView?: boolean
  chatInsightView?: boolean
  authProviderOption?: string
}

const GendoxChat = (props: GendoxChatProps) => {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId, threadId, projectId } = router.query as Record<
    string,
    string
  >
  const chatUrlPath = props.chatUrlPath || "/gendox/chat"
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  )
  const embedMode = props.embedView || false
  const chatInsightView = props.chatInsightView ?? true

  const { currentThread, agents, threads } = useSelector(
    (state: any) => state.gendoxChat
  )

  // On mount, fetch contacts (agents + threads)
  useEffect(() => {
    const fetchData = async () => {
      dispatch(chatActions.resetChatState())
      ;(dispatch as any)(
        (fetchThreads as any)({ organizationId, token })
      )
    }

    if (
      isValidOrganization(organizationId, user) ||
      props.authProviderOption === "IFrameAuthProvider"
    ) {
      fetchData()
    }
  }, [dispatch, organizationId])

  // Load thread if threadId or projectId is present
  useEffect(() => {
    closeInsightsToggle()
    ;(dispatch as any)(
      (loadThread as any)({
        projectId,
        threadId: threadId || null,
        organizationId,
        token,
      })
    )
  }, [dispatch, projectId, threadId, organizationId, token])

  // Update currentThread with agent and thread objects
  useEffect(() => {
    if (!currentThread) return

    if (
      agents &&
      currentThread?.projectId !== currentThread?.agent?.projectId
    ) {
      dispatch(chatActions.updateCurrentThreadWithAgent())
    }
    if (
      threads &&
      currentThread?.threadId !== currentThread?.thread?.id
    ) {
      dispatch(chatActions.updateCurrentThreadWithThreadObj())
    }
  }, [currentThread, agents, threads, dispatch, organizationId])

  const [mobileOpen, setMobileOpen] = useState(false)
  const [infoSidebarIsOpen, setInfoSidebarIsOpen] = useState(false)
  const [selectedChatInsightsTab, setSelectedChatInsightsTab] =
    useState("Sources")

  const handleNavigationToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const handleInsightsToggle = () => {
    setSelectedChatInsightsTab("Agent")
    setInfoSidebarIsOpen((prev) => !prev)
  }

  const openInsightsToggle = () => {
    setSelectedChatInsightsTab("Sources")
    setInfoSidebarIsOpen(true)
  }

  const closeInsightsToggle = () => {
    setInfoSidebarIsOpen(false)
    dispatch(chatActions.clearCurrentMessageMetadata())
  }

  return (
    <div className="flex w-full h-full">
      {/* Left sidebar for navigation */}
      <ChatNavigation
        mobileOpen={mobileOpen}
        onClose={handleNavigationToggle}
        chatUrlPath={chatUrlPath}
        embedMode={embedMode}
      />

      {/* Main chat conversation area */}
      <ChatConversation
        handleDrawerToggle={handleNavigationToggle}
        openInsightsToggle={openInsightsToggle}
        handleInsightsToggle={handleInsightsToggle}
        embedMode={embedMode}
        chatInsightView={chatInsightView}
      />

      {/* Right sidebar for additional chat insights */}
      {infoSidebarIsOpen && chatInsightView && (
        <ChatInsight
          mobileInfoOpen={infoSidebarIsOpen}
          closeInsightsToggle={closeInsightsToggle}
          projectId={projectId}
          selectedChatInsightsTab={selectedChatInsightsTab}
          setSelectedChatInsightsTab={setSelectedChatInsightsTab}
        />
      )}
    </div>
  )
}

export default GendoxChat
