// ** React Imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "src/hooks/useAuth";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Contacts from "src/views/apps/chat/components/sidebar/Contacts";
import Chats from "src/views/apps/chat/components/sidebar/Chats";

const Sidebar = (props) => {
  // ** Hook
  const auth = useAuth();

  // ** Props
  const {
    store,
    hidden,
    mdAbove,
    dispatch,
    statusObj,
    userStatus,
    selectChat,
    getInitials,
    sidebarWidth,
    setUserStatus,
    leftSidebarOpen,
    removeSelectedChat,
    userProfileLeftOpen,
    formatDateToMonthShort,
    handleLeftSidebarToggle,
    handleUserProfileLeftSidebarToggle,
    organizationId,
    storedToken,
    chatUrlPath,
  } = props;

  const router = useRouter();

  // ** States

  const [activeChat, setActiveChat] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const handleChatClick = (type, id, projectId) => {
    const newPath = `${chatUrlPath}/?organizationId=${organizationId}&threadId=${id}&projectId=${projectId}`;
    router.push(newPath);
    if (!mdAbove) {
      handleLeftSidebarToggle();
    }
  };

  useEffect(() => {
    const { projectId } = router.query; // Extract projectId from URL
    if (projectId) {
      setActiveProjectId(projectId); // Set the active project ID
    }
  }, [router.query]);

  useEffect(() => {
    if (store && store.selectedChat) {
      setActiveChat({ type: "chat", id: store.selectedChat.contact.threadId });
    }
  }, [store]);

  useEffect(() => {
    router.events.on("routeChangeComplete", () => {
      setActiveChat(null);
      dispatch(removeSelectedChat());
    });

    return () => {
      setActiveChat(null);
      dispatch(removeSelectedChat());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    
      <Drawer
        open={leftSidebarOpen}
        onClose={handleLeftSidebarToggle}
        variant={mdAbove ? "permanent" : "temporary"}
        ModalProps={{
          disablePortal: true,
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          zIndex: 7,
          height: "100%",
          display: "block",
          position: mdAbove ? "static" : "absolute",
          "& .MuiDrawer-paper": {
            boxShadow: "none",
            overflow: "hidden",
            width: sidebarWidth,
            position: mdAbove ? "static" : "absolute",
            borderTopLeftRadius: (theme) => theme.shape.borderRadius,
            borderBottomLeftRadius: (theme) => theme.shape.borderRadius,
          },
          "& > .MuiBackdrop-root": {
            borderRadius: 1,
            position: "absolute",
            zIndex: (theme) => theme.zIndex.drawer - 1,
          },
        }}
      >
        <Box
          sx={{
            height: `calc(100% - 4.125rem)`,
            flexDirection: "column",
          }}
        >         

          <Contacts
            store={store}
            hidden={hidden}
            activeProjectId={activeProjectId}
            handleChatClick={handleChatClick}
            statusObj={statusObj}
            getInitials={getInitials}
          />

          <Chats
            store={store}
            hidden={hidden}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            handleChatClick={handleChatClick}
          />
        </Box>
      </Drawer>
    
  );
};

export default Sidebar;
