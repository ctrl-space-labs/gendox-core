import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, useTheme } from "@mui/material/styles";
import { useRouter } from "next/router";

// ** Layout Imports
// !Do not remove this Layout import
import Layout from "src/@core/layouts/Layout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Icon from "src/@core/components/icon";
import Button from "@mui/material/Button";
import Link from "next/link";

// ** Navigation Imports
import VerticalNavItems from "src/navigation/vertical";
import HorizontalNavItems from "src/navigation/horizontal";

// ** Component Import
// Uncomment the below line (according to the layout type) when using server-side menu
// import ServerSideVerticalNavItems from './components/vertical/ServerSideNavItems'
// import ServerSideHorizontalNavItems from './components/horizontal/ServerSideNavItems'

import VerticalAppBarContent from "./components/vertical/AppBarContent";
import HorizontalAppBarContent from "./components/horizontal/AppBarContent";

// ** Hook Import
import { useSettings } from "src/@core/hooks/useSettings";

import VerticalNavButtons from "src/navigation/vertical/VerticalNavButton";
import PoweredByGendox from "./components/shared-components/PoweredByGendox";

const UserLayout = ({ children, contentHeightFixed }) => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;

  // ** Hooks
  const { settings, saveSettings } = useSettings();

  // ** Vars for server side navigation
  // const { menuItems: verticalMenuItems } = ServerSideVerticalNavItems()
  // const { menuItems: horizontalMenuItems } = ServerSideHorizontalNavItems()
  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/material-ui/react-use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */
  const hidden = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  if (hidden && settings.layout === "horizontal") {
    settings.layout = "vertical";
  }

  const { ChatButton, NewProjectButton } = VerticalNavButtons;

  const { footerContent } = settings;
  let footerContentComponent = null;
  if (footerContent === "poweredBy") {
    footerContentComponent = () => <PoweredByGendox />;
  }

  const AppBrand = () => {
    return (
      <Link
        href={`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`}
        passHref
        style={{ textDecoration: "none" }}
      >
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
    <Layout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      contentHeightFixed={contentHeightFixed}
      footerProps={{
        content: footerContentComponent,
      }}
      verticalLayoutProps={{
        navMenu: {
          navItems: VerticalNavItems(),
          beforeContent: () => <ChatButton />,
          afterContent: () => <NewProjectButton />,
          // lockedIcon: <Icon icon='mdi:arrow-left-bold-circle-outline' />,
          // unlockedIcon: <Icon icon='mdi:arrow-right-bold-circle-outline' />,
          branding: () => <AppBrand />,
          // content: () => <Menu />
          // Uncomment the below line when using server-side menu in vertical layout and comment the above line
          // navItems: verticalMenuItems,
        },
        appBar: {
          content: (props) => (
            <VerticalAppBarContent
              hidden={hidden}
              settings={settings}
              saveSettings={saveSettings}
              toggleNavVisibility={props.toggleNavVisibility}
            />
          ),
        },
      }}
      {...(settings.layout === "horizontal" && {
        horizontalLayoutProps: {
          navMenu: {
            navItems: HorizontalNavItems(),

            // Uncomment the below line when using server-side menu in horizontal layout and comment the above line
            // navItems: horizontalMenuItems
          },
          appBar: {
            content: () => (
              <HorizontalAppBarContent
                settings={settings}
                saveSettings={saveSettings}
              />
            ),
          },
        },
      })}
    >
      {children}
    </Layout>
  );
};

export default UserLayout;
