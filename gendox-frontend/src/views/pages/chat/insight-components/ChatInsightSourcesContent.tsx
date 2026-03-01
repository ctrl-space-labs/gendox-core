import { Loader2, FileText, ExternalLink, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SectionMetadata {
  organizationId: string
  documentId: string
  sectionId: string
  documentTitle: string
  sectionTitle: string
  sectionValue: string
  externalUrl?: string
  isCompletionParticipant: boolean
}

interface ChatInsightSourcesContentProps {
  isLoadingMetadata: boolean
  currentMessageMetadata: {
    metadata?: SectionMetadata[]
  } | null
}

const ChatInsightSourcesContent = ({
  isLoadingMetadata,
  currentMessageMetadata,
}: ChatInsightSourcesContentProps) => {
  const handleSourceClick = (sectionData: SectionMetadata) => {
    let link = `/gendox/document-instance/?organizationId=${sectionData.organizationId}&documentId=${sectionData.documentId}&sectionId=${sectionData.sectionId}`

    if (sectionData?.externalUrl) {
      link = sectionData.externalUrl
    }
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer")
    }
  }

  if (isLoadingMetadata) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const completionParticipants =
    currentMessageMetadata?.metadata?.filter(
      (item) => item.isCompletionParticipant
    ) || []
  const nonCompletionParticipants =
    currentMessageMetadata?.metadata?.filter(
      (item) => !item.isCompletionParticipant
    ) || []

  if (
    completionParticipants.length === 0 &&
    nonCompletionParticipants.length === 0
  ) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-sm text-muted-foreground text-center mt-2">
          Select a message to view sources
        </p>
      </div>
    )
  }

  const renderListItem = (
    sectionMetadata: SectionMetadata,
    key: string
  ) => (
    <TooltipProvider key={key}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left"
            onClick={() => handleSourceClick(sectionMetadata)}
          >
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0 ml-2 mr-2">
              <p className="text-sm font-medium text-primary truncate">
                {sectionMetadata.documentTitle}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {sectionMetadata.sectionValue}...
              </p>
            </div>
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <ExternalLink className="h-3 w-3 text-primary" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{sectionMetadata.sectionTitle}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <Card className="bg-transparent shadow-none border-none p-2">
      {completionParticipants.length > 0 && (
        <div className="mb-3 flex flex-col items-center">
          <div className="w-full space-y-1">
            {completionParticipants.map((sectionMetadata, index) =>
              renderListItem(sectionMetadata, `completion-${index}`)
            )}
          </div>
        </div>
      )}

      {nonCompletionParticipants.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Additional Sources
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Additional sources providing further context, though
                    not directly referenced in generating the answer.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Separator className="flex-1" />
          </div>
          <div className="mt-2 space-y-1">
            {nonCompletionParticipants.map((sectionMetadata, index) =>
              renderListItem(
                sectionMetadata,
                `nonCompletion-${index}`
              )
            )}
          </div>
        </>
      )}
    </Card>
  )
}

export default ChatInsightSourcesContent
