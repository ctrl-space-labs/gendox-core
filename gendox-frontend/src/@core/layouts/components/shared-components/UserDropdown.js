// ** React Imports
import { useState, Fragment } from "react";

// ** Next Import
import { useRouter } from "next/router";

// ** MUI Imports
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Link from "next/link";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Context
import { useAuth } from "src/hooks/useAuth";
import authConfig from "src/configs/auth";

// ** Styled Components
const BadgeContentSpan = styled("span")(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
}));

const UserDropdown = (props) => {
  // ** Props
  const { settings } = props;
  const auth = useAuth();

  // ** States
  const [anchorEl, setAnchorEl] = useState(null);

  // ** Hooks
  const router = useRouter();
  let { organizationId } = router.query;

  if (!organizationId) {
    organizationId = window.localStorage.getItem(
      authConfig.selectedOrganizationId
    );
  }

  const { logout } = useAuth();

  // ** Vars
  const { direction } = settings;

  const handleDropdownOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = (url) => {
    if (url) {
      router.push(url);
    }
    setAnchorEl(null);
  };

  const styles = {
    py: 2,
    px: 4,
    width: "100%",
    display: "flex",
    alignItems: "center",
    color: "text.primary",
    textDecoration: "none",
    "& svg": {
      mr: 2,
      fontSize: "1.375rem",
      color: "text.primary",
    },
  };

  const handleLogout = () => {
    logout();
    handleDropdownClose();
  };

  return (
    <Fragment>
      <Badge
        overlap="circular"
        onClick={handleDropdownOpen}
        sx={{ ml: 2, cursor: "pointer" }}
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Avatar
          alt="John Doe"
          onClick={handleDropdownOpen}
          sx={{ width: 40, height: 40 }}
          src="/images/avatars/1.png"
        />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ "& .MuiMenu-paper": { width: 230, mt: 4 } }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: direction === "ltr" ? "right" : "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: direction === "ltr" ? "right" : "left",
        }}
      >
        <Box sx={{ pt: 2, pb: 3, px: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Badge
              overlap="circular"
              badgeContent={<BadgeContentSpan />}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
            >
              <Avatar
                alt={auth.user.name}
                src="/images/avatars/1.png"
                sx={{ width: "2.5rem", height: "2.5rem" }}
              />
            </Badge>
            <Box
              sx={{
                display: "flex",
                ml: 3,
                alignItems: "flex-start",
                flexDirection: "column",
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>{auth.user.name}</Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: "0.8rem", color: "text.disabled" }}
              >
                {auth.user.role}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mt: "0 !important" }} />
        <MenuItem
          sx={{ p: 0 }}
          onClick={() =>
            handleDropdownClose(
              `/gendox/user-profile?organizationId=${organizationId}&userId=${auth.user.id}`
            )
          }
        >
          <Link
            href={`/gendox/user-profile?organizationId=${organizationId}&userId=${auth.user.id}`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Box sx={styles} >
              <Icon icon="mdi:account-outline" />
              Profile
            </Box>
          </Link>
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ p: 0 }}
          onClick={() => handleDropdownClose("/gendox/create-organization")}
        >
          <Link
            href="/gendox/create-organization"
            passHref
            style={{ textDecoration: "none" }}
          >
            <Box sx={{ ...styles, textDecoration: "none" }} >
              <Icon icon="mdi:plus" />
              Add Organization
            </Box>
          </Link>
        </MenuItem>
        <MenuItem
          sx={{ p: 0 }}
          onClick={() =>
            handleDropdownClose(
              `/gendox/organization-settings?organizationId=${organizationId}`
            )
          }
        >
          <Link
            href={`/gendox/organization-settings?organizationId=${organizationId}`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Box sx={{ ...styles, textDecoration: "none" }} >
              <Icon icon="mdi:cog-outline" />
              Organization Settings
            </Box>
          </Link>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 2,
            "& svg": { mr: 2, fontSize: "1.375rem", color: "text.primary" },
          }}
        >
          <Icon icon="mdi:logout-variant" />
          Logout
        </MenuItem>
      </Menu>
    </Fragment>
  );
};

export default UserDropdown;
