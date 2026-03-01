import { useState } from "react"
import { Send, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { sendMessage } from "src/store/chat/gendoxChat"
import { useIFrameMessageManager } from "src/authentication/context/IFrameMessageManagerContext"

interface ChatInputSectionProps {
  auth: any
  dispatch: any
  token: string | null
  currentThread: any
  organizationId: string
  isSending: boolean
  isLoadingMessages: boolean
}

const ChatInputSection = ({
  auth,
  dispatch,
  token,
  currentThread,
  organizationId,
  isSending,
  isLoadingMessages,
}: ChatInputSectionProps) => {
  const iFrameMessageManager = useIFrameMessageManager()
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (isSending) return
    if (!message.trim()) return
    setMessage("")

    dispatch(
      (sendMessage as any)({
        user: auth.user,
        currentThread,
        message,
        organizationId,
        iFrameMessageManager,
        token,
      })
    )
  }

  return (
    <div
      className={`p-2 flex flex-col bg-card rounded-lg shadow-md gap-2 ${
        isLoadingMessages ? "blur-sm" : ""
      }`}
    >
      {/* Row 1: Input area + Send icon */}
      <div
        className={`flex items-center ${
          isLoadingMessages ? "blur-sm" : ""
        }`}
      >
        <textarea
          placeholder="Ask anything..."
          rows={1}
          className="flex-1 mr-2 resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-h-[36px] max-h-[120px] overflow-y-auto p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSend}
          className={isSending ? "blur-sm" : ""}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Row 2: Options */}
      <InputMessageOptions />
    </div>
  )
}

const InputMessageOptions = () => {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer gap-1 px-3 py-1"
              onClick={() => console.log("Search clicked")}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default ChatInputSection
