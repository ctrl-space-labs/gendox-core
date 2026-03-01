import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TruncatedTextProps {
  text: string
  limit?: number
  tooltipTextSize?: number
  className?: string
  cursor?: string
}

const TruncatedText = ({
  text,
  limit = 30,
  tooltipTextSize = 3,
  className = "",
  cursor = "cursor-pointer",
}: TruncatedTextProps) => {
  if (!text) return null

  const shouldTruncate = text.length > limit
  const displayText = shouldTruncate ? text.slice(0, limit) + "..." : text
  const tooltipLimitedText =
    text.length > limit * tooltipTextSize
      ? text.slice(0, limit * tooltipTextSize) + "..."
      : text

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${cursor} ${className}`}>{displayText}</span>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipLimitedText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default TruncatedText
