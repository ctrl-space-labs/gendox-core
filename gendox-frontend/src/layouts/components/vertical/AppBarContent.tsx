import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import ModeToggler from "src/@core/layouts/components/shared-components/ModeToggler"
import UserDropdown from "src/@core/layouts/components/shared-components/UserDropdown"
import GendoxAppBrand from "../shared-components/GendoxAppBrand"
import OrganizationsDropdown from "../shared-components/OrganizationsDropdown"
import GlobalSearch from "src/views/custom-components/global-search/GlobalSearch"
import { useAuth } from "src/authentication/useAuth"
import type { Settings } from "src/@core/context/settingsContext"

interface AppBarContentProps {
  hidden: boolean
  settings: Settings
  saveSettings: (settings: Settings) => void
  toggleNavVisibility: () => void
}

const AppBarContent = ({
  hidden,
  settings,
  saveSettings,
  toggleNavVisibility,
}: AppBarContentProps) => {
  const auth = useAuth()

  const shouldShowHamburger = settings.navBarContent !== "hidden" && hidden

  return (
    <div className="w-full flex items-center justify-between">
      <div className="actions-left mr-2 flex items-center">
        {shouldShowHamburger && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNavVisibility}
            aria-label="Toggle navigation menu"
            className="-ml-2 sm:mr-3"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {settings.navBarContent === "hidden" && <GendoxAppBrand />}

        {settings.globalSearch && (
          <GlobalSearch hidden={hidden} user={auth.user} />
        )}
      </div>

      <div className="actions-right flex items-center">
        {auth.user && settings.showOrganizationDropdown && (
          <OrganizationsDropdown
            settings={settings}
            saveSettings={saveSettings}
          />
        )}
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <UserDropdown settings={settings} />
      </div>
    </div>
  )
}

export default AppBarContent
