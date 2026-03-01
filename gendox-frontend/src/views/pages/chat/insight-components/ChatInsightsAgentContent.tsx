import { Fragment } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/router"
import {
  Brain,
  Search,
  ShieldCheck,
  RefreshCw,
  FileText,
  Thermometer,
  Gauge,
  ListOrdered,
  Scale,
  BarChart3,
  CalendarClock,
  KeyRound,
  MousePointerClick,
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AgentAvatar } from "src/views/pages/chat/utils/chatUtils"
import Link from "next/link"
import { format, parseISO } from "date-fns"

interface ChatInsightAgentContentProps {
  projectId: string
  currentThread: any
}

const ChatInsightAgentContent = ({
  projectId,
  currentThread,
}: ChatInsightAgentContentProps) => {
  const router = useRouter()
  const { organizationId } = router.query

  const { projectDetails: project, isUpdatingProject } = useSelector(
    (state: any) => state.activeProject
  )

  const projectAgent = project?.projectAgent

  if (isUpdatingProject) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const agentDetails = [
    {
      icon: Brain,
      label: "Completion Model",
      value: projectAgent?.completionModel?.name || "N/A",
    },
    {
      icon: Search,
      label: "Semantic Search Model",
      value: projectAgent?.semanticSearchModel?.name || "N/A",
    },
    {
      icon: ShieldCheck,
      label: "Moderation Check",
      value: projectAgent?.moderationCheck
        ? projectAgent.moderationModel?.name
        : "No",
    },
    {
      icon: RefreshCw,
      label: "Rerank",
      value: projectAgent?.rerankEnable
        ? projectAgent.rerankModel?.name
        : "Disabled",
    },
    {
      icon: FileText,
      label: "Document Splitter",
      value: projectAgent?.documentSplitterType?.name || "N/A",
    },
    {
      icon: Thermometer,
      label: "Max Tokens",
      value: projectAgent?.maxToken || "N/A",
    },
    {
      icon: Gauge,
      label: "Temperature",
      value: projectAgent?.temperature || "N/A",
    },
    {
      icon: ListOrdered,
      label: "Top P",
      value: projectAgent?.topP || "N/A",
    },
    {
      icon: Scale,
      label: "Max Search Limit",
      value: projectAgent?.maxSearchLimit || "N/A",
    },
    {
      icon: BarChart3,
      label: "Max Completion Limit",
      value: projectAgent?.maxCompletionLimit || "N/A",
    },
    {
      icon: CalendarClock,
      label: "Created At",
      value: projectAgent?.createdAt
        ? format(parseISO(projectAgent.createdAt), "PPP")
        : "N/A",
    },
    {
      icon: KeyRound,
      label: "Agent Visibility",
      value: projectAgent?.privateAgent
        ? "Private Agent"
        : "Public Agent",
    },
    {
      icon: MousePointerClick,
      label: "Agent Behavior",
      value: projectAgent?.agentBehavior || "N/A",
    },
  ]

  return (
    <Card className="bg-transparent shadow-none border-none">
      {currentThread && projectAgent ? (
        <Fragment>
          <div className="relative p-3">
            <div className="mb-4 flex justify-center">
              <AgentAvatar
                isSelected={false}
                fullName={currentThread?.agent?.fullName}
              />
            </div>
            <p className="mb-0.5 font-semibold text-center">
              {projectAgent.agentName}
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Project Agent
            </p>
          </div>

          <div className="px-3 py-2">
            <h3 className="text-lg font-semibold mb-2">
              Agent Details
            </h3>
            <div className="space-y-1">
              {agentDetails.map((detail, index) => {
                const Icon = detail.icon
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 py-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {detail.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {String(detail.value)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link
              href={`/gendox/project-settings/?organizationId=${organizationId}&projectId=${projectId}`}
              passHref
              target="_blank"
            >
              <Button className="w-full mt-4">Edit Agent</Button>
            </Link>
          </div>
        </Fragment>
      ) : null}
    </Card>
  )
}

export default ChatInsightAgentContent
