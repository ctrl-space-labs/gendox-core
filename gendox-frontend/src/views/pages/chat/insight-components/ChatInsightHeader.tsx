import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface InsightHeaderProps {
  closeInsightsToggle: () => void
  selectedChatInsightsTab: string
  setSelectedChatInsightsTab: (tab: string) => void
  currentMessageMetadata: any
}

const InsightHeader = ({
  closeInsightsToggle,
  selectedChatInsightsTab,
  setSelectedChatInsightsTab,
  currentMessageMetadata,
}: InsightHeaderProps) => {
  const metadataCount =
    currentMessageMetadata?.metadata?.length || ""

  return (
    <div className="h-[60px] shrink-0 border-b border-border flex items-center justify-center relative">
      <div className="inline-flex items-center justify-center p-0.5 rounded-full bg-card">
        {/* "Agent" tab */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "rounded-full mr-1 px-3 py-1 h-auto",
            selectedChatInsightsTab === "Agent"
              ? "border-primary text-primary"
              : "border-muted-foreground text-muted-foreground"
          )}
          onClick={() => setSelectedChatInsightsTab("Agent")}
        >
          Agent
        </Button>

        {/* "Sources" tab */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "rounded-full px-3 py-1 h-auto",
            selectedChatInsightsTab === "Sources"
              ? "border-primary text-primary"
              : "border-muted-foreground text-muted-foreground"
          )}
          onClick={() => setSelectedChatInsightsTab("Sources")}
        >
          {metadataCount} Sources
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
        onClick={closeInsightsToggle}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default InsightHeader
