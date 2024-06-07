// ** MUI Imports
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Link from "next/link";


// ** Icon Imports
import Icon from "src/@core/components/icon";

import { useRouter } from "next/router";

// ** Components
import Autocomplete from "src/layouts/components/Autocomplete";
import ModeToggler from "src/@core/layouts/components/shared-components/ModeToggler";
import UserDropdown from "src/@core/layouts/components/shared-components/UserDropdown";
import LanguageDropdown from "src/@core/layouts/components/shared-components/LanguageDropdown";
import NotificationDropdown from "src/@core/layouts/components/shared-components/NotificationDropdown";
import ShortcutsDropdown from "src/@core/layouts/components/shared-components/ShortcutsDropdown";
import OrganizationsDropdown from "src/views/gendox-components/OrganizationsDropdown";

// ** Hook Import
import { useAuth } from "src/hooks/useAuth";





const AppBarContent = (props) => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props;

  // ** Hook
  const auth = useAuth();
  const router = useRouter();
 

  const AppBrand = () => {
    return (
      <Link href="/gendox/home" passHref style={{ textDecoration: 'none' }}>
        <Box          
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            padding: "20px 20px",    
          }}          
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              backgroundImage: "url('/images/gendoxLogo.svg')",
              backgroundSize: "20px 20px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              ml: 2,              
            }}
          >
            Gendox
          </Typography>
        </Box>
      </Link>
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box
        className="actions-left"
        sx={{ mr: 2, display: "flex", alignItems: "center" }}
      >
        {settings.navHidden && <AppBrand />}
        {hidden && !settings.navHidden ? (
           
          <IconButton
            color="inherit"
            sx={{ ml: -2.75 }}
            onClick={toggleNavVisibility}
          >
            <Icon icon="mdi:menu" />
          </IconButton>
        ) : null}
        {/* {auth.user && !settings.navHidden && (
          <Autocomplete hidden={hidden} settings={settings} />
        )} */}
      </Box>
      <Box
        className="actions-right"
        sx={{ display: "flex", alignItems: "center" }}
      >
        {/* </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        <LanguageDropdown settings={settings} saveSettings={saveSettings} />
        <ShortcutsDropdown settings={settings} shortcuts={shortcuts} />
        <NotificationDropdown settings={settings} notifications={notifications} />
           
         */}
        {auth.user && (
          <>
            <OrganizationsDropdown
              settings={settings}
              saveSettings={saveSettings}
            />
          </>
        )}
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  );
};

export default AppBarContent;
