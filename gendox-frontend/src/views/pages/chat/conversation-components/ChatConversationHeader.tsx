import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentAvatar } from "src/views/pages/chat/utils/chatUtils"

interface ChatConversationHeaderProps {
  hidden: boolean
  handleDrawerToggle: () => void
  currentThread: any
  themeConfig: any
  handleInsightsToggle: () => void
  isLoadingMessages: boolean
}

const ChatConversationHeader = ({
  hidden,
  handleDrawerToggle,
  currentThread,
  handleInsightsToggle,
  isLoadingMessages,
}: ChatConversationHeaderProps) => {
  return (
    <div
      className={`p-4 flex items-center justify-between border-b border-border h-[60px] ${
        isLoadingMessages ? "blur-sm" : ""
      }`}
    >
      {/* Left group */}
      <div className="flex items-center">
        {hidden && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div
          className="mr-2.5 cursor-pointer"
          onClick={handleInsightsToggle}
        >
          <AgentAvatar
            isSelected={false}
            fullName={currentThread?.agent?.fullName}
          />
        </div>

        <div className="flex flex-col overflow-hidden">
          <p className="text-sm line-clamp-1">
            {currentThread?.agent?.fullName}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {currentThread?.agent?.description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatConversationHeader
