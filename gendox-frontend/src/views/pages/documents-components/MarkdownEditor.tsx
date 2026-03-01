import { useState } from "react"
import ReactMde from "react-mde"
import * as Showdown from "showdown"
import "react-mde/lib/styles/css/react-mde-all.css"
import { Maximize2, Minimize2, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MarkdownEditorProps {
  sectionTitle: string
  setSectionTitle: (title: string) => void
  markdownValue: string
  setMarkdownValue: (value: string) => void
  isSectionMinimized: boolean
  handleMinimize: () => void
  handleRestore?: () => void
  handleDeleteConfirmOpen: () => void
}

const MarkdownEditorComponent = ({
  sectionTitle,
  setSectionTitle,
  markdownValue,
  setMarkdownValue,
  isSectionMinimized,
  handleMinimize,
  handleDeleteConfirmOpen,
}: MarkdownEditorProps) => {
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
    <TooltipProvider>
      <div>
        {/* Header with title and action buttons */}
        <div className="flex items-center p-2 border-b border-border">
          <span className="mr-3 text-sm font-medium text-primary">Title:</span>
          <Input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Section Title"
            className="flex-1"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 text-primary"
                onClick={handleMinimize}
              >
                {isSectionMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSectionMinimized ? "Maximize" : "Minimize"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary"
                onClick={handleDeleteConfirmOpen}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>

        {/* Markdown Editor */}
        {!isSectionMinimized && (
          <div className="[&_.mde-header]:bg-transparent [&_.mde-textarea]:bg-transparent [&_.mde-preview]:bg-transparent [&_.mde-toolbar]:bg-transparent [&_.mde-toolbar_button]:bg-transparent [&_.mde-toolbar_button]:border-none [&_.mde-toolbar_button]:shadow-none">
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
        )}
      </div>
    </TooltipProvider>
  )
}

export default MarkdownEditorComponent
