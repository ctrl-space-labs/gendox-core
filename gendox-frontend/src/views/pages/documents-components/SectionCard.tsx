import React, { forwardRef } from "react"
import { useSelector } from "react-redux"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import GendoxMarkdownRenderer from "../markdown-renderer/GendoxMarkdownRenderer"

interface SectionCardProps {
  targetIndex: number | null
  highlightedSectionId: string | null
}

const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ targetIndex, highlightedSectionId }, ref) => {
    const { sections, isBlurring } = useSelector(
      (state: any) => state.activeDocument
    )

    if (!sections || sections.length === 0) {
      return <p className="p-4 text-muted-foreground">No sections available</p>
    }

    if (isBlurring) {
      return (
        <div className="flex items-center justify-center min-h-[400px] flex-col gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-base text-muted-foreground">
            Loading document content...
          </p>
        </div>
      )
    }

    return (
      <div className="bg-transparent">
        {sections.map((section: any, index: number) => (
          <React.Fragment key={section.id || index}>
            <div
              ref={index === targetIndex ? ref : null}
              className={`overflow-auto p-4 ${
                section.id === highlightedSectionId
                  ? "bg-accent"
                  : "bg-transparent"
              }`}
            >
              <h3 className="text-lg font-semibold mb-2 text-left text-primary">
                {section.documentSectionMetadata.title === "Default Title"
                  ? ""
                  : section.documentSectionMetadata.title}
              </h3>

              <GendoxMarkdownRenderer markdownText={section.sectionValue} />
            </div>
            {index !== sections.length - 1 && (
              <Separator className="my-3 mx-4 w-[calc(100%-32px)] border-2 border-primary/30" />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }
)

SectionCard.displayName = "SectionCard"

export default SectionCard
