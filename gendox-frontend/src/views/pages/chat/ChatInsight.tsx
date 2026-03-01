import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import ChatInsightMessageBox from "./insight-components/ChatInsightMessageBox"
import ChatInsightHeader from "./insight-components/ChatInsightHeader"
import ChatInsightSourcesContent from "./insight-components/ChatInsightSourcesContent"
import ChatInsightAgentContent from "./insight-components/ChatInsightsAgentContent"

const rightDrawerWidth = 400

interface ChatInsightProps {
  mobileInfoOpen: boolean
  closeInsightsToggle: () => void
  projectId: string
  selectedChatInsightsTab: string
  setSelectedChatInsightsTab: (tab: string) => void
}

const ChatInsight = ({
  mobileInfoOpen,
  closeInsightsToggle,
  projectId,
  selectedChatInsightsTab,
  setSelectedChatInsightsTab,
}: ChatInsightProps) => {
  const { currentThread, currentMessageMetadata, isLoadingMetadata } =
    useSelector((state: any) => state.gendoxChat)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const infoContent = (
    <div className="flex flex-col h-full">
      <ChatInsightHeader
        closeInsightsToggle={closeInsightsToggle}
        selectedChatInsightsTab={selectedChatInsightsTab}
        setSelectedChatInsightsTab={setSelectedChatInsightsTab}
        currentMessageMetadata={currentMessageMetadata}
      />
      <ChatInsightMessageBox />
      <div className="flex items-center gap-2 px-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {selectedChatInsightsTab}
        </span>
        <Separator className="flex-1" />
      </div>

      <ScrollArea className="flex-1 px-2">
        {selectedChatInsightsTab === "Agent" ? (
          <ChatInsightAgentContent
            projectId={projectId}
            currentThread={currentThread}
          />
        ) : (
          <ChatInsightSourcesContent
            isLoadingMetadata={isLoadingMetadata}
            currentMessageMetadata={currentMessageMetadata}
          />
        )}
      </ScrollArea>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet
        open={mobileInfoOpen}
        onOpenChange={(isOpen) => !isOpen && closeInsightsToggle()}
      >
        <SheetContent
          side="bottom"
          className="min-h-[75vh] max-h-[75vh] overflow-auto p-0"
        >
          {/* Drag Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>
          {infoContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="shrink-0 bg-accent/50 border-l border-border rounded-r-md flex flex-col h-full"
      style={{ width: rightDrawerWidth }}
    >
      {infoContent}
    </div>
  )
}

export default ChatInsight
