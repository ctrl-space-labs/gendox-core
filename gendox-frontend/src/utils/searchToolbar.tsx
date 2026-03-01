import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchToolbarProps {
  value: string
  onChange: (e: { target: { value: string } }) => void
  clearSearch: () => void
}

const SearchToolbar = ({ value, onChange, clearSearch }: SearchToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search…"
          value={value}
          onChange={onChange}
          className="pl-9 pr-9 h-9"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={clearSearch}
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default SearchToolbar
