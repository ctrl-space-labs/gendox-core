// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icons Imports
import Menu from 'mdi-material-ui/Menu'
import Magnify from 'mdi-material-ui/Magnify'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import GendoxAppBrand from "../shared-components/GendoxAppBrand";
import OrganizationsDropdown from "../shared-components/OrganizationsDropdown";
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
          <TextField
            size='small'
            sx={{'& .MuiOutlinedInput-root': {borderRadius: 4}}}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Magnify fontSize='small'/>
                </InputAdornment>
              )
            }}
          />
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
