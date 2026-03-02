import { useEffect, useMemo, useRef, Fragment } from "react"
import { Loader2, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import GendoxMarkdownRenderer from "src/views/pages/markdown-renderer/GendoxMarkdownRenderer"
import MessageActions from "src/views/pages/chat/conversation-components/ChatConversationMessageActions"
import { fetchMessageMetadata } from "src/store/chat/gendoxChat"
import ToolCallHeader from "./ToolCallHeader"

interface ThreadMessagesAreaProps {
  hidden: boolean
  auth: any
  currentThread: any
  theme?: any
  dispatch: any
  token: string | null
  openInfoToggle: () => void
  isLoadingMessages: boolean
  embedMode?: boolean
  chatInsightView?: boolean
}

interface DisplayItem {
  type: "chatMessage" | "toolCall"
  message?: any
  headerMessage?: any
  toolResponses?: any[]
}

function buildDisplayItems(rawMessages: any[] = []): DisplayItem[] {
  const displayItems: DisplayItem[] = []
  let openToolBundle: DisplayItem | null = null

  rawMessages.forEach((msg) => {
    const hasToolCalls =
      msg.role === "assistant" &&
      Array.isArray(msg.toolCalls) &&
      msg.toolCalls.length > 0

    if (hasToolCalls) {
      if (openToolBundle) {
        displayItems.push(openToolBundle)
      }

      const hasVisibleText = msg.message && msg.message.trim() !== ""
      if (hasVisibleText) {
        displayItems.push({ type: "chatMessage", message: msg })
      }

      openToolBundle = {
        type: "toolCall",
        headerMessage: msg,
        toolResponses: [],
      }
      return
    }

    if (msg.role === "tool" && openToolBundle) {
      openToolBundle.toolResponses!.push(msg)
      return
    }

    if (openToolBundle) {
      displayItems.push(openToolBundle)
      openToolBundle = null
    }

    displayItems.push({ type: "chatMessage", message: msg })
  })

  if (openToolBundle) {
    displayItems.push(openToolBundle)
  }

  return displayItems
}

const ThreadMessagesArea = ({
  hidden,
  auth,
  currentThread,
  dispatch,
  token,
  openInfoToggle,
  isLoadingMessages,
  embedMode,
  chatInsightView,
}: ThreadMessagesAreaProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "auto",
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
    setTimeout(() => {
      scrollToBottom()
    }, 500)
  }, [currentThread?.messages])

  const displayItems = useMemo(
    () => buildDisplayItems(currentThread?.messages),
    [currentThread?.messages]
  )

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {isLoadingMessages ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 p-4 flex flex-col gap-2">
          {auth?.user?.id && displayItems.length > 0 ? (
            displayItems.map((item, index) => {
              if (item.type === "toolCall") {
                return (
                  <div
                    key={index}
                    className="flex flex-row justify-start"
                  >
                    <ToolCallHeader
                      header={item.headerMessage}
                      outputs={item.toolResponses || []}
                    />
                  </div>
                )
              }

              const { message } = item
              const isMyMessage =
                message.createdBy === auth?.user?.id ||
                message.createdBy === null
              const nextIsToolCall =
                displayItems[index + 1]?.type === "toolCall"

              return (
                <Fragment key={index}>
                  <div
                    className={cn(
                      "flex items-start",
                      isMyMessage ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] p-[0.6875rem] rounded-lg shadow",
                        isMyMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground"
                      )}
                    >
                      <GendoxMarkdownRenderer
                        markdownText={message.message}
                        classNameOverrides={{
                          container: cn(
                            "text-sm",
                            isMyMessage
                              ? "text-primary-foreground"
                              : "text-card-foreground"
                          ),
                          p: cn(
                            "text-sm mb-0",
                            isMyMessage
                              ? "text-primary-foreground"
                              : "text-card-foreground"
                          ),
                        }}
                      />
                    </div>
                  </div>
                  {!nextIsToolCall && (
                    <MessageActions
                      message={message}
                      isMyMessage={isMyMessage}
                      openMetadata={() => {
                        dispatch(
                          (fetchMessageMetadata as any)({
                            thread: currentThread,
                            message,
                            token,
                          })
                        )
                        openInfoToggle()
                      }}
                      embedMode={embedMode}
                      chatInsightView={chatInsightView}
                    />
                  )}
                </Fragment>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full mt-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-1" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                No messages yet
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start the conversation!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ThreadMessagesArea
