import { useState } from "react"
import { Copy, FileText, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { copyToClipboard } from "src/utils/copyToClipboard"

interface MessageActionsProps {
  message: any
  isMyMessage: boolean
  openMetadata: () => void
  embedMode?: boolean
  chatInsightView?: boolean
}

const MessageActions = ({
  message,
  isMyMessage,
  openMetadata,
  embedMode,
  chatInsightView,
}: MessageActionsProps) => {
  if (!message) return null

  const [copyActive, setCopyActive] = useState(false)

  const handleCopy = () => {
    copyToClipboard(message.message)
    setCopyActive(true)
    setTimeout(() => setCopyActive(false), 8000)
  }

  const timeString = message.createdAt
    ? new Date(message.createdAt).toLocaleString()
    : ""

  if (isMyMessage) {
    return (
      <div className="flex justify-end pl-[0.6875rem]">
        {timeString && (
          <span className="text-xs opacity-70">{timeString}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      {/* Sources badge */}
      {chatInsightView && (
        <div className="flex items-center">
          <Badge
            variant="outline"
            className="cursor-pointer gap-1"
            onClick={openMetadata}
          >
            <span>Sources</span>
            <div className="flex gap-0.5">
              <FileText className="h-3.5 w-3.5" />
              <Globe className="h-3.5 w-3.5" />
            </div>
          </Badge>
        </div>
      )}

      {/* Time and actions */}
      <div className="flex items-center gap-1 pl-[0.6875rem]">
        {timeString && (
          <span className="text-xs opacity-70">{timeString}</span>
        )}

        <div className="mx-1 h-4 w-px bg-border" />

        {!embedMode && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${
                    copyActive ? "text-primary" : ""
                  }`}
                  onClick={handleCopy}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

export default MessageActions
