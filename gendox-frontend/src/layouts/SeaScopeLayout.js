import { useEffect, useRef } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import VerticalLayout from 'src/@core/layouts/VerticalLayout'
import VerticalAppBarContent from './components/vertical/AppBarContent'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { useSettings } from 'src/@core/hooks/useSettings'
import GendoxAppBrand from './components/shared-components/GendoxAppBrand'
import VerticalNavButtons from 'src/layouts/components/VerticalNavButton'

const SeaScopeLayout = ({ children }) => {
  const theme = useTheme()
  const { settings, saveSettings } = useSettings()
  const { ChatButton, NewProjectButton } = VerticalNavButtons

  const bgUrl =
    settings.mode === 'light' ? `url('/images/gendox-back-light.webp')` : `url('/images/gendox-back-dark.webp')`

  const originalSettingsRef = useRef(null)

  useEffect(() => {
    if (!originalSettingsRef.current) {
      originalSettingsRef.current = { ...settings }
    }

    saveSettings({
      ...settings,
      footerContent: 'hidden',
      navBarContent: 'hidden',
      globalSearch: false,
      contentWidth: 'full'
    })

    return () => {
      if (originalSettingsRef.current) {
        saveSettings(originalSettingsRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // if (!settingsUpdated) return null

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: bgUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <VerticalLayout
        hidden={hidden} //hide navigation
        settings={settings}
        saveSettings={saveSettings}
        verticalNavItems={[]} // Navigation Items
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
    </Box>
  )
}

export default SeaScopeLayout
