import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import VerticalNavLink from "src/@core/layouts/components/vertical/navigation/VerticalNavLink"
import { groupThreadsByDate } from "src/views/pages/chat/utils/chatFormatter"
import ChatThreadMenu from "src/views/pages/chat/navigation-components/ChatThreadMenu"

interface Thread {
  id: string
  threadId: string
  threadName?: string
  latestMessageValue?: string
  latestMessageCreatedAt: string
  agent: {
    projectId: string
    fullName: string
  }
  badgeContent?: string
  badgeColor?: string
}

interface ChatThreadsProps {
  threads: Thread[]
  chatUrlPath: string
  onClose: () => void
  organizationId: string
  hidden: boolean
  searchQuery: string
  embedMode?: boolean
}

const ChatThreads = ({
  threads,
  chatUrlPath,
  onClose,
  organizationId,
  hidden,
  searchQuery,
  embedMode,
}: ChatThreadsProps) => {
  const filteredThreads = searchQuery
    ? threads.filter((thread) =>
        thread.agent.fullName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : threads
  const groupedThreads = groupThreadsByDate(filteredThreads || [])

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedThreadForMenu, setSelectedThreadForMenu] =
    useState<Thread | null>(null)

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    thread: Thread
  ) => {
    setAnchorEl(event.currentTarget)
    setSelectedThreadForMenu(thread)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  return (
    <div className="flex-[2] min-h-0">
      <ScrollArea className="h-full">
        {filteredThreads && filteredThreads.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Threads
            </h3>
            <div className="space-y-1">
              {Object.entries(groupedThreads).map(
                ([groupLabel, groupItems]) => {
                  if ((groupItems as Thread[]).length === 0) return null
                  return (
                    <div key={groupLabel} className="mb-2">
                      <span className="text-xs block mb-1 pl-4 text-primary">
                        {groupLabel}
                      </span>
                      {(groupItems as Thread[]).map((thread) => (
                        <VerticalNavLink
                          key={thread.threadId}
                          item={{
                            id: thread.id,
                            path: `${chatUrlPath}/?organizationId=${organizationId}&projectId=${thread.agent.projectId}&threadId=${thread.threadId}`,
                            title: thread.agent.fullName,
                            subtitle:
                              thread.latestMessageValue ||
                              "No messages yet",
                            threadName:
                              thread.threadName || "No name",
                            badgeContent: thread.badgeContent,
                            badgeColor: thread.badgeColor,
                            disabled: false,
                            openInNewTab: false,
                          }}
                          navVisible
                          toggleNavVisibility={onClose}
                          onOpenMenu={
                            !embedMode
                              ? (e: any) =>
                                  handleOpenMenu(e, thread)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )
                }
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No threads available.
          </p>
        )}
        <ChatThreadMenu
          anchorEl={anchorEl}
          handleCloseMenu={handleCloseMenu}
          selectedThread={selectedThreadForMenu}
          setSelectedThreadForMenu={setSelectedThreadForMenu}
        />
      </ScrollArea>
    </div>
  )
}

export default ChatThreads
