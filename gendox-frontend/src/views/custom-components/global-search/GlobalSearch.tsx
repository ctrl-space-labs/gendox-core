import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GlobalSearchDialog from 'src/views/custom-components/global-search/GlobalSearchDialog'

interface GlobalSearchProps {
  hidden: boolean
  user: any
}

const GlobalSearch = ({ hidden, user }: GlobalSearchProps) => {
  const [globalSearchDialogOpen, setGlobalSearchDialogOpen] = useState(false)

  const openGlobalSearchDialog = () => {
    setGlobalSearchDialogOpen(true)
  }

  const closeGlobalSearchDialog = () => {
    setGlobalSearchDialogOpen(false)
  }

  return (
    <div
      onClick={openGlobalSearchDialog}
      className="flex cursor-pointer items-center"
    >
      <Button variant="ghost" size="icon" className="shrink-0">
        <Search className="h-5 w-5" />
      </Button>

      {!hidden && (
        <span className="text-muted-foreground text-sm select-none">
          Global Search
        </span>
      )}

      <GlobalSearchDialog
        globalSearchDialogOpen={globalSearchDialogOpen}
        closeGlobalSearchDialog={closeGlobalSearchDialog}
        user={user}
      />
    </div>
  )
}

export default GlobalSearch
