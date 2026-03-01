import { useState, useRef, useLayoutEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GendoxMarkdownRenderer from "src/views/pages/markdown-renderer/GendoxMarkdownRenderer"

const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

interface ExpandableMarkdownSectionProps {
  label: string
  markdown: string
  maxHeight?: number
}

function ExpandableMarkdownSection({
  label,
  markdown,
  maxHeight = MAX_COLLAPSED_HEIGHT,
}: ExpandableMarkdownSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setShowButton(contentRef.current.scrollHeight > maxHeight + 2) // Allow for rounding errors
    }
  }, [markdown, maxHeight])

  return (
    <div className="mb-6">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary">
        {label}
      </span>
      <div
        ref={contentRef}
        className={cn(
          "items-center gap-4 rounded-lg p-4 min-h-[54px] relative transition-[max-height] duration-300 ease-in-out",
          "scrollbar-thin scrollbar-thumb-border scrollbar-thumb-rounded",
          expanded ? "max-h-[500px] overflow-y-auto overflow-x-auto" : "overflow-hidden overflow-x-auto"
        )}
        style={{
          maxHeight: expanded ? "500px" : `${maxHeight}px`,
        }}
      >
        <GendoxMarkdownRenderer markdownText={markdown} />
      </div>
      {showButton && (
        <div className="flex justify-end px-4 pt-1">
          <Button
            variant="link"
            className="h-auto min-w-0 p-0 font-semibold text-primary"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ExpandableMarkdownSection
