// ** React Imports
import { useEffect, useState } from "react";

// ** MUI Imports
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// ** Store & Actions Imports
import { useDispatch, useSelector } from "react-redux";
import {
  sendMsg,
  selectChat,
  fetchChatsContacts,
  removeSelectedChat,
  setUserProfile,
} from "src/store/apps/chat";

// ** Hooks
import { useSettings } from "src/@core/hooks/useSettings";
import { useAuth } from "src/hooks/useAuth";
import { useRouter } from "next/router";
import authConfig from "src/configs/auth";

// ** Utils Imports
import { getInitials } from "src/@core/utils/get-initials";
import { formatDateToMonthShort } from "src/@core/utils/format";

// ** Chat App Components Imports
import SidebarLeft from "src/views/apps/chat/SidebarLeft";
import ChatContent from "src/views/apps/chat/ChatContent";

const AppChat = () => {
  const router = useRouter();
  const { organizationId } = router.query;

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );


  // ** States
  const [userStatus, setUserStatus] = useState("online");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [userProfileLeftOpen, setUserProfileLeftOpen] = useState(false);
  const [userProfileRightOpen, setUserProfileRightOpen] = useState(false);

  // ** Hooks
  const theme = useTheme();
  const { settings } = useSettings();
  const dispatch = useDispatch();
  const hidden = useMediaQuery(theme.breakpoints.down("lg"));
  const store = useSelector((state) => state.chat);
  const auth = useAuth();

  // ** Vars
  const { skin } = settings;
  const smAbove = useMediaQuery(theme.breakpoints.up("sm"));
  const sidebarWidth = smAbove ? 370 : 300;
  const mdAbove = useMediaQuery(theme.breakpoints.up("md"));

  const statusObj = {
    busy: "error",
    away: "warning",
    online: "success",
    offline: "secondary",
  };
  useEffect(() => {
    dispatch(setUserProfile(auth.user));
    dispatch(fetchChatsContacts({organizationId, storedToken}));
  }, [dispatch]);
  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen);
  const handleUserProfileLeftSidebarToggle = () =>
    setUserProfileLeftOpen(!userProfileLeftOpen);
  const handleUserProfileRightSidebarToggle = () =>
    setUserProfileRightOpen(!userProfileRightOpen);

  return (
    <Box
      className="app-chat"
      sx={{
        width: "100%",
        display: "flex",
        borderRadius: 1,
        '@media (max-width:600px)': {
                            borderRadius: 0
                        },
        overflow: "hidden",
        position: "relative",
        boxShadow: skin === "bordered" ? 0 : 6,
        ...(skin === "bordered" && {
          border: `1px solid ${theme.palette.divider}`,
        }),
      }}
    >
      <SidebarLeft
        store={store}
        hidden={hidden}
        mdAbove={mdAbove}
        dispatch={dispatch}
        statusObj={statusObj}
        userStatus={userStatus}
        selectChat={selectChat}
        getInitials={getInitials}
        sidebarWidth={sidebarWidth}
        setUserStatus={setUserStatus}
        leftSidebarOpen={leftSidebarOpen}
        removeSelectedChat={removeSelectedChat}
        userProfileLeftOpen={userProfileLeftOpen}
        formatDateToMonthShort={formatDateToMonthShort}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleUserProfileLeftSidebarToggle={handleUserProfileLeftSidebarToggle}
      />
      <ChatContent
        store={store}
        hidden={hidden}
        sendMsg={sendMsg}
        mdAbove={mdAbove}
        dispatch={dispatch}
        statusObj={statusObj}
        getInitials={getInitials}
        sidebarWidth={sidebarWidth}
        userProfileRightOpen={userProfileRightOpen}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleUserProfileRightSidebarToggle={
          handleUserProfileRightSidebarToggle
        }
      />
    </Box>
  );
};
AppChat.contentHeightFixed = true;

export default AppChat
