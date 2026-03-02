import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Rocket, ChevronDown, ScanLine, ClipboardCheck } from 'lucide-react'
// @ts-ignore - JS module re-export
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'

interface DocumentItem {
  id: string
  name?: string
  url?: string
  prompt?: string
}

interface HeaderSectionProps {
  title?: string
  description?: string
  openAddDocument: () => void
  handleGenerate: (params: any) => void
  isLoading: boolean
  selectedDocuments: string[]
  isDigitizationGenerating?: boolean
  documents?: DocumentItem[]
}

const HeaderSection = ({
  title,
  description,
  openAddDocument,
  handleGenerate,
  isLoading,
  selectedDocuments,
  isDigitizationGenerating = false,
  documents = []
}: HeaderSectionProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmGeneration, setConfirmGeneration] = useState<string | null>(null)
  const [generatingType, setGeneratingType] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const disableGenerate = isLoading || documents.length === 0 || isDigitizationGenerating

  useEffect(() => {
    if (!isDigitizationGenerating) {
      setGeneratingType(null)
    }
  }, [isDigitizationGenerating])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Execute the actual generation
  const executeGeneration = (type: string) => {
    setConfirmGeneration(null)
    setMenuOpen(false)
    setGeneratingType(type)

    switch (type) {
      case 'all':
        handleGenerate({ documentsToGenerate: [], reGenerateExistingAnswers: true })
        break
      case 'new':
        handleGenerate({ documentsToGenerate: [], reGenerateExistingAnswers: false })
        break
      case 'selected':
        const selectedDocs = documents.filter((doc) => selectedDocuments.includes(doc.id))
        handleGenerate({ documentsToGenerate: selectedDocs, reGenerateExistingAnswers: true })
        break
    }
  }

  // Handle confirmation dialog actions
  const handleConfirmGeneration = () => {
    if (confirmGeneration) {
      executeGeneration(confirmGeneration)
    }
  }

  const handleCancelGeneration = () => {
    setConfirmGeneration(null)
  }

  // Calculate button state and text
  const getMainButtonConfig = () => {
    // when is generating, show loading state
    if (isDigitizationGenerating && generatingType) {
      let loadingText = 'Generating...'
      if (generatingType === 'all') loadingText = 'Generating All...'
      if (generatingType === 'new') loadingText = 'Generating New...'
      if (generatingType === 'selected') loadingText = `Generating (${selectedDocuments.length})...`

      return {
        text: loadingText,
        type: generatingType,
        loading: true,
        disabled: true
      }
    }

    // normal states
    if (selectedDocuments.length > 0) {
      return {
        text: `Generate Selected (${selectedDocuments.length})`,
        type: 'selected',
        loading: isDigitizationGenerating,
        disabled: disableGenerate
      }
    }

    // Always default to "Generate New" as main button
    return {
      text: `Generate New`,
      type: 'new',
      loading: isDigitizationGenerating,
      disabled: disableGenerate
    }
  }

  const buttonConfig = getMainButtonConfig()

  const docsWithPrompts = documents.filter(
    (doc) => doc.prompt && doc.prompt.trim() && isFileTypeSupported(doc.url || doc.name || '')
  )
  const disableGenerateAll = disableGenerate || docsWithPrompts.length === 0

  return (
    <div className="mb-4 px-2">
      {/* Title + Description stacked vertically */}
      <div className="mb-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <h4 className="text-2xl font-bold text-foreground">
            {title || 'Document Insights'}
          </h4>
        </div>

        <p
          className="text-base text-muted-foreground font-normal select-none max-w-full whitespace-normal"
          title={description || 'Analyze and manage your document insights'}
        >
          {description || 'Analyze and manage your document insights'}
        </p>
      </div>

      <div className="border-t border-border mb-3" />

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={openAddDocument}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading ? 'Loading data, please wait...' : 'Add a new document to your task'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <div className="flex w-full relative" ref={menuRef}>
                    <Button
                      className="flex-1 font-bold uppercase rounded-r-none"
                      onClick={() => setConfirmGeneration(buttonConfig.type)}
                      disabled={buttonConfig.disabled || disableGenerate}
                    >
                      {buttonConfig.loading ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Rocket className="h-4 w-4 mr-2" />
                      )}
                      {buttonConfig.text}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setMenuOpen((prev) => !prev)}
                      disabled={disableGenerate}
                      className="rounded-l-none -ml-px h-10 w-10"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-md border bg-popover shadow-md">
                        {/* When main button is "Generate Selected" - show Generate New and Generate All */}
                        {selectedDocuments.length > 0 && (
                          <>
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                              onClick={() => {
                                setConfirmGeneration('new')
                                setMenuOpen(false)
                              }}
                              disabled={disableGenerate}
                            >
                              {isDigitizationGenerating ? (
                                <Spinner size="sm" />
                              ) : (
                                <Rocket className="h-4 w-4 text-primary" />
                              )}
                              Generate New
                            </button>

                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                              onClick={() => {
                                setConfirmGeneration('all')
                                setMenuOpen(false)
                              }}
                              disabled={disableGenerateAll}
                            >
                              {isDigitizationGenerating ? (
                                <Spinner size="sm" />
                              ) : (
                                <Rocket className="h-4 w-4 text-primary" />
                              )}
                              Generate All
                            </button>
                          </>
                        )}

                        {/* When main button is "Generate New" - show only Generate All */}
                        {selectedDocuments.length === 0 && (
                          <button
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                            onClick={() => {
                              setConfirmGeneration('all')
                              setMenuOpen(false)
                            }}
                            disabled={disableGenerateAll}
                          >
                            {isDigitizationGenerating ? (
                              <Spinner size="sm" />
                            ) : (
                              <Rocket className="h-4 w-4 text-primary" />
                            )}
                            Generate All
                          </button>
                        )}

                        {disableGenerate && (
                          <div className="px-3 pb-2 pt-1 text-xs text-muted-foreground">
                            {isLoading ? 'Loading, please wait...' : 'Add documents to enable generation.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading ? 'Loading...' : buttonConfig.text}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Generation Confirmation Dialog */}
      <GenerateConfirmDialog
        open={Boolean(confirmGeneration)}
        onClose={handleCancelGeneration}
        onConfirm={handleConfirmGeneration}
        type={confirmGeneration || 'new'}
        selectedCount={selectedDocuments.length}
      />
    </div>
  )
}

export default HeaderSection
