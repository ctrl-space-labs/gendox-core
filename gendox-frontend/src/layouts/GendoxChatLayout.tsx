import { useEffect, useState, type ReactNode } from "react"
import VerticalLayout from "src/@core/layouts/VerticalLayout"
import VerticalNavItems from "src/navigation/vertical"
import VerticalAppBarContent from "./components/vertical/AppBarContent"
import { useSettings } from "src/@core/context/settingsContext"
import GendoxAppBrand from "./components/shared-components/GendoxAppBrand"
import VerticalNavButtons from "src/layouts/components/VerticalNavButton"

interface GendoxChatLayoutProps {
  children: ReactNode
}

const GendoxChatLayout = ({ children }: GendoxChatLayoutProps) => {
  const { settings, saveSettings } = useSettings()
  const { ChatButton, NewProjectButton } = VerticalNavButtons

  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setHidden(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Force settings for ChatLayout
  useEffect(() => {
    if (settings.navBarContent !== "hidden") {
      saveSettings({
        ...settings,
        footerContent: "hidden",
        navBarContent: "hidden",
        globalSearch: false,
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
      footerContent={null}
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

export default GendoxChatLayout
