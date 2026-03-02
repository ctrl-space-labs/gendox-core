import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (e: { target: { value: string } }) => void
  placeholder?: string
  clearable?: boolean
  className?: string
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  clearable = false,
  className,
}: SearchBarProps) => {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-9 pr-9"
        aria-label="search input"
      />
      {clearable && value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange({ target: { value: "" } })}
          aria-label="clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default SearchBar
