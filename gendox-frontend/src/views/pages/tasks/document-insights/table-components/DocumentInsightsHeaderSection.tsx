import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { Rocket, ChevronDown, FileText, ScanLine, Download, ClipboardCheck } from 'lucide-react'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'

interface HeaderSectionProps {
  title?: string
  description?: string
  openAddDocument: () => void
  onAddQuestion: () => void
  handleGenerate: (params: any) => void
  isPageLoading: boolean
  onExportCsv: () => void
  isExportingCsv: boolean
  selectedDocuments: string[]
  isGenerating?: boolean
  documents?: any[]
  questions?: any[]
  hasGeneratedContent?: (docId: string, questionId?: string) => boolean
}

const HeaderSection = ({
  title,
  description,
  openAddDocument,
  onAddQuestion,
  handleGenerate,
  isPageLoading,
  onExportCsv,
  isExportingCsv,
  selectedDocuments,
  isGenerating = false,
  documents = [],
  questions = [],
  hasGeneratedContent = () => false
}: HeaderSectionProps) => {
  const [confirmGeneration, setConfirmGeneration] = useState<string | null>(null)
  const [generatingType, setGeneratingType] = useState<string | null>(null)

  const disableGenerate = isPageLoading || documents.length === 0 || questions.length === 0 || isGenerating

  useEffect(() => {
    if (!isGenerating) {
      setGeneratingType(null)
    }
  }, [isGenerating])

  const executeGeneration = (type: string) => {
    setConfirmGeneration(null)
    setGeneratingType(type)

    switch (type) {
      case 'all':
        handleGenerate({
          documentsToGenerate: [],
          questionsToGenerate: [],
          reGenerateExistingAnswers: true
        })
        break
      case 'new':
        handleGenerate({
          documentsToGenerate: [],
          questionsToGenerate: [],
          reGenerateExistingAnswers: false
        })
        break
      case 'selected':
        const selectedDocsObjects = documents.filter((doc: any) => selectedDocuments.includes(doc.id))
        handleGenerate({
          documentsToGenerate: selectedDocsObjects,
          questionsToGenerate: questions,
          reGenerateExistingAnswers: true
        })
        break
    }
  }

  const handleConfirmGeneration = () => {
    if (confirmGeneration) {
      executeGeneration(confirmGeneration)
    }
  }

  const handleCancelGeneration = () => {
    setConfirmGeneration(null)
  }

  const getMainButtonConfig = () => {
    if (isGenerating && generatingType) {
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

    if (selectedDocuments.length > 0) {
      return {
        text: `Generate Selected (${selectedDocuments.length})`,
        type: 'selected',
        loading: isGenerating,
        disabled: disableGenerate
      }
    }

    const totalCombinations = documents.length * questions.length
    const generatedCombinations = documents.reduce((count: number, doc: any) => {
      return count + questions.filter((question: any) => hasGeneratedContent(doc.id, question.id)).length
    }, 0)
    const newFields = totalCombinations - generatedCombinations

    return {
      text: 'Generate New',
      type: 'new',
      loading: isGenerating,
      disabled: disableGenerate || newFields === 0
    }
  }

  const buttonConfig = getMainButtonConfig()

  const isNewDisabled = () => {
    const newDocs = documents.filter((doc: any) => !hasGeneratedContent(doc.id))
    const totalCombinations = documents.length * questions.length
    const generatedCombinations = documents.reduce((count: number, doc: any) => {
      return count + questions.filter((question: any) => hasGeneratedContent(doc.id, question.id)).length
    }, 0)
    const newFields = totalCombinations - generatedCombinations
    return disableGenerate || newDocs.length === 0 || questions.length === 0 || newFields === 0
  }

  return (
    <div className="mb-4 px-2">
      {/* Title + Description */}
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
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mb-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={openAddDocument}
                    disabled={isPageLoading}
                    className="w-full sm:w-auto"
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isPageLoading ? 'Loading data, please wait...' : 'Add a new document to your task'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={onAddQuestion}
                    disabled={isPageLoading}
                    className="w-full sm:w-auto"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isPageLoading ? 'Loading data, please wait...' : 'Add a new question to the list'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={onExportCsv}
                    disabled={isPageLoading || isExportingCsv || documents.length === 0}
                    className="w-full sm:w-auto"
                  >
                    {isExportingCsv ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isExportingCsv ? 'Exporting...' : 'Export CSV'}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isPageLoading ? 'Loading data, please wait...' : 'Export data as CSV'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <div className="flex w-full">
                    <Button
                      className="flex-1 rounded-r-none font-bold uppercase"
                      onClick={() => !isGenerating && setConfirmGeneration(buttonConfig.type)}
                      disabled={buttonConfig.disabled || disableGenerate}
                    >
                      {buttonConfig.loading ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Rocket className="h-4 w-4 mr-2" />
                      )}
                      {buttonConfig.text}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none -ml-px h-10 w-10"
                          disabled={disableGenerate}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {selectedDocuments.length > 0 && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setConfirmGeneration('new')}
                              disabled={isNewDisabled()}
                            >
                              {isGenerating ? (
                                <Spinner size="sm" className="mr-2" />
                              ) : (
                                <Rocket className="h-4 w-4 mr-2 text-primary" />
                              )}
                              Generate New
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmGeneration('all')}
                              disabled={disableGenerate}
                            >
                              {isGenerating ? (
                                <Spinner size="sm" className="mr-2" />
                              ) : (
                                <Rocket className="h-4 w-4 mr-2 text-primary" />
                              )}
                              Generate All
                            </DropdownMenuItem>
                          </>
                        )}

                        {selectedDocuments.length === 0 && (
                          <DropdownMenuItem
                            onClick={() => setConfirmGeneration('all')}
                            disabled={disableGenerate}
                          >
                            {isGenerating ? (
                              <Spinner size="sm" className="mr-2" />
                            ) : (
                              <Rocket className="h-4 w-4 mr-2 text-primary" />
                            )}
                            Generate All
                          </DropdownMenuItem>
                        )}

                        {disableGenerate && (
                          <div className="px-3 py-1.5 text-xs text-muted-foreground">
                            {isGenerating ? 'Loading, please wait...' : 'Add documents and questions to enable generation.'}
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isPageLoading ? 'Loading...' : buttonConfig.text}
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
