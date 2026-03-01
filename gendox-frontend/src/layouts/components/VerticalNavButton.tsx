import Link from "next/link"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ChatButton = () => {
  const project = useSelector((state: any) => state.activeProject.projectDetails)
  const organization = useSelector(
    (state: any) => state.activeOrganization.activeOrganization
  )
  const chatUrl = `/gendox/chat/?organizationId=${organization.id}&=${project.id}`

  return (
    <div className="px-2 pt-2">
      <Link href={chatUrl} className="block">
        <button className="gendox-gradient-bg w-full flex items-center justify-center gap-3 py-3 px-4 text-lg font-medium cursor-pointer border-0">
          <Sparkles className="h-5 w-5" />
          Chat
        </button>
      </Link>
    </div>
  )
}

const NewProjectButton = () => {
  const router = useRouter()
  const { organizationId } = router.query

  return (
    <TooltipProvider>
      <div className="mt-3 mb-3 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/gendox/create-project/?organizationId=${organizationId}`}
            >
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>New Project</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export default {
  ChatButton,
  NewProjectButton,
}
