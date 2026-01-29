import useMediaQuery from '@mui/material/useMediaQuery'
import VerticalLayout from 'src/@core/layouts/VerticalLayout'
import VerticalNavItems from 'src/navigation/vertical'
import VerticalAppBarContent from './components/vertical/AppBarContent'
import Box from '@mui/material/Box'
import { useSettings } from 'src/@core/hooks/useSettings'
import GendoxAppBrand from './components/shared-components/GendoxAppBrand'
import VerticalNavButtons from 'src/layouts/components/VerticalNavButton'
import GendoxFooterContent from "./components/shared-components/GendoxFooterContent";


const EarthObservationLayout = ({ children }) => {
  const { settings, saveSettings } = useSettings()
  const { ChatButton, NewProjectButton } = VerticalNavButtons

  const earthSettings = {
    ...settings,
    globalSearch: false,
    contentWidth: 'full',
    footerContent: 'default',
    navBarContent: 'default',
  }
  // const hidden = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const hidden = true;

  return (
    <Box
      sx={{
        minHeight: '100vh',
      }}
    >
      <VerticalLayout
        hidden={hidden} //hide navigation
        settings={earthSettings}
        saveSettings={saveSettings}
        verticalNavItems={VerticalNavItems()} // Navigation Items
        beforeVerticalNavMenuContent={ChatButton}
        afterVerticalNavMenuContent={NewProjectButton}
        verticalNavMenuBranding={GendoxAppBrand}
        footerContent={GendoxFooterContent}
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
    </Box>
  )
}

export default EarthObservationLayout
