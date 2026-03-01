import { useState } from "react"
import * as Showdown from "showdown"
import ReactMde from "react-mde"
import "react-mde/lib/styles/css/react-mde-all.css"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NewDocumentProps {
  documentTitle: string
  setDocumentTitle: (title: string) => void
  markdownValue: string
  setMarkdownValue: (value: string) => void
  titleError: boolean
}

const NewDocument = ({
  documentTitle,
  setDocumentTitle,
  markdownValue,
  setMarkdownValue,
  titleError,
}: NewDocumentProps) => {
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write")

  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
    openLinksInNewWindow: true,
    backslashEscapesHTMLTags: true,
    emoji: true,
    underline: true,
    completeHTMLDocument: false,
    noHeaderId: true,
    headerLevelStart: 2,
    parseImgDimensions: true,
    literalMidWordUnderscores: true,
    simpleLineBreaks: true,
    excludeTrailingPunctuationFromURLs: true,
    ghCodeBlocks: true,
    requireSpaceBeforeHeadingText: true,
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title-input">
          Document Title <span className="text-destructive">*</span>
        </Label>
        <Input
          value={documentTitle}
          id="title-input"
          placeholder="e.g. Getting Started Guide"
          onChange={(e) => setDocumentTitle(e.target.value)}
          className={titleError ? "border-destructive" : ""}
        />
        {titleError && (
          <p className="text-xs text-destructive">
            Document title is required.
          </p>
        )}
      </div>

      {/* Markdown Editor */}
      <div className="space-y-2">
        <Label>Content</Label>
        <div className="rounded-md border [&_.mde-header]:bg-transparent [&_.mde-textarea]:bg-transparent [&_.mde-preview]:bg-transparent [&_.mde-toolbar]:bg-transparent [&_.mde-toolbar_button]:bg-transparent [&_.mde-toolbar_button]:border-none [&_.mde-toolbar_button]:shadow-none [&_.react-mde]:bg-transparent [&_.react-mde]:border-none">
          <ReactMde
            value={markdownValue}
            onChange={setMarkdownValue}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            generateMarkdownPreview={(markdown) =>
              Promise.resolve(converter.makeHtml(markdown))
            }
            childProps={{
              writeButton: {
                tabIndex: -1,
              },
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Write using Markdown syntax. Switch to Preview to see the formatted output.
        </p>
      </div>
    </div>
  )
}

export default NewDocument
