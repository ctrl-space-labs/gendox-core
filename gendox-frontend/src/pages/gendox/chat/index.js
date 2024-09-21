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

const AppChat = (props) => {
  const router = useRouter();
  const { organizationId, threadId } = router.query;
  const chatUrlPath = props.chatUrlPath || '/gendox/chat';

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
    // Hide navigation on mount
    settings.navHidden = true
    // no need to handle embedded view, no the embedded chat has a separate Layout
    // if (props.embedView) {
    //   // show the 'Powered By' in the iframe
    //   settings.footerContent = 'poweredBy'
    //   settings.showOrganizationDropdown = false
    // } else {
      //hide the footer in chat
      settings.footer = 'hidden'
    // }
    
    // Show navigation on unmount
    return () => {
      settings.navHidden = false
      settings.footer = 'static'
      settings.footerContent = undefined
      settings.showOrganizationDropdown = true
    };
  }, [dispatch]);

  useEffect(() => {
   
    dispatch(setUserProfile(auth.user));
    
    dispatch(fetchChatsContacts({ organizationId, storedToken })).then(() => {
      if (threadId) {
        dispatch(selectChat({ id: threadId, organizationId, storedToken }));        
      }
    });
   
  }, [dispatch, organizationId, storedToken, threadId]);

  

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
        height: "100%",
        display: "flex",
        borderRadius: 1,
        "@media (max-width:600px)": {
          borderRadius: 0,
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
        organizationId={organizationId}
        storedToken={storedToken}
        chatUrlPath={chatUrlPath}
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
        organizationId={organizationId}
        storedToken={storedToken}
        chatUrlPath={chatUrlPath}
      />
    </Box>
  );
};
AppChat.contentHeightFixed = true;

export default AppChat;
