import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

export const sortThreadsByDate = (threads: any[]) => {
  return threads.sort(
    (a, b) =>
      new Date(b.latestMessageCreatedAt).getTime() -
      new Date(a.latestMessageCreatedAt).getTime()
  )
}

interface AgentAvatarProps {
  fullName?: string
  isSelected?: boolean
}

export const AgentAvatar = ({ fullName, isSelected }: AgentAvatarProps) => (
  <Avatar
    className={cn(
      "h-10 w-10",
      isSelected ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
    )}
  >
    <AvatarFallback
      className={
        isSelected
          ? "bg-primary/20 text-primary"
          : "bg-primary/10 text-primary"
      }
    >
      {fullName?.charAt(0) || " "}
    </AvatarFallback>
  </Avatar>
)
