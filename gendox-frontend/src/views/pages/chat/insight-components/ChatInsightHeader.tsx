import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
      <Tabs value={selectedChatInsightsTab} onValueChange={setSelectedChatInsightsTab}>
        <TabsList className="rounded-full">
          <TabsTrigger value="Agent" className="rounded-full">
            Agent
          </TabsTrigger>
          <TabsTrigger value="Sources" className="rounded-full">
            {metadataCount} Sources
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
        aria-label="Close insights panel"
        onClick={closeInsightsToggle}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default InsightHeader
