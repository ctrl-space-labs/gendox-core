// ** React Imports
import { Fragment } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import Badge from "@mui/material/Badge";
import MuiAvatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Icon from "src/@core/components/icon";
import ChatLog from "src/views/apps/chat/components/chat-content/ChatLog";
import SendMsgForm from "src/views/apps/chat/components/chat-content/SendMsgForm";
import CustomAvatar from "src/@core/components/mui/avatar";
import OptionsMenu from "src/@core/components/option-menu";
import LinearProgress from "@mui/material/LinearProgress";
import UserProfileRight from "src/views/apps/chat/components/chat-content/UserProfileRight";

// ** Styled Components
const ChatWrapperStartChat = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  height: "100%",
  display: "flex",
  borderRadius: 1,
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
  backgroundColor: theme.palette.action.hover,
}));

const ChatContent = (props) => {
  // ** Props
  const {
    hidden,
    sendMsg,
    mdAbove,
    dispatch,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleLeftSidebarToggle,
    handleUserProfileRightSidebarToggle,
    organizationId,
    projectId,
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const store = useSelector((state) => state.chat);
  const isSending = store.isSending;

  const renderContent = () => {
    if (store) {
      const selectedChat = store.selectedChat;

      useEffect(() => {
        if (!selectedChat) {
          setIsLoading(true);
          // You might want to set a timeout or handle this based on a Redux action
          setTimeout(() => setIsLoading(false), 3000); // simulates a delay
        }
      }, [selectedChat]);

      if ((!selectedChat && !isLoading) || projectId === "null") {
        return (
          <ChatWrapperStartChat
            sx={{
              ...(mdAbove
                ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
                : {}),
            }}
          >
            <Typography>
              No Agent selected. Please select an agent to start.
            </Typography>
          </ChatWrapperStartChat>
        );
      } else if (isLoading) {
        return (
          <ChatWrapperStartChat
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress disableShrink />
          </ChatWrapperStartChat>
        );
      } else {
        return (
          <Box
            sx={{
              width: 0,
              flexGrow: 1,
              height: "100%",
              backgroundColor: "action.hover",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {mdAbove ? null : (
                  <IconButton onClick={handleLeftSidebarToggle} sx={{ mr: 2 }}>
                    <Icon icon="mdi:menu" />
                  </IconButton>
                )}
                <Box
                  onClick={handleUserProfileRightSidebarToggle}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    sx={{ mr: 4.5 }}
                    badgeContent={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          color: `${
                            statusObj[selectedChat.contact.status]
                          }.main`,
                          boxShadow: (theme) =>
                            `0 0 0 2px ${theme.palette.background.paper}`,
                          backgroundColor: `${
                            statusObj[selectedChat.contact.status]
                          }.main`,
                        }}
                      />
                    }
                  >
                    {selectedChat.contact.avatar ? (
                      <MuiAvatar
                        src={selectedChat.contact.avatar}
                        alt={selectedChat.contact.fullName}
                        sx={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <CustomAvatar
                        skin="light"
                        color={selectedChat.contact.avatarColor}
                        sx={{ width: 40, height: 40, fontSize: "1rem" }}
                      >
                        {store.selectedChat.contact.fullName
                          ? getInitials(store.selectedChat.contact.fullName)
                          : ""}
                      </CustomAvatar>
                    )}
                  </Badge>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography sx={{ color: "text.secondary" }}>
                      {selectedChat.contact.fullName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.disabled" }}>
                      {selectedChat.contact.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* <Box sx={{ display: "flex", alignItems: "center" }}>
                {mdAbove ? (
                  <Fragment>
                    <IconButton size="small" sx={{ color: "text.secondary" }}>
                      <Icon icon="mdi:magnify" />
                    </IconButton>
                  </Fragment>
                ) : null}

                <OptionsMenu
                  menuProps={{ sx: { mt: 2 } }}
                  icon={<Icon icon="mdi:dots-vertical" fontSize="1.25rem" />}
                  iconButtonProps={{
                    size: "small",
                    sx: { color: "text.secondary" },
                  }}
                  options={["Rename", "Clear Chat", "Delete"]}
                />
              </Box> */}
            </Box>

            {selectedChat && store.userProfile ? (
              <ChatLog
                hidden={hidden}
                data={{ ...selectedChat, userContact: store.userProfile }}
              />
            ) : null}          

            {isSending && (
              <Box
                sx={{
                  width: "90%", // Reduce the width to leave space on the sides
                  maxWidth: "800px", // Optional: Add a maximum width for better control
                  mt: 3,
                  mb: 3,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Slightly more prominent shadow
                  textAlign: "center",
                  mx: "auto", // Center the box horizontally
                }}
              >
                <LinearProgress
                  color="primary"
                  sx={{
                    height: 6, // Slightly thinner for a sleeker look
                    borderRadius: 1, // Adds rounded corners
                    mb: 2,
                    backgroundColor: "rgba(0, 0, 0, 0.1)", // Subtle background for contrast
                  }}
                />
                <Typography
                  variant="body1" // Slightly larger text for better readability
                  color="text.primary"
                  sx={{
                    mt: 1,
                    fontWeight: "bold", // Bold text for emphasis
                    color: "primary.main", // Use theme's primary color for text
                  }}
                >
                  {statusMessage}
                </Typography>
              </Box>
            )}

            <SendMsgForm
              store={store}
              dispatch={dispatch}
              sendMsg={sendMsg}
              organizationId={organizationId}
              isSending={isSending}
              setStatusMessage={setStatusMessage}
            />

            <UserProfileRight
              store={store}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              userProfileRightOpen={userProfileRightOpen}
              handleUserProfileRightSidebarToggle={
                handleUserProfileRightSidebarToggle
              }
            />
          </Box>
        );
      }
    } else {
      return null;
    }
  };

  return renderContent();
};

export default ChatContent;
