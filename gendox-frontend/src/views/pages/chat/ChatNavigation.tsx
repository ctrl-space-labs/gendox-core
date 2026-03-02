import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/router"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import ChatAgents from "src/views/pages/chat/navigation-components/ChatAgents"
import ChatThreads from "src/views/pages/chat/navigation-components/ChatThreads"
import ChatNavigationSearch from "src/views/pages/chat/navigation-components/ChatNavigationSearch"

// Chat sidebar width — keep in sync between mobile Sheet and desktop aside

interface ChatNavigationProps {
  mobileOpen: boolean
  onClose: () => void
  chatUrlPath: string
  embedMode?: boolean
}

const ChatNavigation = ({
  mobileOpen,
  onClose,
  chatUrlPath,
  embedMode,
}: ChatNavigationProps) => {
  const router = useRouter()
  const { organizationId, projectId } = router.query as Record<string, string>
  const { agents, threads } = useSelector(
    (state: any) => state.gendoxChat
  )
  const [searchQuery, setSearchQuery] = useState("")

  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const check = () => setHidden(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const sidebarContent = (
    <div className="h-full flex flex-col p-4">
      {!embedMode && (
        <ChatNavigationSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <ChatAgents
          agents={agents}
          chatUrlPath={chatUrlPath}
          onClose={onClose}
          organizationId={organizationId}
          projectId={projectId}
          hidden={hidden}
          searchQuery={searchQuery}
        />

        <Separator className="my-2" />

        <ChatThreads
          threads={threads}
          chatUrlPath={chatUrlPath}
          onClose={onClose}
          organizationId={organizationId}
          hidden={hidden}
          searchQuery={searchQuery}
          embedMode={embedMode}
        />
      </div>
    </div>
  )

  if (hidden) {
    return (
      <Sheet open={mobileOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="left" className="p-0 w-[350px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="shrink-0 bg-card border-r border-border rounded-l-md w-[350px]">
      {sidebarContent}
    </div>
  )
}

export default ChatNavigation
