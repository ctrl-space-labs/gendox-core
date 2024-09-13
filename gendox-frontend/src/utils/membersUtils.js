import { useTheme } from "@mui/material/styles";
import CustomAvatar from "src/@core/components/mui/avatar";
import { getInitials } from "src/@core/utils/get-initials";

// Constants for user types and roles
export const userTypeStatus = {
  GENDOX_USER: { title: "GENDOX_USER", color: "primary" },
  GENDOX_AGENT: { title: "GENDOX_AGENT", color: "success" },
  UNKNOWN: { title: "UNKNOWN", color: "error" },
  DISCORD_USER: { title: "DISCORD_USER", color: "warning" },
  GENDOX_SUPER_ADMIN: { title: "GENDOX_SUPER_ADMIN", color: "info" },
};

export const memberRoleStatus = {
  ROLE_ADMIN: { title: "ADMIN", color: "#1976d2", icon: "mdi:shield-crown-outline" },
  ROLE_READER: { title: "READER", color: "#4caf50", icon: "mdi:smart-card-reader-outline" },
  ROLE_EDITOR: { title: "EDITOR", color: "#ff9800", icon: "mdi:pencil-outline" },
  UNKNOWN: { title: "UNKNOWN", color: "#f44336", icon: "mdi:account-question" },
};

// Utility function to escape RegExp
export const escapeRegExp = (value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// Utility function to hash a string (used to determine color)
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Function to render client avatar with a consistent color based on the user's unique property
export const renderClientAvatar = (user) => {
  const theme = useTheme();
  const colorOptions = [
    "success",
    "error",
    "warning",
    "info",
    "primary",
    "secondary",
  ];

  const colorIndex = Math.abs(hashCode(user.id || user.email || user.userName || "default")) % colorOptions.length;
  const color = colorOptions[colorIndex];
  const userName = user.name || user.userName || "Unknown Name";

  // if (user?.avatar?.length) {
  //   return (
  //     <CustomAvatar
  //       src={`/images/avatars/${row.avatar}`}
  //       sx={{ mr: 3, width: "1.875rem", height: "1.875rem" }}
  //     />
  //   );
  // } else {
  return (
    <CustomAvatar
      skin="light"
      color={color}
      sx={{ mr: 3, fontSize: ".8rem", width: "1.875rem", height: "1.875rem" }}
    >
      {getInitials(userName)}
    </CustomAvatar>
  );
};
