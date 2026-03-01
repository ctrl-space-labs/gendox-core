import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import themeConfig from "src/configs/themeConfig"

export interface Settings {
  themeColor: string
  mode: "light" | "dark"
  embeddedLayout: boolean
  contentWidth: "full" | "boxed"
  isDemo: boolean
  showOrganizationDropdown: boolean
  navBarContent: "default" | "hidden"
  footerContent: "default" | "poweredBy" | "hidden"
  globalSearch: boolean
}

interface SettingsContextValue {
  settings: Settings
  saveSettings: (updatedSettings: Settings) => void
}

const initialSettings: Settings = {
  themeColor: "primary",
  mode: themeConfig.mode,
  embeddedLayout: themeConfig.embeddedLayout,
  contentWidth: themeConfig.contentWidth,
  isDemo: themeConfig.isDemo,
  showOrganizationDropdown: themeConfig.showOrganizationDropdown,
  navBarContent: themeConfig.navBarContent,
  footerContent: themeConfig.footerContent,
  globalSearch: themeConfig.globalSearch,
}

export const SettingsContext = createContext<SettingsContextValue>({
  saveSettings: () => null,
  settings: initialSettings,
})

interface SettingsProviderProps {
  children: ReactNode
  pageConfig?: Partial<Settings> & Record<string, any>
}

export const SettingsProvider = ({ children, pageConfig }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>({ ...initialSettings })

  useEffect(() => {
    if (pageConfig) {
      setSettings((prev) => ({ ...prev, ...pageConfig }))
    }
  }, [pageConfig])

  const saveSettings = (updatedSettings: Settings) => {
    setSettings(updatedSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const SettingsConsumer = SettingsContext.Consumer

export const useSettings = () => useContext(SettingsContext)
