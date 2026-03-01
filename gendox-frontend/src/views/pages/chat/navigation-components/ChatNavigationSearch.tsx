import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ChatNavigationSearchProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const ChatNavigationSearch = ({
  searchQuery,
  setSearchQuery,
}: ChatNavigationSearchProps) => {
  return (
    <div className="mb-2 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search Agent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}

export default ChatNavigationSearch
