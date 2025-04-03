import { useTheme } from "@mui/material/styles";
import CustomAvatar from "src/views/custom-components/mui/avatar";


// Constants for user types and roles
export const userTypeStatus = {
  GENDOX_USER: { title: "User", color: "primary" },
  GENDOX_AGENT: { title: "AI Agent", color: "success" },
  UNKNOWN: { title: "Unknown", color: "error" },
  DISCORD_USER: { title: "Discord User", color: "warning" },
  GENDOX_SUPER_ADMIN: { title: "GENDOX_SUPER_ADMIN", color: "info" },
};

export const memberRoleStatus = {
  ROLE_ADMIN: { title: "ADMIN", color: "#1976d2", icon: "mdi:shield-crown-outline" },
  ROLE_READER: { title: "Read Only", color: "#4caf50", icon: "mdi:smart-card-reader-outline" },
  ROLE_EDITOR: { title: "Editor", color: "#ff9800", icon: "mdi:pencil-outline" },
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

  const uniqueValue = user.id || user.email || user.userName || "default";
  const colorIndex = Math.abs(hashCode(uniqueValue)) % colorOptions.length;
  const color = colorOptions[colorIndex];


  return (
    <CustomAvatar
      skin="light"
      color={color}
      identiconValue={uniqueValue}
      sx={{ mr: 3, width: "2rem", height: "2rem" }}
    >

      {/*{getAcronym(userName)}*/}
    </CustomAvatar>
  );
};
