// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Icons Imports
import Menu from 'mdi-material-ui/Menu'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import GendoxAppBrand from "../shared-components/GendoxAppBrand";
import OrganizationsDropdown from "../shared-components/OrganizationsDropdown";
import GlobalSearch from 'src/views/custom-components/global-search/GlobalSearch'
import {useAuth} from "../../../authentication/useAuth";

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props
  // ** Hook
  const hiddenSm = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const auth = useAuth();

  // Determine if the hamburger menu button should be shown.
  // It appears only when the navigation bar is enabled (i.e. not set to 'hidden')
  // and the sidebar is collapsed due to a small screen.
  const shouldShowHamburger = settings.navBarContent !== 'hidden' && hidden;

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {shouldShowHamburger ? (
          <IconButton
            color='inherit'
            onClick={toggleNavVisibility}
            sx={{ml: -2.75, ...(hiddenSm ? {} : {mr: 3.5})}}
          >
            <Menu/>
          </IconButton>
        ) : null
        }

        {settings.navBarContent === 'hidden' &&
          <GendoxAppBrand />
        }
        {settings.globalSearch && (
          <GlobalSearch hidden={hidden} user={auth.user}/>
        )}
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        {auth.user && settings.showOrganizationDropdown && (
          <>
            <OrganizationsDropdown
              settings={settings}
              saveSettings={saveSettings}
            />
          </>
        )}
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        {/*<NotificationDropdown />*/}
        <UserDropdown settings={settings}/>
      </Box>
    </Box>
  )
}

export default AppBarContent
