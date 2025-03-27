// ** React Imports
import {createContext, useEffect, useState} from 'react'

// ** ThemeConfig Import
import themeConfig from 'src/configs/themeConfig'

const initialSettings = {
  themeColor: 'primary',
  mode: themeConfig.mode,
  embeddedLayout: themeConfig.embeddedLayout,
  contentWidth: themeConfig.contentWidth,
  isDemo: themeConfig.isDemo,
  showOrganizationDropdown: themeConfig.showOrganizationDropdown,
  navBarContent: themeConfig.navBarContent,
  footerContent: themeConfig.footerContent,
  globalSearch: themeConfig.globalSearch,
}

// ** Create Context
export const SettingsContext = createContext({
  saveSettings: () => null,
  settings: initialSettings
})

export const SettingsProvider = ({ children, pageConfig }) => {
  // ** State
  const [settings, setSettings] = useState({ ...initialSettings })

  useEffect(() => {
    // TODO save and load sittings from local storage


    if (pageConfig) {
      setSettings({ ...settings, ...pageConfig })
    }

  }, [pageConfig])
  const saveSettings = updatedSettings => {
    setSettings(updatedSettings)
  }

  return <SettingsContext.Provider value={{ settings, saveSettings }}>{children}</SettingsContext.Provider>
}

export const SettingsConsumer = SettingsContext.Consumer
