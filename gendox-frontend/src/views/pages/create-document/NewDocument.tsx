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
    <div>
      <div className="py-2 px-4 flex items-center border-b border-border">
        <div className="flex items-center w-full">
          <Label
            className={`mr-3 whitespace-nowrap shrink-0 min-w-[80px] ${
              titleError ? "text-destructive" : "text-primary"
            }`}
          >
            Name:{" "}
            {titleError && (
              <span className="text-destructive text-xs">
                <sup className="text-[0.7rem] relative -top-1">* required</sup>
              </span>
            )}
          </Label>
          <Input
            value={documentTitle}
            id="title-input"
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="flex-grow border-none shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Markdown Editor */}
      <div className="[&_.mde-header]:bg-transparent [&_.mde-textarea]:bg-transparent [&_.mde-preview]:bg-transparent [&_.mde-toolbar]:bg-transparent [&_.mde-toolbar_button]:bg-transparent [&_.mde-toolbar_button]:border-none [&_.mde-toolbar_button]:shadow-none [&_.react-mde]:bg-transparent">
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
    </div>
  )
}

export default NewDocument
