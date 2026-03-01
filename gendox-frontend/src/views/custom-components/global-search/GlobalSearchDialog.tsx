import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import {
  Search,
  X,
  User,
  FileText,
  CornerDownLeft,
  ChevronDown,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { localStorageConstants } from 'src/utils/generalConstants'
import {
  fetchCloserSectionsFromProject,
  resetCloserDocuments,
} from 'src/store/globalSearch/globalSearch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GlobalSearchDialogProps {
  globalSearchDialogOpen: boolean
  closeGlobalSearchDialog: () => void
  user: any
}

type ActiveTab = 'agents' | 'documents'

interface AgentOption {
  title: string
  orgTitle: string
  category: string
  optionId: string
  link: string
}

interface DocumentOption {
  title: string
  sectionOrder: number
  sectionValue: string
  category: string
  optionId: string
  link: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GlobalSearchDialog = ({
  globalSearchDialogOpen,
  closeGlobalSearchDialog,
  user,
}: GlobalSearchDialogProps) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  const [searchValue, setSearchValue] = useState('')
  const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('agents')
  const [projectDocumentOptions, setProjectDocumentOptions] = useState<
    DocumentOption[]
  >([])
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([])
  const [documentsPage, setDocumentsPage] = useState(0)
  const [noMoreDocuments, setNoMoreDocuments] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const projectId = router.query.projectId as string | undefined

  const { closerDocumentsFromProject, loading } = useSelector(
    (state: any) => state.globalSearch
  )

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const resetDocumentState = () => {
    setProjectDocumentOptions([])
    setDocumentsPage(0)
    setNoMoreDocuments(false)
    ;(dispatch as any)((resetCloserDocuments as any)())
  }

  const resetDialogState = () => {
    setSearchValue('')
    setAgentOptions([])
    resetDocumentState()
  }

  const fetchCloserSections = (page: number) => {
    if (!projectId) {
      setErrorMessage('Please select a project.')
      return
    }
    ;(dispatch as any)(
      (fetchCloserSectionsFromProject as any)({
        message: searchValue,
        projectId,
        size: 5,
        page,
        token,
      })
    )
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = event.target.value
    setSearchValue(newSearchValue)
    resetDocumentState()

    if (activeTab !== 'documents') return
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    const timeoutId = setTimeout(() => {
      if (newSearchValue.length > 2) {
        fetchCloserSections(0)
      }
    }, 1000)
    setDebounceTimeout(timeoutId)
  }

  const handleLoadMore = () => {
    const nextPage = documentsPage + 1
    setDocumentsPage(nextPage)
    fetchCloserSections(nextPage)
  }

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (activeTab === 'agents') {
      resetDocumentState()
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    if (user?.organizations) {
      const agents: AgentOption[] = user.organizations.flatMap((org: any) =>
        org.projectAgents
          .filter((agent: any) =>
            agent.agentName.toLowerCase().includes(searchValue.toLowerCase())
          )
          .map((agent: any) => ({
            title: agent.agentName,
            orgTitle: org.name,
            category: 'Project Agents',
            optionId: agent.id,
            link: `/gendox/chat/?organizationId=${org.id}&projectId=${agent.projectId}`,
          }))
      )
      setAgentOptions(agents)
    }
  }, [user, searchValue])

  useEffect(() => {
    if (closerDocumentsFromProject?.length > 0) {
      setNoMoreDocuments(false)
      const documents: DocumentOption[] = closerDocumentsFromProject.map(
        (documentSection: any) => {
          const sectionValue = documentSection.sectionValue
            .split(' ')
            .slice(0, 20)
            .join(' ')

          return {
            title: documentSection.documentInstanceDTO.title,
            sectionOrder:
              documentSection.documentSectionMetadata.sectionOrder,
            sectionValue,
            category: 'Documents',
            optionId: documentSection.id,
            link: `/gendox/document-instance/?organizationId=${documentSection.documentInstanceDTO.organizationId}&documentId=${documentSection.documentInstanceDTO.id}&sectionId=${documentSection.id}&projectId=${projectId}`,
          }
        }
      )
      setProjectDocumentOptions(prev => [...prev, ...documents])
    } else if (closerDocumentsFromProject?.length < 1) {
      setNoMoreDocuments(true)
    }
  }, [closerDocumentsFromProject, projectId])

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center mt-10">
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  )

  const ItemAvatar = ({ children }: { children: React.ReactNode }) => (
    <Avatar className="h-7 w-7 rounded-md shrink-0 bg-primary/10">
      <AvatarFallback className="rounded-md bg-primary/10 text-primary">
        {children}
      </AvatarFallback>
    </Avatar>
  )

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <Dialog
      open={globalSearchDialogOpen}
      onOpenChange={open => {
        if (!open) {
          closeGlobalSearchDialog()
        }
      }}
    >
      {/* Override default DialogContent max-width and remove the built-in close button */}
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* ---- Search bar ---- */}
        <div className="flex items-center border-b px-4 mt-2 mb-1">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-3" />
          <Input
            autoFocus
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-base px-0 bg-transparent"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 ml-2"
            onClick={e => {
              e.stopPropagation()
              closeGlobalSearchDialog()
              resetDialogState()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ---- Tab switcher ---- */}
        <div className="flex justify-end px-4 py-3">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
            <button
              onClick={() => setActiveTab('agents')}
              className={cn(
                'rounded-full px-4 py-1 text-sm font-medium transition-colors',
                activeTab === 'agents'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={cn(
                'rounded-full px-4 py-1 text-sm font-medium transition-colors',
                activeTab === 'documents'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Documents
            </button>
          </div>
        </div>

        {/* ---- Results area ---- */}
        <ScrollArea className="max-h-[380px] min-h-[200px] px-2">
          {searchValue.length > 2 ? (
            <div className="pb-4">
              {/* Agents list */}
              {activeTab === 'agents' &&
                (agentOptions.length > 0 ? (
                  agentOptions.map(option => (
                    <button
                      key={option.optionId}
                      onClick={e => {
                        e.stopPropagation()
                        closeGlobalSearchDialog()
                        router.push(option.link)
                      }}
                      className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <ItemAvatar>
                        <User className="h-3.5 w-3.5" />
                      </ItemAvatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {option.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {option.orgTitle} &mdash; Organization
                        </p>
                      </div>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="shrink-0">
                              <Avatar className="h-7 w-7 rounded-md bg-primary/10">
                                <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                                  <CornerDownLeft className="h-3.5 w-3.5" />
                                </AvatarFallback>
                              </Avatar>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Chat with Agent</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    message={
                      'No results found for your search query.\nPlease try a different keyword or check your spelling.'
                    }
                  />
                ))}

              {/* Documents list */}
              {activeTab === 'documents' &&
                projectDocumentOptions.map(option => (
                  <button
                    key={`${option.optionId}-${option.title}`}
                    onClick={e => {
                      e.stopPropagation()
                      closeGlobalSearchDialog()
                      router.push(option.link)
                    }}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <ItemAvatar>
                      <FileText className="h-3.5 w-3.5" />
                    </ItemAvatar>

                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium text-primary truncate">
                        {option.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {option.sectionValue}...
                      </p>
                    </div>

                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="shrink-0">
                            <Avatar className="h-7 w-7 rounded-md bg-primary/10">
                              <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                                <CornerDownLeft className="h-3.5 w-3.5" />
                              </AvatarFallback>
                            </Avatar>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Access Document</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                ))}
            </div>
          ) : null}

          {/* Documents — footer states */}
          {searchValue.length > 2 && activeTab === 'documents' && !loading && (
            <div className="mt-2 pb-4">
              {errorMessage ? (
                <p className="text-center text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : noMoreDocuments ? (
                <EmptyState message="No more documents available." />
              ) : projectDocumentOptions.length > 0 ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    className="gap-2"
                  >
                    Load More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <EmptyState
                  message={
                    'No results found for your search query.\nPlease try a different keyword or check your spelling.'
                  }
                />
              )}
            </div>
          )}

          {/* Documents — loading spinner */}
          {searchValue.length > 2 && activeTab === 'documents' && loading && (
            <div className="flex justify-center mt-4 pb-4">
              <Spinner size="md" />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default GlobalSearchDialog
