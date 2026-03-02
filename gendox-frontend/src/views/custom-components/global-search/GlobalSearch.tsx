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
    <>
      <Button
        variant="ghost"
        onClick={openGlobalSearchDialog}
        aria-label="Global Search"
        className="flex items-center gap-2 shrink-0"
      >
        <Search className="h-5 w-5" />
        {!hidden && (
          <span className="text-muted-foreground text-sm select-none">
            Global Search
          </span>
        )}
      </Button>

      <GlobalSearchDialog
        globalSearchDialogOpen={globalSearchDialogOpen}
        closeGlobalSearchDialog={closeGlobalSearchDialog}
        user={user}
      />
    </>
  )
}

export default GlobalSearch
