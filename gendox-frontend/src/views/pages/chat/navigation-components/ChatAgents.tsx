import { ScrollArea } from "@/components/ui/scroll-area"
import VerticalNavLink from "src/@core/layouts/components/vertical/navigation/VerticalNavLink"
import { AgentAvatar } from "src/views/pages/chat/utils/chatUtils"

interface Agent {
  id: string
  projectId: string
  fullName: string
  description: string
}

interface ChatAgentsProps {
  agents: Agent[]
  chatUrlPath: string
  onClose: () => void
  organizationId: string
  projectId: string
  hidden: boolean
  searchQuery: string
}

const ChatAgents = ({
  agents,
  chatUrlPath,
  onClose,
  projectId,
  organizationId,
  hidden,
  searchQuery,
}: ChatAgentsProps) => {
  const selectedAgentId =
    agents?.find((a) => a.projectId === projectId)?.id || null

  const filteredAgents = searchQuery
    ? agents.filter((agent) =>
        agent.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : agents

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea className="h-full">
        {filteredAgents && filteredAgents.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Agents
            </h3>
            <div className="space-y-1">
              {filteredAgents.map((agent) => (
                <VerticalNavLink
                  key={agent.id}
                  item={{
                    path: `${chatUrlPath}/?organizationId=${organizationId}&projectId=${agent.projectId}`,
                    icon: () => (
                      <AgentAvatar
                        isSelected={agent.id === selectedAgentId}
                        fullName={agent.fullName}
                      />
                    ),
                    title: agent.fullName,
                    subtitle: agent.description,
                  }}
                  navVisible
                  toggleNavVisibility={onClose}
                />
              ))}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  )
}

export default ChatAgents
