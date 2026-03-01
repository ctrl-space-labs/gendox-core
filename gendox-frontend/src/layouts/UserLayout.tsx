import { useEffect, useState, type ReactNode } from "react"
import VerticalLayout from "src/@core/layouts/VerticalLayout"
import VerticalNavItems from "src/navigation/vertical"
import VerticalAppBarContent from "./components/vertical/AppBarContent"
import { useSettings } from "src/@core/context/settingsContext"
import GendoxAppBrand from "./components/shared-components/GendoxAppBrand"
import VerticalNavButtons from "src/layouts/components/VerticalNavButton"
import GendoxFooterContent from "./components/shared-components/GendoxFooterContent"

interface UserLayoutProps {
  children: ReactNode
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const { settings, saveSettings } = useSettings()
  const { ChatButton, NewProjectButton } = VerticalNavButtons

  // Use responsive breakpoint detection
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setHidden(window.innerWidth < 1024) // lg breakpoint
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Force settings for UserLayout
  useEffect(() => {
    if (
      settings.navBarContent !== "default" ||
      settings.footerContent !== "default" ||
      settings.globalSearch !== true
    ) {
      saveSettings({
        ...settings,
        footerContent: "default",
        navBarContent: "default",
        globalSearch: true,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <VerticalLayout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      verticalNavItems={VerticalNavItems()}
      beforeVerticalNavMenuContent={ChatButton}
      afterVerticalNavMenuContent={NewProjectButton}
      verticalNavMenuBranding={GendoxAppBrand}
      footerContent={GendoxFooterContent}
      verticalAppBarContent={(props: any) => (
        <VerticalAppBarContent
          hidden={hidden}
          settings={settings}
          saveSettings={saveSettings}
          toggleNavVisibility={props.toggleNavVisibility}
        />
      )}
    >
      {children}
    </VerticalLayout>
  )
}

export default UserLayout
