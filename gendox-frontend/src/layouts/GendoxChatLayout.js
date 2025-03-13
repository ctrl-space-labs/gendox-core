// ** MUI Imports
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Layout Imports
// !Do not remove this Layout import
import VerticalLayout from 'src/@core/layouts/VerticalLayout'

// ** Navigation Imports
import VerticalNavItems from 'src/navigation/vertical'

// ** Component Import
import UpgradeToProButton from './components/UpgradeToProButton'
import VerticalAppBarContent from './components/vertical/AppBarContent'

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'
import GendoxAppBrand from "./components/shared-components/GendoxAppBrand";
import VerticalNavButtons from "src/layouts/components/VerticalNavButton";
import PoweredByGendox from "./components/shared-components/PoweredByGendox";
import GendoxFooterContent from "./components/shared-components/GendoxFooterContent";
import {useEffect} from "react";


const GendoxChatLayout = ({ children }) => {
  // ** Hooks
  const { settings, saveSettings } = useSettings()

  const { ChatButton, NewProjectButton } = VerticalNavButtons;


  useEffect(() => {
    const originalSettings = settings;

    // Update settings specifically for this page
    saveSettings({
      ...settings,
      footerContent: 'hidden',
      navBarContent: 'hidden',
      globalSearch: false,
    })

    return () => saveSettings(originalSettings);
  }, [])

  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/components/use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */
  const hidden = useMediaQuery(theme => theme.breakpoints.down('lg'))

  return (
    <VerticalLayout
      hidden={hidden} //hide navigation
      settings={settings}
      saveSettings={saveSettings}
      verticalNavItems={VerticalNavItems()} // Navigation Items
      beforeVerticalNavMenuContent={ChatButton}
      afterVerticalNavMenuContent={NewProjectButton}
      verticalNavMenuBranding={GendoxAppBrand}
      footerContent={null}
      verticalAppBarContent={(
        props // AppBar Content
      ) => (
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
