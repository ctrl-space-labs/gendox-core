import React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import GendoxMarkdownRenderer from "src/views/pages/markdown-renderer/GendoxMarkdownRenderer"

const MAX_SECTIONS = 5

interface Section {
  id?: string
  sectionValue?: string
}

interface DocumentTextComponentProps {
  sections: Section[]
  isBlurring: boolean
  documentId: string
  projectId: string
  organizationId: string
}

const DocumentTextComponent = ({
  sections,
  isBlurring,
  documentId,
  projectId,
  organizationId,
}: DocumentTextComponentProps) => {
  // ---- EMPTY STATES ----
  if (!sections || sections.length === 0) {
    return <p className="p-6">No sections available</p>
  }

  // ---- LOADING ----
  if (isBlurring) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading document content...</p>
      </div>
    )
  }

  const visibleSections = sections.slice(0, MAX_SECTIONS)
  const hasMore = sections.length > MAX_SECTIONS

  const handleOpenFullDocument = () => {
    const url = `/gendox/document-instance?organizationId=${organizationId}&documentId=${documentId}&projectId=${projectId}`

    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="bg-transparent shadow-none">
      {visibleSections.map((section, index) => (
        <div key={section.id || index} className="px-6 py-4">
          <GendoxMarkdownRenderer
            markdownText={section.sectionValue || ""}
          />
        </div>
      ))}

      {/* Message + Button for the rest */}
      {hasMore && (
        <div className="mt-8 text-left">
          <Separator className="my-4" />
          <p className="mb-4 font-medium">
            Only a preview is shown. To view the full document, open the
            Document Page.
          </p>

          <Button onClick={handleOpenFullDocument}>Go to Document</Button>
        </div>
      )}
    </div>
  )
}

export default DocumentTextComponent
