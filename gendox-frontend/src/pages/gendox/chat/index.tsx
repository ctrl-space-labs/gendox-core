import GendoxChat from "src/views/pages/chat/GendoxChat"
import GendoxChatLayout from "src/layouts/GendoxChatLayout"

const ChatPage = () => {
  return (
    <div className="h-[calc(100vh-64px-3.5rem)] overflow-auto flex w-full">
      <GendoxChat chatUrlPath="/gendox/chat" />
    </div>
  )
}

ChatPage.getLayout = (page: React.ReactElement) => (
  <GendoxChatLayout>{page}</GendoxChatLayout>
)
ChatPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default ChatPage
