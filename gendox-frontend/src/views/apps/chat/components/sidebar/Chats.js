import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Icon from "src/@core/components/icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ScrollWrapper } from "src/utils/chatSidebarUtils";
import { sortByField } from "src/utils/orderUtils";
import { groupChatsByDate } from "src/utils/chatSidebarUtils";

const Chats = ({ store, activeChat, setActiveChat, hidden, handleChatClick }) => {
  const [hoveredChat, setHoveredChat] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);  

  const handleChatMouseLeave = () => {
    setHoveredChat(null);
  };
  const handleChatMouseEnter = (chatId) => {
    setHoveredChat(chatId);
  };
  const handleMenuClick = (event, chatId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveChat({ type: "chat", id: chatId });
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    // Implement rename functionality here
    handleMenuClose();
  };

  const handleDelete = () => {
    // Implement delete functionality here
    handleMenuClose();
  };

  const renderChats = () => {
    if (store && store.chats && store.chats.length) {
      const arrToMap = store.chats;

      const groupedChats = groupChatsByDate(arrToMap);

      const renderGroupedChats = (chats, label) => (
        <>
          {chats.length > 0 && (
            <Typography
              variant="subtitle2"
              sx={{ px: 3, pt: 3, pb: 1, color: "primary.main" }}
            >
              {label}
            </Typography>
          )}
          {chats.map((chat, index) => {
            const { lastMessage } = chat.chat;
            const activeCondition =
            activeChat !== null &&
            activeChat.id === chat.id &&
            activeChat.type === "chat";
            const formattedTime = lastMessage
              ? formatDistanceToNow(parseISO(lastMessage.time), {
                  addSuffix: true,
                })
              : "Time unknown";

            return (
              <ListItem
                key={index}
                disablePadding
                onMouseEnter={() => handleChatMouseEnter(chat.id)}
                onMouseLeave={handleChatMouseLeave}
                sx={{ "&:not(:last-child)": { mb: 1.5 }, position: "relative" }}
              >
                <ListItemButton
                  disableRipple
                  onClick={() =>
                    handleChatClick("chat", chat.id, chat.projectId)
                  }
                  sx={{
                    px: 2.5,
                    py: 2.5,
                    width: "100%",
                    borderRadius: 1,
                    alignItems: "flex-start",
                    height: 72,
                    ...(activeCondition && {
                      backgroundColor: (theme) =>
                        `${theme.palette.primary.main} !important`,
                    }),
                  }}
                >
                  <ListItemText
                    sx={{
                      my: 0,
                      ml: 4,
                      mr: 1.5,
                      "& .MuiTypography-root": {
                        ...(activeCondition && { color: "common.white" }),
                      },
                    }}
                    primary={
                      <Typography
                        noWrap
                        sx={{
                          ...(!activeCondition
                            ? { color: "text.secondary" }
                            : {}),
                        }}
                      >
                        {chat.fullName}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        noWrap
                        variant="body2"
                        sx={{
                          ...(!activeCondition && { color: "text.disabled" }),
                        }}
                      >
                        {lastMessage ? lastMessage.message : null}
                      </Typography>
                    }
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                    }}
                  >
                    <IconButton
                      className="chat-actions"
                      onClick={(e) => handleMenuClick(e, chat.id)}
                      sx={{
                        visibility:
                          hoveredChat === chat.id ? "visible" : "hidden",
                      }}
                    >
                      <Icon icon="mdi:dots-horizontal" />
                    </IconButton>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </>
      );
      return (
        <>
          {renderGroupedChats(groupedChats.today, "Today")}
          {renderGroupedChats(groupedChats.yesterday, "Yesterday")}
          {renderGroupedChats(groupedChats.last7Days, "Last 7 Days")}
          {renderGroupedChats(groupedChats.last30Days, "Last 30 Days")}
          {renderGroupedChats(groupedChats.older, "Older")}
        </>
      );
    }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Typography
          variant="h6"
          sx={{ px: 3, pt: 3, pb: 2, color: "primary.main" }}
        >
          Chats
        </Typography>
        <ScrollWrapper hidden={hidden}>
          <List sx={{ px: 3, pb: 3, maxHeight: "45vh" }}>{renderChats()}</List>
        </ScrollWrapper>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </>
  );
};

export default Chats;
